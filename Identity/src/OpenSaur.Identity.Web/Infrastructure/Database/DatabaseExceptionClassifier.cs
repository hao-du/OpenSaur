using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace OpenSaur.Identity.Web.Infrastructure.Database;

public static class DatabaseExceptionClassifier
{
    private const int SqliteConstraintErrorCode = 19;
    private const int SqliteUniqueConstraintExtendedErrorCode = 2067;
    private const int SqlitePrimaryKeyConstraintExtendedErrorCode = 1555;
    private const int SqliteForeignKeyConstraintExtendedErrorCode = 787;
    private const string PostgresUniqueViolation = "23505";
    private const string PostgresForeignKeyViolation = "23503";

    public static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        if (exception.InnerException is PostgresException postgresException)
        {
            return string.Equals(postgresException.SqlState, PostgresUniqueViolation, StringComparison.Ordinal);
        }

        return TryGetSqliteCodes(exception.InnerException, out var errorCode, out var extendedErrorCode)
            && errorCode == SqliteConstraintErrorCode
            && (extendedErrorCode == SqliteUniqueConstraintExtendedErrorCode
                || extendedErrorCode == SqlitePrimaryKeyConstraintExtendedErrorCode
                || Contains(exception.InnerException?.Message, "UNIQUE constraint failed")
                || Contains(exception.InnerException?.Message, "PRIMARY KEY constraint failed"));
    }

    public static bool IsForeignKeyConstraintViolation(DbUpdateException exception)
    {
        if (exception.InnerException is PostgresException postgresException)
        {
            return string.Equals(postgresException.SqlState, PostgresForeignKeyViolation, StringComparison.Ordinal);
        }

        return TryGetSqliteCodes(exception.InnerException, out var errorCode, out var extendedErrorCode)
            && errorCode == SqliteConstraintErrorCode
            && (extendedErrorCode == SqliteForeignKeyConstraintExtendedErrorCode
                || Contains(exception.InnerException?.Message, "FOREIGN KEY constraint failed"));
    }

    private static bool TryGetSqliteCodes(Exception? exception, out int errorCode, out int extendedErrorCode)
    {
        errorCode = 0;
        extendedErrorCode = 0;

        if (!string.Equals(exception?.GetType().FullName, "Microsoft.Data.Sqlite.SqliteException", StringComparison.Ordinal))
        {
            return false;
        }

        var sqliteExceptionType = exception!.GetType();
        errorCode = sqliteExceptionType.GetProperty("SqliteErrorCode")?.GetValue(exception) as int? ?? 0;
        extendedErrorCode = sqliteExceptionType.GetProperty("SqliteExtendedErrorCode")?.GetValue(exception) as int? ?? 0;
        return true;
    }

    private static bool Contains(string? text, string expected)
    {
        return text?.Contains(expected, StringComparison.OrdinalIgnoreCase) == true;
    }
}
