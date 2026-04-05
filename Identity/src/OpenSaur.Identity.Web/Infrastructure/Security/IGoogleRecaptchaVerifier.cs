namespace OpenSaur.Identity.Web.Infrastructure.Security;

public interface IGoogleRecaptchaVerifier
{
    bool IsEnabled { get; }

    string SiteKey { get; }

    string LoginAction { get; }

    Task<GoogleRecaptchaVerificationResult> VerifyLoginAsync(
        string? token,
        string? remoteIp,
        CancellationToken cancellationToken = default);
}

public sealed record GoogleRecaptchaVerificationResult(bool IsVerified, bool IsServiceFailure)
{
    public static GoogleRecaptchaVerificationResult Passed() => new(true, false);

    public static GoogleRecaptchaVerificationResult Failed() => new(false, false);

    public static GoogleRecaptchaVerificationResult ServiceFailure() => new(false, true);
}
