using FluentValidation;
using FluentValidation.Results;
using OpenSaur.Identity.Web.Infrastructure.Http.Responses;
using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Infrastructure.Validation;

public static class FluentValidationApiExtensions
{
    public static async Task<IResult?> ValidateRequestAsync<T>(
        this IValidator<T> validator,
        T request,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        return validationResult.IsValid
            ? null
            : validationResult.ToApiErrorResult();
    }

    public static IResult ToApiErrorResult(this ValidationResult validationResult)
    {
        return Result.Validation(ToResultErrors(validationResult)).ToApiErrorResult();
    }

    private static ResultError[] ToResultErrors(ValidationResult validationResult)
    {
        return validationResult.Errors
            .Select(static failure => ResultErrors.Validation("Validation failed.", failure.ErrorMessage))
            .ToArray();
    }
}
