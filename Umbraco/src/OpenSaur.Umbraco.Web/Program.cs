using Microsoft.AspNetCore.HttpOverrides;
using OpenSaur.Umbraco.Web.Authentication;
using Umbraco.Cms.Core.DependencyInjection;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
        | ForwardedHeaders.XForwardedProto
        | ForwardedHeaders.XForwardedHost;

    // ACA terminates TLS at the ingress and forwards the original request metadata.
    // Clear the trust lists so the forwarded headers are applied in that environment.
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

var umbracoBuilder = builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddOpenSaurBackOfficeAuthentication()
    .AddComposers();

if (HasAzureBlobMediaStorageConfigured(builder.Configuration))
{
    // Enable external blob storage only when both required values are present.
    // This keeps local/dev startup working before the secret-backed config is wired.
    umbracoBuilder
        .AddAzureBlobMediaFileSystem()
        .AddAzureBlobImageSharpCache();
}

umbracoBuilder.Build();

WebApplication app = builder.Build();

app.UseForwardedHeaders();

await app.BootUmbracoAsync();

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

await app.RunAsync();

static bool HasAzureBlobMediaStorageConfigured(IConfiguration configuration)
{
    string? connectionString = configuration["Umbraco:Storage:AzureBlob:Media:ConnectionString"];
    string? containerName = configuration["Umbraco:Storage:AzureBlob:Media:ContainerName"];

    return string.IsNullOrWhiteSpace(connectionString) is false
           && string.IsNullOrWhiteSpace(containerName) is false;
}
