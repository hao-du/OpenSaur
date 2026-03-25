namespace OpenSaur.Identity.Web.Tests.Features.Auth;

public sealed class AuthSliceStructureTests
{
    [Fact]
    public void AuthSlice_ExposesDedicatedHandlerAndContractTypes()
    {
        var assembly = typeof(Program).Assembly;

        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.AuthEndpoints"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.Login.LoginHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.Login.LoginRequest"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.Logout.LogoutHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.ChangePassword.ChangePasswordHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.ChangePassword.ChangePasswordRequest"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.Me.GetCurrentUserHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Auth.Me.AuthMeResponse"));
    }
}
