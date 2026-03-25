namespace OpenSaur.Identity.Web.Tests.Infrastructure;

public sealed class ApiResponseHelpersStructureTests
{
    [Fact]
    public void ResponseHelpers_UseSingleApiResponsesFile()
    {
        var repositoryRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        var responsesDirectory = Path.Combine(
            repositoryRoot,
            "src",
            "OpenSaur.Identity.Web",
            "Infrastructure",
            "Http",
            "Responses");

        Assert.True(File.Exists(Path.Combine(responsesDirectory, "ApiResponses.cs")));
        Assert.False(File.Exists(Path.Combine(responsesDirectory, "ApiResultExtensions.cs")));
    }

    [Fact]
    public void ApiResponses_ExposesOnlyHighLevelPublicErrorMethod()
    {
        var apiResponsesType = typeof(Program).Assembly.GetType(
            "OpenSaur.Identity.Web.Infrastructure.Http.Responses.ApiResponses");

        Assert.NotNull(apiResponsesType);

        var publicErrorMethods = apiResponsesType!
            .GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
            .Where(method => method.Name == "Error")
            .ToArray();

        Assert.Single(publicErrorMethods);
        Assert.Equal(typeof(OpenSaur.Identity.Web.Infrastructure.Results.Result), publicErrorMethods[0].GetParameters()[0].ParameterType);
    }

    [Fact]
    public void ApiStatusCodeResponseWriter_UsesResultExtensionsForErrorResponses()
    {
        var repositoryRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        var statusCodeWriterPath = Path.Combine(
            repositoryRoot,
            "src",
            "OpenSaur.Identity.Web",
            "Infrastructure",
            "Http",
            "Responses",
            "ApiStatusCodeResponseWriter.cs");

        var source = File.ReadAllText(statusCodeWriterPath);

        Assert.Contains(".ToApiErrorResult()", source);
        Assert.DoesNotContain("ApiResponses.Error(", source);
    }
}
