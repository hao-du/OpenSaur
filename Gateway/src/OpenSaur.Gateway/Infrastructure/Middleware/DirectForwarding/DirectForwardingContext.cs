using Yarp.ReverseProxy.Forwarder;

namespace OpenSaur.Gateway.Infrastructure.Middleware.DirectForwarding;

sealed class DirectForwardingContext
{
    public required IReadOnlyDictionary<string, string?> Hosts { get; init; }
    public required HttpMessageInvoker ForwarderHttpClient { get; init; }
    public required ForwarderRequestConfig ForwarderRequestConfig { get; init; }
}
