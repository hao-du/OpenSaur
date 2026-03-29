namespace OpenSaur.Identity.Web.Infrastructure.Results;

public static class ApiErrorCodes
{
    public const string Validation = "validation_error";
    public const string Unauthorized = "unauthorized";
    public const string Forbidden = "forbidden";
    public const string NotFound = "not_found";
    public const string Conflict = "conflict";
    public const string Server = "server_error";

    public const string AuthInvalidCredentials = "auth_invalid_credentials";
    public const string UserWorkspaceCapacityReached = "user_workspace_capacity_reached";
}
