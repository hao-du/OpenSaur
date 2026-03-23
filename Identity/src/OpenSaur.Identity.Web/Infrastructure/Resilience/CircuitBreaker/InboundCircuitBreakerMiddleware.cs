namespace OpenSaur.Identity.Web.Infrastructure.Resilience.CircuitBreaker;

public sealed class InboundCircuitBreakerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly EndpointResilienceOptions _options;
    private readonly InboundCircuitBreakerStateStore _stateStore;

    public InboundCircuitBreakerMiddleware(
        RequestDelegate next,
        EndpointResilienceOptions options,
        InboundCircuitBreakerStateStore stateStore)
    {
        _next = next;
        _options = options;
        _stateStore = stateStore;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        var policyScope = EndpointResiliencePolicySelector.SelectScope(httpContext);
        var policy = ResolvePolicy(policyScope);
        var breakerKey = $"{policyScope}:{EndpointResiliencePolicySelector.GetEndpointScopeKey(httpContext)}";
        var utcNow = DateTime.UtcNow;
        var lease = _stateStore.TryEnter(breakerKey, utcNow);

        if (!lease.IsAllowed)
        {
            await Results.Problem(
                    title: "Endpoint circuit is open.",
                    detail: "The endpoint is temporarily unavailable because of repeated server failures.",
                    statusCode: StatusCodes.Status503ServiceUnavailable)
                .ExecuteAsync(httpContext);
            return;
        }

        try
        {
            await _next(httpContext);
        }
        catch
        {
            _stateStore.RecordFailure(
                breakerKey,
                lease,
                policy.FailureThreshold,
                TimeSpan.FromSeconds(policy.BreakDurationSeconds),
                utcNow);
            throw;
        }

        if (ShouldCountFailure(httpContext.Response.StatusCode))
        {
            _stateStore.RecordFailure(
                breakerKey,
                lease,
                policy.FailureThreshold,
                TimeSpan.FromSeconds(policy.BreakDurationSeconds),
                utcNow);
            return;
        }

        _stateStore.RecordSuccess(breakerKey, lease);
    }

    private EndpointCircuitBreakerPolicyOptions ResolvePolicy(EndpointResiliencePolicyScope policyScope)
    {
        return policyScope switch
        {
            EndpointResiliencePolicyScope.Auth => _options.CircuitBreaker.Auth,
            EndpointResiliencePolicyScope.Token => _options.CircuitBreaker.Token,
            _ => _options.CircuitBreaker.Default
        };
    }

    private static bool ShouldCountFailure(int statusCode)
    {
        return statusCode >= StatusCodes.Status500InternalServerError;
    }
}
