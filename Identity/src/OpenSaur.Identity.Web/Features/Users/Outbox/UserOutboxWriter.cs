using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Outbox;
using OpenSaur.Identity.Web.Infrastructure.Database.Outbox;

namespace OpenSaur.Identity.Web.Features.Users.Outbox;

public sealed class UserOutboxWriter(OutboxMessageWriter outboxMessageWriter)
{
    public void EnqueueUserCreated(ApplicationUser user, Guid changedByUserId)
    {
        outboxMessageWriter.Enqueue(
            OutboxEventNames.UserCreated,
            OutboxAggregateTypes.User,
            user.Id,
            $"{OutboxEventNames.UserCreated} event for {OutboxAggregateTypes.User} {user.Id}.",
            new UserEventPayload(
                user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                user.WorkspaceId,
                user.IsActive,
                user.RequirePasswordChange,
                user.UserSettings),
            changedByUserId);
    }

    public void EnqueueUserUpdated(ApplicationUser user, Guid changedByUserId)
    {
        outboxMessageWriter.Enqueue(
            OutboxEventNames.UserUpdated,
            OutboxAggregateTypes.User,
            user.Id,
            $"{OutboxEventNames.UserUpdated} event for {OutboxAggregateTypes.User} {user.Id}.",
            new UserEventPayload(
                user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                user.WorkspaceId,
                user.IsActive,
                user.RequirePasswordChange,
                user.UserSettings),
            changedByUserId);
    }
}
