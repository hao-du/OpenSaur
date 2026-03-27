using OpenSaur.Identity.Web.Features.Auth;

namespace OpenSaur.Identity.Web.Tests.Features.Auth;

public sealed class AuthCookieNamesTests
{
    [Fact]
    public void CookieNames_AreCentralized()
    {
        Assert.Equal("s", AuthCookieNames.Session);
        Assert.Equal("r", AuthCookieNames.Refresh);
    }
}
