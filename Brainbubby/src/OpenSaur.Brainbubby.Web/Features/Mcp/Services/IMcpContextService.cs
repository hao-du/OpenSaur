using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace OpenSaur.Brainbubby.Web.Features.Mcp.Services;

public interface IMcpContextService
{
    Task<(McpContext? Context, string? ErrorMessage)> ResolveContextAsync(
        Guid? projectIdOverride = null,
        CancellationToken cancellationToken = default);

    Task<(McpContext? Context, string? ErrorMessage)> ResolveContextAsync(
        HttpContext httpContext,
        ClaimsPrincipal principal,
        Guid? projectIdOverride = null,
        CancellationToken cancellationToken = default);
}
