using Microsoft.EntityFrameworkCore;
using Npgsql;
using OpenSaur.Identity.Web.Infrastructure.Database;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Database;

public sealed class DatabaseExceptionClassifierTests
{
    [Fact]
    public void IsUniqueConstraintViolation_WhenPostgresUniqueViolation_ReturnsTrue()
    {
        var exception = new DbUpdateException(
            "unique failure",
            new PostgresException("duplicate key", "ERROR", "ERROR", "23505"));

        Assert.True(DatabaseExceptionClassifier.IsUniqueConstraintViolation(exception));
        Assert.False(DatabaseExceptionClassifier.IsForeignKeyConstraintViolation(exception));
    }

    [Fact]
    public void IsForeignKeyConstraintViolation_WhenPostgresForeignKeyViolation_ReturnsTrue()
    {
        var exception = new DbUpdateException(
            "foreign key failure",
            new PostgresException("foreign key violation", "ERROR", "ERROR", "23503"));

        Assert.True(DatabaseExceptionClassifier.IsForeignKeyConstraintViolation(exception));
        Assert.False(DatabaseExceptionClassifier.IsUniqueConstraintViolation(exception));
    }

    [Fact]
    public void ConstraintChecks_WhenExceptionIsUnknown_ReturnFalse()
    {
        var exception = new DbUpdateException("unknown failure", new InvalidOperationException("boom"));

        Assert.False(DatabaseExceptionClassifier.IsUniqueConstraintViolation(exception));
        Assert.False(DatabaseExceptionClassifier.IsForeignKeyConstraintViolation(exception));
    }
}
