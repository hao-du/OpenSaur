using System.Text.Json;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Domain.Outbox;
using OpenSaur.Identity.Web.Domain.Workspaces;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Outbox;

public sealed class OutboxMessageWriter(ApplicationDbContext dbContext)
{
    public void EnqueueUserRoleCreated(ApplicationUserRole userRole, Guid changedByUserId)
    {
        EnsureUserRoleId(userRole);

        Enqueue(
            OutboxEventNames.UserRoleCreated,
            OutboxAggregateTypes.UserRole,
            userRole.Id,
            $"{OutboxEventNames.UserRoleCreated} event for {OutboxAggregateTypes.UserRole} {userRole.Id}.",
            new UserRoleEventPayload(
                userRole.Id,
                userRole.UserId,
                userRole.RoleId,
                userRole.IsActive),
            changedByUserId);
    }

    public void EnqueueUserRoleUpdated(ApplicationUserRole userRole, Guid changedByUserId)
    {
        EnsureUserRoleId(userRole);

        Enqueue(
            OutboxEventNames.UserRoleUpdated,
            OutboxAggregateTypes.UserRole,
            userRole.Id,
            $"{OutboxEventNames.UserRoleUpdated} event for {OutboxAggregateTypes.UserRole} {userRole.Id}.",
            new UserRoleEventPayload(
                userRole.Id,
                userRole.UserId,
                userRole.RoleId,
                userRole.IsActive),
            changedByUserId);
    }

    public void EnqueueRolePermissionsCreated(
        ApplicationRole role,
        IReadOnlyCollection<string> permissionCodes,
        Guid changedByUserId)
    {
        Enqueue(
            OutboxEventNames.RolePermissionsCreated,
            OutboxAggregateTypes.RolePermissionAssignment,
            role.Id,
            $"{OutboxEventNames.RolePermissionsCreated} event for {OutboxAggregateTypes.RolePermissionAssignment} {role.Id}.",
            new RolePermissionsEventPayload(
                role.Id,
                role.Name ?? string.Empty,
                role.IsActive,
                permissionCodes.Order(StringComparer.Ordinal).ToArray()),
            changedByUserId);
    }

    public void EnqueueRolePermissionsUpdated(
        ApplicationRole role,
        IReadOnlyCollection<string> permissionCodes,
        Guid changedByUserId)
    {
        Enqueue(
            OutboxEventNames.RolePermissionsUpdated,
            OutboxAggregateTypes.RolePermissionAssignment,
            role.Id,
            $"{OutboxEventNames.RolePermissionsUpdated} event for {OutboxAggregateTypes.RolePermissionAssignment} {role.Id}.",
            new RolePermissionsEventPayload(
                role.Id,
                role.Name ?? string.Empty,
                role.IsActive,
                permissionCodes.Order(StringComparer.Ordinal).ToArray()),
            changedByUserId);
    }

    public void EnqueueWorkspaceCreated(
        Workspace workspace,
        IReadOnlyCollection<Guid> assignedRoleIds,
        Guid changedByUserId)
    {
        Enqueue(
            OutboxEventNames.WorkspaceCreated,
            OutboxAggregateTypes.Workspace,
            workspace.Id,
            $"{OutboxEventNames.WorkspaceCreated} event for {OutboxAggregateTypes.Workspace} {workspace.Id}.",
            new WorkspaceEventPayload(
                workspace.Id,
                workspace.Name,
                workspace.Description,
                workspace.IsActive,
                assignedRoleIds.Order().ToArray()),
            changedByUserId);
    }

    public void EnqueueWorkspaceUpdated(
        Workspace workspace,
        IReadOnlyCollection<Guid> assignedRoleIds,
        Guid changedByUserId)
    {
        Enqueue(
            OutboxEventNames.WorkspaceUpdated,
            OutboxAggregateTypes.Workspace,
            workspace.Id,
            $"{OutboxEventNames.WorkspaceUpdated} event for {OutboxAggregateTypes.Workspace} {workspace.Id}.",
            new WorkspaceEventPayload(
                workspace.Id,
                workspace.Name,
                workspace.Description,
                workspace.IsActive,
                assignedRoleIds.Order().ToArray()),
            changedByUserId);
    }

    public void Enqueue<TPayload>(
        string eventName,
        string aggregateType,
        Guid aggregateId,
        string description,
        TPayload payload,
        Guid changedByUserId)
    {
        dbContext.OutboxMessages.Add(
            new OutboxMessage
            {
                EventName = eventName,
                AggregateType = aggregateType,
                AggregateId = aggregateId,
                Description = description,
                Payload = JsonSerializer.Serialize(payload),
                Status = OutboxStatuses.Pending,
                Retries = 0,
                Error = null,
                OccurredOn = DateTime.UtcNow,
                CreatedBy = changedByUserId
            });
    }

    private static void EnsureUserRoleId(ApplicationUserRole userRole)
    {
        if (userRole.Id == Guid.Empty)
        {
            userRole.Id = Guid.CreateVersion7();
        }
    }
}
