using OpenSaur.CashPilot.Web.Infrastructure.ConfigurationOptions;

namespace OpenSaur.CashPilot.Web.Infrastructure.Hosting;

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app,
        OidcOptions oidcOptions,
        IWebHostEnvironment environment)
    {
        return app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;

            headers.TryAdd("X-Content-Type-Options", "nosniff");
            headers.TryAdd("X-Frame-Options", "DENY");
            headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
            headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

            if (!environment.IsDevelopment())
            {
                headers.TryAdd("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            }

            await next();
        });
    }

}
