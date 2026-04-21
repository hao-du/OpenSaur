using System.Text.Json;
using OpenIddict.Abstractions;
using OpenIddict.EntityFrameworkCore.Models;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.OidcClients.GetOidcClientById;

public sealed record GetOidcClientByIdResponse(
    Guid Id,
    string ClientId,
    string DisplayName,
    string ClientType,
    string[] RedirectUris,
    string[] PostLogoutRedirectUris,
    string Scope);
