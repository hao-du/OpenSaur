namespace OpenSaur.Identity.Web.Infrastructure.Http.Responses;

public static class ApiRequestClassifier
{
    public static bool IsApiRequest(HttpRequest request)
    {
        return request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase);
    }
}
