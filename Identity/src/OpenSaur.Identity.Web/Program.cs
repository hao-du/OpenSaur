using Microsoft.AspNetCore.HttpOverrides;
using OpenSaur.Identity.Web.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenSaurInfrastructure(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseForwardedHeaders();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapOpenSaurEndpoints();

app.Run();

public partial class Program;
