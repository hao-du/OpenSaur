using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;
using System.Text.Json;

namespace OpenSaur.Zentry.Web.Features.Frontend.Handlers;

public class CreateFrontendRouteHandler(
    IHttpContextAccessor httpContextAccessor,
    IWebHostEnvironment environment
)
{
    public Task<IResult> HandleFrontendRoute()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return (Task<IResult>)Task.FromException(new Exception("httpContext is null"));
        }

        UriHelper.ApplyNoStoreHeaders(httpContext.Response);
        IFileInfo indexFile = environment.WebRootFileProvider.GetFileInfo("index.html");
        if (!indexFile.Exists || string.IsNullOrWhiteSpace(indexFile.PhysicalPath))
        {
            return Task.FromResult<IResult>(TypedResults.NotFound());
        }

        return Task.FromResult<IResult>(TypedResults.PhysicalFile(indexFile.PhysicalPath, "text/html; charset=utf-8"));
    }
}
