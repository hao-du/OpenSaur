using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Mcp.Services;

public sealed record McpContext(
    CurrentUserContext UserContext,
    User CurrentUser,
    Project CurrentProject,
    bool CanEdit);
