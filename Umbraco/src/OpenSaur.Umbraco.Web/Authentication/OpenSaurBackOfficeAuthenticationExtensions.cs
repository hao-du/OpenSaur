using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Umbraco.Cms.Api.Management.Security;
using Umbraco.Cms.Core.Configuration.Models;
using Umbraco.Cms.Core.DependencyInjection;

namespace OpenSaur.Umbraco.Web.Authentication;

internal static class OpenSaurBackOfficeAuthenticationExtensions
{
    private const string ProviderName = "Umbraco.OpenSaur.Identity";
    private const string DisplayName = "OpenSaur Identity";

    public static IUmbracoBuilder AddOpenSaurBackOfficeAuthentication(this IUmbracoBuilder builder)
    {
        var options = builder.Config.GetSection(OidcOptions.SectionName)
            .Get<OidcOptions>() ?? new OidcOptions();

        var httpContextAccessor = new HttpContextAccessor();
        builder.Services.AddSingleton<IHttpContextAccessor>(httpContextAccessor);
        builder.Services.Configure<OidcOptions>(
            builder.Config.GetSection(OidcOptions.SectionName));
        builder.Services.PostConfigure<GlobalSettings>(settings =>
        {
            settings.ReservedPaths = AppendReservedPath(settings.ReservedPaths, options.CallbackPath);
            settings.ReservedPaths = AppendReservedPath(settings.ReservedPaths, options.SignedOutCallbackPath);
        });
        builder.Services.AddScoped<OpenSaurBackOfficeUserProvisioningService>();

        builder.AddBackOfficeExternalLogins(logins =>
        {
            logins.AddBackOfficeLogin(
                backOfficeAuthenticationBuilder =>
                {
                    backOfficeAuthenticationBuilder.AddOpenIdConnect(
                        BackOfficeAuthenticationBuilder.SchemeForBackOffice(ProviderName)!,
                        DisplayName,
                        oidcOptions =>
                        {
                            oidcOptions.Authority = options.Authority;
                            oidcOptions.ClientId = options.ClientId;
                            oidcOptions.ClientSecret = options.ClientSecret;
                            oidcOptions.RequireHttpsMetadata = !options.AllowInsecureDiscoveryEndpoints;
                            oidcOptions.ResponseType = OpenIdConnectResponseType.Code;
                            oidcOptions.CallbackPath = options.CallbackPath;
                            oidcOptions.SignedOutCallbackPath = options.SignedOutCallbackPath;
                            oidcOptions.MapInboundClaims = false;
                            oidcOptions.GetClaimsFromUserInfoEndpoint = false;
                            oidcOptions.SaveTokens = false;
                            oidcOptions.UsePkce = true;
                            oidcOptions.TokenValidationParameters = new TokenValidationParameters
                            {
                                NameClaimType = OpenSaurIdentityClaimTypes.PreferredUserName,
                                RoleClaimType = OpenSaurIdentityClaimTypes.Role
                            };

                            oidcOptions.Scope.Clear();
                            oidcOptions.Scope.Add("openid");
                            oidcOptions.Scope.Add("profile");
                            oidcOptions.Scope.Add("email");
                            oidcOptions.Scope.Add("roles");
                            oidcOptions.Scope.Add("api");

                            oidcOptions.Events = new OpenIdConnectEvents
                            {
                                OnTokenValidated = context =>
                                {
                                    var accessToken = context.TokenEndpointResponse?.AccessToken;

                                    if (string.IsNullOrWhiteSpace(accessToken))
                                    {
                                        context.Fail("Identity did not return an access token.");
                                        return Task.CompletedTask;
                                    }

                                    var jwtHandler = new JwtSecurityTokenHandler();
                                    if (!jwtHandler.CanReadToken(accessToken))
                                    {
                                        context.Fail("Identity returned an unreadable access token.");
                                        return Task.CompletedTask;
                                    }

                                    var accessTokenPrincipal = jwtHandler.ReadJwtToken(accessToken);
                                    if (context.Principal?.Identity is not ClaimsIdentity identity)
                                    {
                                        context.Fail("Backoffice sign-in principal is unavailable.");
                                        return Task.CompletedTask;
                                    }

                                    CopyClaimIfMissing(identity, accessTokenPrincipal, OpenSaurIdentityClaimTypes.Permissions);
                                    CopyClaimIfMissing(identity, accessTokenPrincipal, OpenSaurIdentityClaimTypes.Role);
                                    CopyClaimIfMissing(identity, accessTokenPrincipal, OpenSaurIdentityClaimTypes.WorkspaceId);
                                    CopyClaimIfMissing(identity, accessTokenPrincipal, OpenSaurIdentityClaimTypes.ImpersonationActive);
                                    CopyClaimIfMissing(identity, accessTokenPrincipal, OpenSaurIdentityClaimTypes.ImpersonationOriginalUserId);
                                    CopyClaimIfMissing(identity, accessTokenPrincipal, OpenSaurIdentityClaimTypes.ImpersonationWorkspaceId);
                                    EnsureStandardExternalLoginClaims(identity);

                                    if (!OpenSaurIdentitySession.TryCreate(context.Principal, out var session) || session is null)
                                    {
                                        context.Fail("Backoffice access requires SUPER ADMINISTRATOR or Umbraco.CanManage.");
                                        return Task.CompletedTask;
                                    }

                                    var provisioningService = context.HttpContext.RequestServices
                                        .GetRequiredService<OpenSaurBackOfficeUserProvisioningService>();
                                    provisioningService.EnsureWorkspaceGroup(session);

                                    return Task.CompletedTask;
                                }
                            };
                        });
                },
                providerOptions =>
                {
                    providerOptions.DenyLocalLogin = false;
                    providerOptions.AutoLinkOptions = new ExternalSignInAutoLinkOptions(
                        autoLinkExternalAccount: true,
                        defaultUserGroups: [],
                        defaultCulture: options.DefaultCulture,
                        allowManualLinking: false)
                    {
                        OnAutoLinking = (autoLinkUser, loginInfo) =>
                        {
                            var provisioningService = httpContextAccessor.HttpContext?.RequestServices
                                .GetRequiredService<OpenSaurBackOfficeUserProvisioningService>();
                            provisioningService?.PrepareAutoLinkedUser(autoLinkUser, loginInfo);
                        },
                        OnExternalLogin = (user, loginInfo) =>
                        {
                            var provisioningService = httpContextAccessor.HttpContext?.RequestServices
                                .GetRequiredService<OpenSaurBackOfficeUserProvisioningService>();
                            return provisioningService?.SynchronizeUser(user, loginInfo) ?? false;
                        }
                    };
                });
        });

        return builder;
    }

    private static void EnsureStandardExternalLoginClaims(ClaimsIdentity identity)
    {
        AddClaimIfMissing(
            identity,
            ClaimTypes.NameIdentifier,
            FindClaimValue(identity, OpenSaurIdentityClaimTypes.Subject));
        AddClaimIfMissing(
            identity,
            ClaimTypes.Name,
            FindClaimValue(identity, OpenSaurIdentityClaimTypes.Name)
            ?? FindClaimValue(identity, OpenSaurIdentityClaimTypes.PreferredUserName));
        AddClaimIfMissing(
            identity,
            ClaimTypes.Email,
            FindClaimValue(identity, OpenSaurIdentityClaimTypes.Email));
    }

    private static void AddClaimIfMissing(ClaimsIdentity identity, string claimType, string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || identity.HasClaim(claim => claim.Type == claimType))
        {
            return;
        }

        identity.AddClaim(new Claim(claimType, value));
    }

    private static string? FindClaimValue(ClaimsIdentity identity, string claimType)
    {
        return identity.FindFirst(claimType)?.Value;
    }

    private static void CopyClaimIfMissing(ClaimsIdentity identity, JwtSecurityToken accessToken, string claimType)
    {
        if (identity.HasClaim(claim => claim.Type == claimType))
        {
            return;
        }

        foreach (var claim in accessToken.Claims.Where(claim => claim.Type == claimType))
        {
            identity.AddClaim(new Claim(claim.Type, claim.Value));
        }
    }

    private static string AppendReservedPath(string? reservedPaths, string path)
    {
        var normalizedPath = NormalizeReservedPath(path);
        var existing = string.IsNullOrWhiteSpace(reservedPaths)
            ? []
            : reservedPaths.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(NormalizeReservedPath)
                .ToList();

        if (!existing.Contains(normalizedPath, StringComparer.OrdinalIgnoreCase))
        {
            existing.Add(normalizedPath);
        }

        return string.Join(',', existing) + ",";
    }

    private static string NormalizeReservedPath(string path)
    {
        var normalized = path.Trim();
        if (!normalized.StartsWith('/'))
        {
            normalized = "/" + normalized;
        }

        return normalized.TrimEnd('/');
    }
}
