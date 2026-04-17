using OpenSaur.Zentry.Web.Infrastructure.Configuration;
using OpenSaur.Zentry.Web.Infrastructure.Hosting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ZentryOidcOptions>(
    builder.Configuration.GetSection(ZentryOidcOptions.SectionName));
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapShellRuntimeConfig();
app.MapShellRoutes();

app.Run();

public partial class Program;
