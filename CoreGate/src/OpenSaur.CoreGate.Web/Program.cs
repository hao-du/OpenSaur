using OpenSaur.CoreGate.Web.Features.Auth;
using OpenSaur.CoreGate.Web.Features.Auth.DependencyInjection;
using OpenSaur.CoreGate.Web.Infrastructure.Configuration;
using OpenSaur.CoreGate.Web.Infrastructure.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCoreGateConfiguration(builder.Configuration);
builder.Services.AddCoreGateDatabase(builder.Configuration);
builder.Services.AddCoreGateAuthentication(builder.Configuration);

builder.Services.AddAuthFeature();

builder.Services.AddProblemDetails();
builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseExceptionHandler();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapOpenIddictEndpoints();
app.MapAuthEndpoints();
app.MapFallbackToFile("index.html");

app.Run();
