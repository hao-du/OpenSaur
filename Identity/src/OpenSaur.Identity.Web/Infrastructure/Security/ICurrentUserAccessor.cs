namespace OpenSaur.Identity.Web.Infrastructure.Security;

public interface ICurrentUserAccessor
{
    Guid? GetCurrentUserId();
}
