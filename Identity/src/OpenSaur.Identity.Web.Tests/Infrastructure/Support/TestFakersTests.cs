using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Support;

public sealed class TestFakersTests
{
    [Fact]
    public void CreateUserCredentials_ReturnsValidUniqueLookingValues()
    {
        var first = TestFakers.CreateUserCredentials();
        var second = TestFakers.CreateUserCredentials();

        Assert.False(string.IsNullOrWhiteSpace(first.UserName));
        Assert.False(string.IsNullOrWhiteSpace(first.Email));
        Assert.False(string.IsNullOrWhiteSpace(first.Password));
        Assert.Contains("@", first.Email);
        Assert.Contains("opensaur.test", first.Email, StringComparison.Ordinal);
        Assert.NotEqual(first.UserName, second.UserName);
        Assert.NotEqual(first.Email, second.Email);
        Assert.NotEqual(first.Password, second.Password);
        Assert.Matches(@".*[A-Z].*", first.Password);
        Assert.Matches(@".*[a-z].*", first.Password);
        Assert.Matches(@".*\d.*", first.Password);
        Assert.Contains('!', first.Password);
    }
}
