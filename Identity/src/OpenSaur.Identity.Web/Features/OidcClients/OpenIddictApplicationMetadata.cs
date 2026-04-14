using System.Text.Json;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;

namespace OpenSaur.Identity.Web.Features.OidcClients;

internal sealed record OpenIddictApplicationMetadata(
    string AppPathBase,
    string CallbackPath,
    string Description,
    bool IsActive,
    string[] Origins,
    string PostLogoutPath,
    string Scope)
{
    public string[] RedirectUris =>
        Origins.Select(origin => OidcClientRequestNormalization.CombineAbsoluteUri(origin, AppPathBase, CallbackPath))
            .ToArray();

    public string[] PostLogoutRedirectUris =>
        Origins.Select(origin => OidcClientRequestNormalization.CombineAbsoluteUri(origin, AppPathBase, PostLogoutPath))
            .ToArray();
}

internal static class OpenIddictApplicationMetadataMapper
{
    private const string AppPathBasePropertyName = "opensaur_app_path_base";
    private const string CallbackPathPropertyName = "opensaur_callback_path";
    private const string DescriptionPropertyName = "opensaur_description";
    private const string IsActivePropertyName = "opensaur_is_active";
    private const string OriginsPropertyName = "opensaur_origins";
    private const string PostLogoutPathPropertyName = "opensaur_post_logout_path";
    private const string ScopePropertyName = "opensaur_scope";

    public static OpenIddictApplicationMetadata Read(OpenIddictEntityFrameworkCoreApplication<Guid> application)
    {
        var redirectUris = ParseStringArray(application.RedirectUris);
        var postLogoutRedirectUris = ParseStringArray(application.PostLogoutRedirectUris);
        var properties = ParseProperties(application.Properties);
        var appPathBase = ReadString(properties, AppPathBasePropertyName) ?? "/";
        var callbackPath = ReadString(properties, CallbackPathPropertyName)
            ?? redirectUris.Select(TryGetPath).FirstOrDefault(path => path is not null)
            ?? "/signin-oidc";
        var postLogoutPath = ReadString(properties, PostLogoutPathPropertyName)
            ?? postLogoutRedirectUris.Select(TryGetPath).FirstOrDefault(path => path is not null)
            ?? "/auth-required";
        var origins = ReadStringArray(properties, OriginsPropertyName);
        if (origins.Length == 0)
        {
            origins = redirectUris
                .Concat(postLogoutRedirectUris)
                .Select(TryGetOrigin)
                .Where(static origin => origin is not null)
                .Cast<string>()
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(static origin => origin, StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        var scope = ReadString(properties, ScopePropertyName);
        if (string.IsNullOrWhiteSpace(scope))
        {
            scope = string.Join(
                ' ',
                ParseStringArray(application.Permissions)
                    .Where(permission => permission.StartsWith(OpenIddictConstants.Permissions.Prefixes.Scope, StringComparison.Ordinal))
                    .Select(permission => permission[OpenIddictConstants.Permissions.Prefixes.Scope.Length..])
                    .Distinct(StringComparer.Ordinal)
                    .OrderBy(static permission => permission, StringComparer.Ordinal));
        }

        return new OpenIddictApplicationMetadata(
            OidcClientRequestNormalization.NormalizeAppPathBase(appPathBase),
            OidcClientRequestNormalization.NormalizeClientPath(callbackPath),
            ReadString(properties, DescriptionPropertyName) ?? string.Empty,
            ReadBoolean(properties, IsActivePropertyName) ?? true,
            OidcClientRequestNormalization.NormalizeOrigins(origins),
            OidcClientRequestNormalization.NormalizeClientPath(postLogoutPath),
            string.IsNullOrWhiteSpace(scope) ? "openid profile email roles offline_access api" : scope.Trim());
    }

    public static void ApplyToDescriptor(OpenIddictApplicationDescriptor descriptor, OpenIddictApplicationMetadata metadata)
    {
        descriptor.Properties[AppPathBasePropertyName] = JsonSerializer.SerializeToElement(metadata.AppPathBase);
        descriptor.Properties[CallbackPathPropertyName] = JsonSerializer.SerializeToElement(metadata.CallbackPath);
        descriptor.Properties[DescriptionPropertyName] = JsonSerializer.SerializeToElement(metadata.Description);
        descriptor.Properties[IsActivePropertyName] = JsonSerializer.SerializeToElement(metadata.IsActive);
        descriptor.Properties[OriginsPropertyName] = JsonSerializer.SerializeToElement(metadata.Origins);
        descriptor.Properties[PostLogoutPathPropertyName] = JsonSerializer.SerializeToElement(metadata.PostLogoutPath);
        descriptor.Properties[ScopePropertyName] = JsonSerializer.SerializeToElement(metadata.Scope);
    }

    private static Dictionary<string, JsonElement> ParseProperties(string? properties)
    {
        if (string.IsNullOrWhiteSpace(properties))
        {
            return [];
        }

        return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(properties) ?? [];
    }

    private static string[] ParseStringArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        return JsonSerializer.Deserialize<string[]>(json) ?? [];
    }

    private static string? ReadString(IReadOnlyDictionary<string, JsonElement> properties, string propertyName)
    {
        if (!properties.TryGetValue(propertyName, out var value) || value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return value.GetString();
    }

    private static bool? ReadBoolean(IReadOnlyDictionary<string, JsonElement> properties, string propertyName)
    {
        if (!properties.TryGetValue(propertyName, out var value)
            || (value.ValueKind != JsonValueKind.True && value.ValueKind != JsonValueKind.False))
        {
            return null;
        }

        return value.GetBoolean();
    }

    private static string[] ReadStringArray(IReadOnlyDictionary<string, JsonElement> properties, string propertyName)
    {
        if (!properties.TryGetValue(propertyName, out var value) || value.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return value.EnumerateArray()
            .Where(static item => item.ValueKind == JsonValueKind.String)
            .Select(static item => item.GetString())
            .Where(static item => !string.IsNullOrWhiteSpace(item))
            .Cast<string>()
            .ToArray();
    }

    private static string? TryGetOrigin(string redirectUri)
    {
        if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out var absoluteUri))
        {
            return null;
        }

        return OidcClientRequestNormalization.NormalizeOrigin(absoluteUri);
    }

    private static string? TryGetPath(string redirectUri)
    {
        if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out var absoluteUri))
        {
            return null;
        }

        return absoluteUri.AbsolutePath;
    }
}
