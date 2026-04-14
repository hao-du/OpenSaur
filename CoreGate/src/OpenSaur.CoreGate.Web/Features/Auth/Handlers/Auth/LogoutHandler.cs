using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using OpenSaur.CoreGate.Web.Domain.Identity;
using OpenSaur.CoreGate.Web.Features.Auth.Dtos;
using OpenSaur.CoreGate.Web.Infrastructure.Database;

namespace OpenSaur.CoreGate.Web.Features.Auth.Handlers.Auth;

public class LogoutHandler(IHttpContextAccessor httpContextAccessor)
{
    public Task HandleLogoutAsync()
    {
        if (httpContextAccessor.HttpContext is null)
        {
            return Task.CompletedTask;
        }

        return httpContextAccessor.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
    }
}
