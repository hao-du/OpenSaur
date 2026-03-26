using Microsoft.AspNetCore.HttpOverrides;
using OpenSaur.Identity.Web.Infrastructure;
using OpenSaur.Identity.Web.Infrastructure.Hosting;
using OpenSaur.Identity.Web.Infrastructure.Http.Idempotency;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenSaurInfrastructure(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseHttpsRedirection();
app.UseStatusCodePages(ApiStatusCodeResponseWriter.TryWriteAsync);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseMiddleware<IdempotencyMiddleware>();

app.MapOpenSaurEndpoints();
if (!app.Environment.IsDevelopment())
{
    app.MapShellRoutes();
}

app.Run();

public partial class Program;
