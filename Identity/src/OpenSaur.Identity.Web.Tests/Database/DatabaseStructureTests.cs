using System.Reflection;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Tests.Database;

public sealed class DatabaseStructureTests
{
    [Fact]
    public void DatabaseInfrastructure_UsesDatabaseNamespaceInsteadOfPersistence()
    {
        Assert.Equal("OpenSaur.Identity.Web.Infrastructure.Database", typeof(ApplicationDbContext).Namespace);
        Assert.Null(typeof(Program).Assembly.GetType("OpenSaur.Identity.Web.Infrastructure.Persistence.ApplicationDbContext"));
    }

    [Fact]
    public void RepositoryDtos_DoNotUseRepositorySuffix()
    {
        var dtoTypes = typeof(ApplicationDbContext).Assembly.GetTypes()
            .Where(type =>
                type.IsClass
                && type.Namespace is not null
                && type.Namespace.Contains(".Infrastructure.Database.Repositories.", StringComparison.Ordinal)
                && type.Namespace.EndsWith(".Dtos", StringComparison.Ordinal))
            .ToArray();

        Assert.NotEmpty(dtoTypes);
        Assert.DoesNotContain(dtoTypes, type => type.Name.Contains("Repository", StringComparison.Ordinal));
    }

    [Fact]
    public void RepositoryMethods_ReturnResultResponsesInsteadOfDomainEntities()
    {
        var repositoryMethods = typeof(ApplicationDbContext).Assembly.GetTypes()
            .Where(type =>
                type.IsClass
                && !type.IsAbstract
                && type.Namespace is not null
                && type.Namespace.Contains(".Infrastructure.Database.Repositories.", StringComparison.Ordinal)
                && !type.Namespace.EndsWith(".Dtos", StringComparison.Ordinal))
            .SelectMany(type => type.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
            .Where(method => method.ReturnType.IsGenericType && method.ReturnType.GetGenericTypeDefinition() == typeof(Task<>))
            .ToArray();

        Assert.NotEmpty(repositoryMethods);

        foreach (var method in repositoryMethods)
        {
            var taskResultType = method.ReturnType.GenericTypeArguments[0];
            Assert.True(
                taskResultType.IsGenericType && taskResultType.GetGenericTypeDefinition() == typeof(Result<>),
                $"Repository method '{method.DeclaringType?.FullName}.{method.Name}' should return Task<Result<TResponse>>.");

            var responseType = taskResultType.GenericTypeArguments[0];
            Assert.True(
                responseType.Name.EndsWith("Response", StringComparison.Ordinal),
                $"Repository method '{method.DeclaringType?.FullName}.{method.Name}' should return a response DTO, not '{responseType.Name}'.");
            Assert.Contains(".Infrastructure.Database.Repositories.", responseType.Namespace ?? string.Empty, StringComparison.Ordinal);
            Assert.DoesNotContain(".Domain.", responseType.Namespace ?? string.Empty, StringComparison.Ordinal);

            var requestParameter = method.GetParameters().FirstOrDefault(parameter => parameter.ParameterType != typeof(CancellationToken));
            Assert.NotNull(requestParameter);
            Assert.True(
                requestParameter!.ParameterType.Name.EndsWith("Request", StringComparison.Ordinal),
                $"Repository method '{method.DeclaringType?.FullName}.{method.Name}' should accept a request DTO.");
            Assert.DoesNotContain("Repository", requestParameter.ParameterType.Name, StringComparison.Ordinal);
        }
    }
}
