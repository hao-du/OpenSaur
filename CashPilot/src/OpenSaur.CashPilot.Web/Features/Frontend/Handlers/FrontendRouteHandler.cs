using Microsoft.Extensions.FileProviders;
using OpenSaur.CashPilot.Web.Infrastructure.Helpers;

namespace OpenSaur.CashPilot.Web.Features.Frontend.Handlers;

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
