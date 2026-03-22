using OpenSaur.Identity.Web.Domain.Identity;

namespace OpenSaur.Identity.Web.Tests.Domain.Identity;

public sealed class ApplicationUserTests
{
    [Fact]
    public void NewUser_DefaultsToRequirePasswordChange()
    {
        var user = new ApplicationUser();

        Assert.True(user.RequirePasswordChange);
    }
}
