using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Features.Frontend.Dtos;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Text.Json;

namespace OpenSaur.Zentry.Web.Features.Frontend.Handlers;

public class CreateAppConfigJsHandler(
    IHttpContextAccessor httpContextAccessor,
    IOptions<OidcOptions> oidcOptions
)
{
    private readonly JsonSerializerOptions RuntimeConfigSerializerOptions = new(JsonSerializerDefaults.Web);

    public Task<IResult> HandleAppConfigJs()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return (Task<IResult>)Task.FromException(new Exception("httpContext is null"));
        }

        var currentAppBaseUri = UriHelper.GetCurrentAppBaseUri(oidcOptions.Value.CurrentAppBaseUri);

        UriHelper.ApplyNoStoreHeaders(httpContext.Response);
        var runtimeConfig = new FrontentAppConfigJsDto(
            oidcOptions.Value.AppName,
            UriHelper.NormalizeBasePath(currentAppBaseUri.AbsolutePath),
            oidcOptions.Value.Authority,
            oidcOptions.Value.ClientId,
            new Uri(currentAppBaseUri, oidcOptions.Value.RedirectPath.TrimStart('/')).AbsoluteUri,
            new Uri(currentAppBaseUri, oidcOptions.Value.PostLogoutRedirectPath.TrimStart('/')).AbsoluteUri,
            oidcOptions.Value.Scope);

        return Task.FromResult<IResult>(TypedResults.Text(
            $"window.__ZENTRY_CONFIG__ = Object.freeze({JsonSerializer.Serialize(runtimeConfig, RuntimeConfigSerializerOptions)});",
            "application/javascript; charset=utf-8"));
    }
}
