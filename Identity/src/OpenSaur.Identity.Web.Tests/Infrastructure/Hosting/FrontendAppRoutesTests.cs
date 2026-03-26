using Microsoft.AspNetCore.Http;
using OpenSaur.Identity.Web.Infrastructure.Hosting;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Hosting;

public sealed class FrontendAppRoutesTests
{
    [Theory]
    [InlineData("/", true)]
    [InlineData("/login", true)]
    [InlineData("/auth/callback", true)]
    [InlineData("/change-password", true)]
    [InlineData("/api/auth/me", false)]
    [InlineData("/connect/token", false)]
    [InlineData("/swagger/index.html", false)]
    [InlineData("/unknown", false)]
    public void IsShellRoute_returns_expected_value(string path, bool expected)
    {
        var actual = FrontendAppRoutes.IsShellRoute(new PathString(path));

        Assert.Equal(expected, actual);
    }
}
