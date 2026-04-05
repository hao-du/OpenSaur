using OpenSaur.Identity.Web.Domain.Common;

namespace OpenSaur.Identity.Web.Domain.Oidc;

public sealed class OidcClientOrigin : AuditedEntity
{
    public string BaseUri { get; set; } = string.Empty;

    public Guid OidcClientId { get; set; }

    public OidcClient? OidcClient { get; set; }
}
