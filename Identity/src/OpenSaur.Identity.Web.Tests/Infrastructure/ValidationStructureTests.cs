using System.Reflection;
using FluentValidation;

namespace OpenSaur.Identity.Web.Tests.Infrastructure;

public sealed class ValidationStructureTests
{
    [Fact]
    public void RequestTypes_HaveFluentValidationValidators()
    {
        var assembly = typeof(Program).Assembly;
        var requestTypes = assembly.GetTypes()
            .Where(type =>
                type.IsClass
                && !type.IsAbstract
                && type.IsPublic
                && type.Namespace is not null
                && type.Namespace.Contains(".Features.", StringComparison.Ordinal)
                && type.Name.EndsWith("Request", StringComparison.Ordinal))
            .ToArray();

        Assert.NotEmpty(requestTypes);

        var validators = assembly.GetTypes()
            .Where(type => type is { IsClass: true, IsAbstract: false })
            .ToArray();

        foreach (var requestType in requestTypes)
        {
            var validatorContract = typeof(IValidator<>).MakeGenericType(requestType);
            Assert.Contains(
                validators,
                type => validatorContract.IsAssignableFrom(type));
        }
    }
}
