using OpenSaur.Zentry.Web.Infrastructure.Configuration;

namespace OpenSaur.Zentry.Web.Infrastructure.Hosting;

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
            headers.TryAdd("Content-Security-Policy", BuildContentSecurityPolicy(oidcOptions, environment));

            if (!environment.IsDevelopment())
            {
                headers.TryAdd("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            }

            await next();
        });
    }

    private static string BuildContentSecurityPolicy(OidcOptions oidcOptions, IWebHostEnvironment environment)
    {
        var authority = new Uri(oidcOptions.Authority).GetLeftPart(UriPartial.Authority);
        var upgradeInsecureRequests = environment.IsDevelopment()
            ? string.Empty
            : " upgrade-insecure-requests;";

        return string.Join(
            " ",
            "default-src 'self';",
            "base-uri 'self';",
            $"connect-src 'self' {authority};",
            "font-src 'self' data:;",
            "form-action 'self';",
            "frame-ancestors 'none';",
            "frame-src 'none';",
            "img-src 'self' data:;",
            "object-src 'none';",
            "script-src 'self';",
            "style-src 'self' 'unsafe-inline';",
            upgradeInsecureRequests);
    }
}
