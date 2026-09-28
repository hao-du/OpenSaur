using System.Text.Json;
using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Database;
using OpenSaur.Zentry.Web.Infrastructure.Messaging.Contracts;

namespace OpenSaur.Zentry.Web.Infrastructure.Messaging;

public sealed class KafkaUserSyncPublisher(
    ApplicationDbContext dbContext,
    IKafkaProducerAccessor producerAccessor,
    IOptions<KafkaOptions> kafkaOptions,
    ILogger<KafkaUserSyncPublisher> logger) : IUserSyncPublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task PublishUserAsync(Guid userId, string eventType, CancellationToken cancellationToken = default)
    {
        await PublishUsersAsync([userId], eventType, cancellationToken);
    }

    public async Task PublishUsersAsync(IEnumerable<Guid> userIds, string eventType, CancellationToken cancellationToken = default)
    {
        var targetUserIds = userIds.Distinct().ToList();
        if (targetUserIds.Count == 0)
        {
            return;
        }

        var options = kafkaOptions.Value;
        if (!options.Enabled)
        {
            logger.LogDebug("Kafka is disabled in configuration. Skipping user sync publishing.");
            return;
        }

        var producer = producerAccessor.Producer;
        if (producer is null)
        {
            logger.LogWarning("Kafka producer is not available. Skipping user sync publishing for users: {UserIds}", targetUserIds);
            return;
        }

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(user => targetUserIds.Contains(user.Id))
            .Select(user => new
            {
                user.Id,
                user.Email,
                user.UserName,
                user.FirstName,
                user.LastName,
                user.WorkspaceId,
                WorkspaceName = user.Workspace != null ? user.Workspace.Name : string.Empty,
                user.UserSettings,
                user.IsActive,
                user.UpdatedOn,
                user.CreatedOn,
                RoleIds = user.UserRoles.Select(ur => ur.RoleId).ToList(),
                RoleNames = user.UserRoles.Where(ur => ur.Role != null).Select(ur => ur.Role!.Name!).ToList()
            })
            .ToListAsync(cancellationToken);

        if (users.Count == 0)
        {
            return;
        }

        var allRoleIds = users.SelectMany(u => u.RoleIds).Distinct().ToList();
        var permissionsByRoleId = await dbContext.RolePermissions
            .AsNoTracking()
            .Where(rp => allRoleIds.Contains(rp.RoleId) && rp.Permission != null)
            .Select(rp => new { rp.RoleId, rp.Permission!.Code })
            .ToListAsync(cancellationToken);

        var permissionsLookup = permissionsByRoleId
            .GroupBy(rp => rp.RoleId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Code).Distinct().ToList());

        var now = DateTime.UtcNow;
        var topic = options.UserSyncTopic;

        foreach (var user in users)
        {
            var userRoleIds = user.RoleIds;
            var roles = user.RoleNames.ToArray();
            var permissions = userRoleIds
                .Where(rId => permissionsLookup.ContainsKey(rId))
                .SelectMany(rId => permissionsLookup[rId])
                .Distinct()
                .OrderBy(c => c)
                .ToArray();

            var syncEvent = new UserSyncEvent(
                Id: user.Id,
                Email: user.Email ?? string.Empty,
                UserName: user.UserName ?? string.Empty,
                FirstName: user.FirstName,
                LastName: user.LastName,
                WorkspaceId: user.WorkspaceId,
                WorkspaceName: user.WorkspaceName,
                UserSettings: user.UserSettings ?? "{}",
                Roles: roles,
                Permissions: permissions,
                IsActive: user.IsActive,
                UpdatedOn: user.UpdatedOn ?? (user.CreatedOn == default ? now : user.CreatedOn),
                EventType: eventType
            );

            var payload = JsonSerializer.Serialize(syncEvent, JsonOptions);
            var key = user.Id.ToString();

            try
            {
                var deliveryResult = await producer.ProduceAsync(topic, new Message<string, string>
                {
                    Key = key,
                    Value = payload
                }, cancellationToken);

                logger.LogInformation(
                    "Published UserSync event for user {UserId} (EventType: {EventType}) to topic {Topic} at offset {Offset}",
                    user.Id, eventType, topic, deliveryResult.Offset);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to publish UserSync event for user {UserId} to Kafka topic {Topic}", user.Id, topic);
                // Do not throw to avoid crashing primary business flows if Kafka is temporarily unreachable
            }
        }
    }
}
