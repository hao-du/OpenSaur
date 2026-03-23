using System.Security.Claims;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Resilience;

public static class EndpointResilienceCallerScope
{
    public static string GetPartitionKey(HttpContext httpContext)
    {
        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            var subject = httpContext.User.FindFirstValue(ApplicationClaimTypes.Subject)
                          ?? httpContext.User.FindFirstValue(ApplicationClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(subject))
            {
                return $"user:{subject}";
            }
        }

        return $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
    }
}
