namespace OpenSaur.Identity.Web.Infrastructure.Security;

internal sealed class NullCurrentUserAccessor : ICurrentUserAccessor
{
    private NullCurrentUserAccessor()
    {
    }

    public static NullCurrentUserAccessor Instance { get; } = new();

    public Guid? GetCurrentUserId() => null;
}
