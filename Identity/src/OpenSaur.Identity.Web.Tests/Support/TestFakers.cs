using Bogus;

namespace OpenSaur.Identity.Web.Tests.Support;

public static class TestFakers
{
    public static TestUserCredentials CreateUserCredentials(string prefix = "user")
    {
        var faker = CreateFaker();
        var userSlug = faker.Internet.UserName().Replace(".", "-", StringComparison.Ordinal).Replace("_", "-", StringComparison.Ordinal).ToLowerInvariant();
        var suffix = faker.Random.AlphaNumeric(8).ToLowerInvariant();
        var userName = $"{prefix}-{userSlug}-{suffix}";

        return new TestUserCredentials(
            userName,
            CreateEmail(userName),
            CreatePassword());
    }

    public static string CreatePassword()
    {
        var faker = CreateFaker();

        return $"{faker.Random.Char('A', 'Z')}{faker.Random.Char('a', 'z')}{faker.Random.Int(0, 9)}!{faker.Random.AlphaNumeric(10)}";
    }

    public static string CreateDifferentPassword(string currentPassword)
    {
        string candidate;

        do
        {
            candidate = CreatePassword();
        }
        while (string.Equals(candidate, currentPassword, StringComparison.Ordinal));

        return candidate;
    }

    public static string CreateDescription()
    {
        return CreateFaker().Lorem.Sentence(4).TrimEnd('.');
    }

    public static string CreateWorkspaceName()
    {
        return $"{CreateFaker().Company.CompanyName()} Workspace";
    }

    public static string CreateRoleName()
    {
        var faker = CreateFaker();
        return $"{faker.Name.JobTitle()} {faker.Random.AlphaNumeric(6)}";
    }

    public static string CreateEmail(string userName)
    {
        return $"{userName}@opensaur.test";
    }

    private static Faker CreateFaker()
    {
        return new Faker();
    }
}

public sealed record TestUserCredentials(string UserName, string Email, string Password);
