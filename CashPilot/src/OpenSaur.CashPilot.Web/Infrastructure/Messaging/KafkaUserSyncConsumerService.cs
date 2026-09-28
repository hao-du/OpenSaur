using System.Text.Json;
using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Infrastructure.Caching;
using OpenSaur.CashPilot.Web.Infrastructure.Configuration;
using OpenSaur.CashPilot.Web.Infrastructure.Database;
using OpenSaur.CashPilot.Web.Infrastructure.Messaging.Contracts;

namespace OpenSaur.CashPilot.Web.Infrastructure.Messaging;

public sealed class KafkaUserSyncConsumerService(
    IServiceScopeFactory scopeFactory,
    IOptions<KafkaOptions> kafkaOptions,
    ILogger<KafkaUserSyncConsumerService> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly Guid SystemUserId = Guid.Empty;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = kafkaOptions.Value;
        if (!options.Enabled || string.IsNullOrWhiteSpace(options.BootstrapServers))
        {
            logger.LogInformation("Kafka user sync consumer is disabled or BootstrapServers is empty. Skipping consumer loop.");
            return;
        }

        await Task.Yield();

        var consumerConfig = BuildConsumerConfig(options);
        var topic = string.IsNullOrWhiteSpace(options.UserSyncTopic) ? "zentry-user-sync" : options.UserSyncTopic;

        using var consumer = new ConsumerBuilder<string, string>(consumerConfig)
            .SetErrorHandler((_, error) =>
            {
                if (error.IsFatal)
                {
                    logger.LogError("Kafka Consumer fatal error: {Reason}", error.Reason);
                }
                else
                {
                    logger.LogWarning("Kafka Consumer warning: {Reason}", error.Reason);
                }
            })
            .Build();

        consumer.Subscribe(topic);
        logger.LogInformation("Subscribed to Kafka topic {Topic} with GroupId {GroupId}", topic, consumerConfig.GroupId);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var consumeResult = consumer.Consume(stoppingToken);
                if (string.IsNullOrWhiteSpace(consumeResult?.Message?.Value))
                {
                    if (consumeResult is not null)
                    {
                        consumer.Commit(consumeResult);
                    }
                    continue;
                }

                var syncEvent = JsonSerializer.Deserialize<UserSyncEvent>(consumeResult.Message.Value, JsonOptions);
                if (syncEvent is not null && syncEvent.Id != Guid.Empty)
                {
                    await ProcessUserSyncAsync(syncEvent, stoppingToken);
                }

                consumer.Commit(consumeResult);
            }
            catch (ConsumeException ex)
            {
                logger.LogWarning(ex, "Kafka ConsumeException: {Reason}", ex.Error.Reason);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unexpected error processing Kafka user sync message.");
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        try
        {
            consumer.Close();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error closing Kafka consumer.");
        }
    }

    private static ConsumerConfig BuildConsumerConfig(KafkaOptions options)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = options.BootstrapServers,
            GroupId = string.IsNullOrWhiteSpace(options.GroupId) ? "cashpilot-user-sync-consumer" : options.GroupId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false,
            EnableAutoOffsetStore = false
        };

        if (Enum.TryParse<SecurityProtocol>(options.SecurityProtocol, true, out var securityProtocol))
        {
            config.SecurityProtocol = securityProtocol;
        }

        if (Enum.TryParse<SaslMechanism>(options.SaslMechanism, true, out var saslMechanism))
        {
            config.SaslMechanism = saslMechanism;
        }

        if (!string.IsNullOrWhiteSpace(options.SaslUsername))
        {
            config.SaslUsername = options.SaslUsername;
        }

        if (!string.IsNullOrWhiteSpace(options.SaslPassword))
        {
            config.SaslPassword = options.SaslPassword;
        }

        if (!string.IsNullOrWhiteSpace(options.SslCaCertificate))
        {
            config.SslCaPem = options.SslCaCertificate;
        }
        else if (!string.IsNullOrWhiteSpace(options.SslCaLocation))
        {
            config.SslCaLocation = options.SslCaLocation;
        }

        return config;
    }

    private async Task ProcessUserSyncAsync(UserSyncEvent syncEvent, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CashPilotDbContext>();
        var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();

        var existingUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == syncEvent.Id, cancellationToken);
        if (existingUser is null)
        {
            var newUser = new User
            {
                Id = syncEvent.Id,
                Email = syncEvent.Email ?? string.Empty,
                UserName = syncEvent.UserName ?? string.Empty,
                FirstName = syncEvent.FirstName ?? string.Empty,
                LastName = syncEvent.LastName ?? string.Empty,
                WorkspaceId = syncEvent.WorkspaceId,
                WorkspaceName = syncEvent.WorkspaceName ?? string.Empty,
                UserSettings = string.IsNullOrWhiteSpace(syncEvent.UserSettings) ? "{}" : syncEvent.UserSettings,
                Roles = syncEvent.Roles ?? [],
                Permissions = syncEvent.Permissions ?? [],
                IsActive = syncEvent.IsActive,
                CreatedBy = SystemUserId,
                CreatedOn = syncEvent.UpdatedOn == default ? DateTime.UtcNow : syncEvent.UpdatedOn,
                UpdatedBy = null,
                UpdatedOn = syncEvent.UpdatedOn == default ? DateTime.UtcNow : syncEvent.UpdatedOn
            };

            dbContext.Users.Add(newUser);
        }
        else
        {
            existingUser.Email = syncEvent.Email ?? string.Empty;
            existingUser.UserName = syncEvent.UserName ?? string.Empty;
            existingUser.FirstName = syncEvent.FirstName ?? string.Empty;
            existingUser.LastName = syncEvent.LastName ?? string.Empty;
            existingUser.WorkspaceId = syncEvent.WorkspaceId;
            existingUser.WorkspaceName = syncEvent.WorkspaceName ?? string.Empty;
            existingUser.UserSettings = string.IsNullOrWhiteSpace(syncEvent.UserSettings) ? "{}" : syncEvent.UserSettings;
            existingUser.Roles = syncEvent.Roles ?? [];
            existingUser.Permissions = syncEvent.Permissions ?? [];
            existingUser.IsActive = syncEvent.IsActive;
            existingUser.UpdatedOn = syncEvent.UpdatedOn == default ? DateTime.UtcNow : syncEvent.UpdatedOn;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Invalidate cached profile for this user
        var profileCacheKey = CacheConstants.ProfileKey(syncEvent.Id);
        await cacheService.RemoveAsync(profileCacheKey, cancellationToken);

        logger.LogInformation(
            "Successfully synced user {UserId} ({Email}) from event {EventType}",
            syncEvent.Id, syncEvent.Email, syncEvent.EventType);
    }
}