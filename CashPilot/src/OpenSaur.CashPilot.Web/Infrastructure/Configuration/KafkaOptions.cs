namespace OpenSaur.CashPilot.Web.Infrastructure.Configuration;

public sealed class KafkaOptions
{
    public const string SectionName = "Kafka";

    public string BootstrapServers { get; set; } = string.Empty;

    public string SecurityProtocol { get; set; } = string.Empty;

    public string SaslMechanism { get; set; } = string.Empty;

    public string SaslUsername { get; set; } = string.Empty;

    public string SaslPassword { get; set; } = string.Empty;

    public string SslCaLocation { get; set; } = string.Empty;

    public string SslCaCertificate { get; set; } = string.Empty;

    public string UserSyncTopic { get; set; } = string.Empty;

    public string GroupId { get; set; } = string.Empty;

    public bool Enabled { get; set; } = false;
}