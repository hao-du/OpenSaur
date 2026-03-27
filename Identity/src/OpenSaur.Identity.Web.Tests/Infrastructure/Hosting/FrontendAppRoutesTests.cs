using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using OpenSaur.Identity.Web.Infrastructure.Hosting;

namespace OpenSaur.Identity.Web.Tests.Infrastructure.Hosting;

public sealed class FrontendAppRoutesTests
{
    [Theory]
    [InlineData("/", true)]
    [InlineData("/login", true)]
    [InlineData("/auth/callback", true)]
    [InlineData("/change-password", true)]
    [InlineData("/api/auth/me", false)]
    [InlineData("/connect/token", false)]
    [InlineData("/swagger/index.html", false)]
    [InlineData("/unknown", false)]
    public void IsShellRoute_returns_expected_value(string path, bool expected)
    {
        var actual = FrontendAppRoutes.IsShellRoute(new PathString(path));

        Assert.Equal(expected, actual);
    }

    [Fact]
    public void ShouldServeBuiltShell_returns_false_in_development_when_index_is_missing()
    {
        using var tempDirectory = new TempDirectory();
        var environment = new TestWebHostEnvironment(tempDirectory.Path, Environments.Development);

        var actual = FrontendAppRoutes.ShouldServeBuiltShell(environment);

        Assert.False(actual);
    }

    [Fact]
    public void ShouldServeBuiltShell_returns_true_in_development_when_index_exists()
    {
        using var tempDirectory = new TempDirectory();
        File.WriteAllText(Path.Combine(tempDirectory.Path, "index.html"), "<!doctype html>");
        var environment = new TestWebHostEnvironment(tempDirectory.Path, Environments.Development);

        var actual = FrontendAppRoutes.ShouldServeBuiltShell(environment);

        Assert.True(actual);
    }

    [Fact]
    public void ShouldServeBuiltShell_returns_true_outside_development()
    {
        using var tempDirectory = new TempDirectory();
        var environment = new TestWebHostEnvironment(tempDirectory.Path, Environments.Production);

        var actual = FrontendAppRoutes.ShouldServeBuiltShell(environment);

        Assert.True(actual);
    }

    private sealed class TestWebHostEnvironment(string webRootPath, string environmentName) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "OpenSaur.Identity.Web.Tests";

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();

        public string ContentRootPath { get; set; } = webRootPath;

        public string EnvironmentName { get; set; } = environmentName;

        public string WebRootPath { get; set; } = webRootPath;

        public IFileProvider WebRootFileProvider { get; set; } = new PhysicalFileProvider(webRootPath);
    }

    private sealed class TempDirectory : IDisposable
    {
        public TempDirectory()
        {
            Path = System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"opensaur-frontend-routes-{Guid.NewGuid():N}");
            Directory.CreateDirectory(Path);
        }

        public string Path { get; }

        public void Dispose()
        {
            if (Directory.Exists(Path))
            {
                Directory.Delete(Path, recursive: true);
            }
        }
    }
}
