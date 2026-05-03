using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database;

public sealed class DesignTimeApplicationDbContextFactory : IDesignTimeDbContextFactory<CashPilotDbContext>
{
    private const string ConnectionStringName = "CashPilotDb";

    public CashPilotDbContext CreateDbContext(string[] args)
    {
        var environmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var basePath = Directory.GetCurrentDirectory();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environmentName}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString(ConnectionStringName)
            ?? throw new InvalidOperationException(
                $"Connection string '{ConnectionStringName}' was not found for design-time EF operations.");

        var optionsBuilder = new DbContextOptionsBuilder<CashPilotDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new CashPilotDbContext(optionsBuilder.Options);
    }
}
