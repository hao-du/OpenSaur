using OpenSaur.Zentry.Web.Domain.Common;

namespace OpenSaur.Zentry.Web.Domain.Outbox;

public class OutboxMessage : EntityBase
{
    public string EventName { get; set; } = string.Empty;

    public string AggregateType { get; set; } = string.Empty;

    public Guid AggregateId { get; set; }

    public string Payload { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public int Retries { get; set; }

    public string? Error { get; set; }

    public DateTime OccurredOn { get; set; }

    public DateTime? ProcessedOn { get; set; }
}
