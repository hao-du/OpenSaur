namespace OpenSaur.Zentry.Web.Infrastructure.Messaging;

public interface IUserSyncPublisher
{
    Task PublishUserAsync(Guid userId, string eventType, CancellationToken cancellationToken = default);
    Task PublishUsersAsync(IEnumerable<Guid> userIds, string eventType, CancellationToken cancellationToken = default);
}
