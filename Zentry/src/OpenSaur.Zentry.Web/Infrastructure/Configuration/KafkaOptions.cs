namespace OpenSaur.Zentry.Web.Infrastructure.Configuration;

public sealed class KafkaOptions
{
    public const string SectionName = "Kafka";

    public string BootstrapServers { get; set; } = string.Empty;

    public string SecurityProtocol { get; set; } = "SaslSsl";

    public string SaslMechanism { get; set; } = "ScramSha256";

    public string SaslUsername { get; set; } = string.Empty;

    public string SaslPassword { get; set; } = string.Empty;

    public string? SslCaLocation { get; set; }

    public string? SslCaCertificate { get; set; }

    public string UserSyncTopic { get; set; } = "zentry-user-sync";

    public bool Enabled { get; set; } = true;

    public bool EnableIdempotence { get; set; } = false;
}
