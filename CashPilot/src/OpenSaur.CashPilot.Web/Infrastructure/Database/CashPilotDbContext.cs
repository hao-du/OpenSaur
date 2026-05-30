using Microsoft.EntityFrameworkCore;
using OpenSaur.CashPilot.Web.Domain;
using OpenSaur.CashPilot.Web.Domain.Common;

namespace OpenSaur.CashPilot.Web.Infrastructure.Database;

public sealed class CashPilotDbContext: DbContext
{
    public CashPilotDbContext(DbContextOptions<CashPilotDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Bank> Banks => Set<Bank>();
    public DbSet<Counterparty> Counterparties => Set<Counterparty>();
    public DbSet<Currency> Currencies => Set<Currency>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<CashFlow> CashFlows => Set<CashFlow>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<BankAccountTransaction> BankAccountTransactions => Set<BankAccountTransaction>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<TransferTransaction> TransferTransactions => Set<TransferTransaction>();
    public DbSet<CurrencyExchange> CurrencyExchanges => Set<CurrencyExchange>();
    public DbSet<CurrencyExchangeTransaction> CurrencyExchangeTransactions => Set<CurrencyExchangeTransaction>();
    public DbSet<TransactionItem> TransactionItems => Set<TransactionItem>();
    public DbSet<Template> Templates => Set<Template>();

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ApplyRuntimeEntityDefaults();

        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ApplyRuntimeEntityDefaults();

        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(typeof(CashPilotDbContext).Assembly);
    }

    private void ApplyRuntimeEntityDefaults()
    {
        var utcNow = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    ApplyAddedDefaults(entry.Entity, utcNow);
                    break;

                case EntityState.Modified:
                    ApplyUpdatedDefaults(entry.Entity, utcNow);
                    break;
            }
        }
    }

    private static void ApplyAddedDefaults(object entity, DateTime utcNow)
    {
        if (entity is not IEntityBase auditedRecord)
        {
            return;
        }

        if (auditedRecord.Id == Guid.Empty)
        {
            auditedRecord.Id = Guid.CreateVersion7();
        }

        if (auditedRecord.CreatedOn == default)
        {
            auditedRecord.CreatedOn = utcNow;
        }
    }

    private static void ApplyUpdatedDefaults(object entity, DateTime utcNow)
    {
        if (entity is IEntityBase auditedRecord)
        {
            auditedRecord.UpdatedOn = utcNow;
        }
    }
}


