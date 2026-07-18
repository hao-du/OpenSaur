using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Helpers;

namespace OpenSaur.Zentry.Web.Features.Frontend.Dtos;

internal sealed record FrontentAppConfigJsDto(
    string AppName,
    string BasePath,
    string Authority,
    string ClientId,
    string RedirectUri,
    string PostLogoutRedirectUri,
    string Scope);
