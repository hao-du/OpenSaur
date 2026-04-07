namespace OpenSaur.Umbraco.Web.Authentication;

internal sealed class OpenSaurIdentityBackOfficeOptions
{
    public const string SectionName = "OpenSaurIdentityBackOffice";

    public string Authority { get; set; } = string.Empty;

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string CallbackPath { get; set; } = "/signin-oidc";

    public string SignedOutCallbackPath { get; set; } = "/signout-callback-oidc";

    public string DefaultCulture { get; set; } = "en-US";
}
