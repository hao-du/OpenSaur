namespace OpenSaur.CashPilot.Web.Infrastructure.Messaging.Contracts;

public sealed record UserSyncEvent(
    Guid Id,
    string Email,
    string UserName,
    string FirstName,
    string LastName,
    Guid WorkspaceId,
    string WorkspaceName,
    string UserSettings,
    string[] Roles,
    string[] Permissions,
    bool IsActive,
    DateTime UpdatedOn,
    string EventType
);