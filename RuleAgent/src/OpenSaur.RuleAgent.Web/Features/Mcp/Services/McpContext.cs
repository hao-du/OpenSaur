using OpenSaur.RuleAgent.Web.Domain;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Mcp.Services;

public sealed record McpContext(
    CurrentUserContext UserContext,
    User CurrentUser,
    Project CurrentProject,
    bool CanEdit);
