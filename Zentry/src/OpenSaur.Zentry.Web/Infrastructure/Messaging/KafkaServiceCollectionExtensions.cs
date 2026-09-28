using Confluent.Kafka;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;

namespace OpenSaur.Zentry.Web.Infrastructure.Messaging;

public interface IKafkaProducerAccessor
{
    IProducer<string, string>? Producer { get; }
}

public sealed class KafkaProducerAccessor : IKafkaProducerAccessor, IDisposable
{
    public IProducer<string, string>? Producer { get; }

    public KafkaProducerAccessor(IOptions<KafkaOptions> optionsAccessor, ILogger<KafkaProducerAccessor> logger)
    {
        var options = optionsAccessor.Value;
        if (!options.Enabled || string.IsNullOrWhiteSpace(options.BootstrapServers))
        {
            Producer = null;
            return;
        }

        var config = new ProducerConfig
        {
            BootstrapServers = options.BootstrapServers,
            Acks = options.EnableIdempotence ? Acks.All : Acks.Leader,
            EnableIdempotence = options.EnableIdempotence
        };

        if (options.EnableIdempotence)
        {
            config.MaxInFlight = 1;
            config.MessageSendMaxRetries = int.MaxValue;
        }

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
            config.SslCaPem = NormalizePemCertificate(options.SslCaCertificate);
        }
        else if (!string.IsNullOrWhiteSpace(options.SslCaLocation))
        {
            config.SslCaLocation = options.SslCaLocation;
        }

        Producer = new ProducerBuilder<string, string>(config)
            .SetErrorHandler((_, error) =>
            {
                if (error.IsFatal)
                {
                    logger.LogError("Kafka Producer fatal error: {Reason}", error.Reason);
                }
                else
                {
                    logger.LogWarning("Kafka Producer warning: {Reason}", error.Reason);
                }
            })
            .Build();
    }

    public void Dispose()
    {
        Producer?.Flush(TimeSpan.FromSeconds(5));
        Producer?.Dispose();
    }

    private static string NormalizePemCertificate(string rawCert)
    {
        if (string.IsNullOrWhiteSpace(rawCert))
        {
            return string.Empty;
        }

        var cert = rawCert.Replace("\\n", "\n").Trim();
        const string beginHeader = "-----BEGIN CERTIFICATE-----";
        const string endHeader = "-----END CERTIFICATE-----";

        if (!cert.Contains(beginHeader) || !cert.Contains(endHeader))
        {
            return cert;
        }

        var startIndex = cert.IndexOf(beginHeader, StringComparison.Ordinal) + beginHeader.Length;
        var endIndex = cert.IndexOf(endHeader, StringComparison.Ordinal);
        var base64 = cert[startIndex..endIndex]
            .Replace(" ", "")
            .Replace("\r", "")
            .Replace("\n", "");

        var sb = new System.Text.StringBuilder();
        sb.AppendLine(beginHeader);
        for (var i = 0; i < base64.Length; i += 64)
        {
            var lineLength = Math.Min(64, base64.Length - i);
            sb.AppendLine(base64.Substring(i, lineLength));
        }
        sb.AppendLine(endHeader);

        return sb.ToString();
    }
}

public static class KafkaServiceCollectionExtensions
{
    public static IServiceCollection AddKafkaProducer(this IServiceCollection services)
    {
        services.AddSingleton<IKafkaProducerAccessor, KafkaProducerAccessor>();
        services.AddScoped<IUserSyncPublisher, KafkaUserSyncPublisher>();
        return services;
    }
}
