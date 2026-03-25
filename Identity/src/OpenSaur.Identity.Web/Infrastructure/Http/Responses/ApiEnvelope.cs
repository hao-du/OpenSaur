namespace OpenSaur.Identity.Web.Infrastructure.Http.Responses;

public sealed record ApiEnvelope<T>(bool Success, T? Data, IReadOnlyList<ApiError> Errors);
