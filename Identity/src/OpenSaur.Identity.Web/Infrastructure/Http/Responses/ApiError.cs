namespace OpenSaur.Identity.Web.Infrastructure.Http.Responses;

public sealed record ApiError(string Code, string Message, string Detail);
