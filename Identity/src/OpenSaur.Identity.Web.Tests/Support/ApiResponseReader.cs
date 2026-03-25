using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace OpenSaur.Identity.Web.Tests.Support;

public static class ApiResponseReader
{
    public static async Task<T> ReadSuccessDataAsync<T>(
        HttpResponseMessage response,
        HttpStatusCode expectedStatus = HttpStatusCode.OK)
    {
        Assert.Equal(expectedStatus, response.StatusCode);

        var envelope = await ReadEnvelopeAsync<T>(response);
        Assert.True(envelope.Success);
        Assert.Empty(envelope.Errors);
        Assert.NotNull(envelope.Data);

        return envelope.Data!;
    }

    public static async Task<ApiEnvelope<JsonElement?>> ReadFailureEnvelopeAsync(
        HttpResponseMessage response,
        HttpStatusCode expectedStatus)
    {
        Assert.Equal(expectedStatus, response.StatusCode);

        var envelope = await ReadEnvelopeAsync<JsonElement?>(response);
        Assert.False(envelope.Success);
        Assert.True(envelope.Data is null || envelope.Data.Value.ValueKind == JsonValueKind.Null);
        Assert.NotEmpty(envelope.Errors);

        return envelope;
    }

    public static async Task AssertNullSuccessDataAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var envelope = await ReadEnvelopeAsync<JsonElement?>(response);
        Assert.True(envelope.Success);
        Assert.Empty(envelope.Errors);
        Assert.True(envelope.Data is null || envelope.Data.Value.ValueKind == JsonValueKind.Null);
    }

    public static async Task<ApiEnvelope<T>> ReadEnvelopeAsync<T>(HttpResponseMessage response)
    {
        var envelope = await response.Content.ReadFromJsonAsync<ApiEnvelope<T>>();
        Assert.NotNull(envelope);
        return envelope;
    }
}

public sealed record ApiEnvelope<T>(bool Success, T? Data, ApiErrorResponse[] Errors);

public sealed record ApiErrorResponse(string Code, string Message, string Detail);
