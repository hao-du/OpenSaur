using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Hosting;
using OpenSaur.Zentry.Web.Features.Frontend.Handlers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<OidcOptions>(
    builder.Configuration.GetSection(OidcOptions.SectionName));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CreateAppConfigJsHandler>();
builder.Services.AddScoped<CreateFrontendRouteHandler>();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapFrontEndRoutes();

app.Run();

public partial class Program;
