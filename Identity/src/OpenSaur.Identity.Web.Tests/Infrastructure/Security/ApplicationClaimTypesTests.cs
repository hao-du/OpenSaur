using System.IdentityModel.Tokens.Jwt;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Security;

public sealed class ApplicationClaimTypesTests
{
    [Fact]
    public void Constants_UseExplicitJwtAndOidcClaimNames()
    {
        Assert.Equal(JwtRegisteredClaimNames.Name, ApplicationClaimTypes.Name);
        Assert.Equal("roles", ApplicationClaimTypes.Role);
    }
}
