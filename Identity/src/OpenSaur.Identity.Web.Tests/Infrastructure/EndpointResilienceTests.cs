using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text;
using System.Data.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection;
using OpenSaur.Identity.Web.Domain.Identity;
using OpenSaur.Identity.Web.Infrastructure.Database;
using OpenSaur.Identity.Web.Infrastructure.Resilience;
using OpenSaur.Identity.Web.Infrastructure.Resilience.Idempotency;
using OpenSaur.Identity.Web.Tests.Support;

namespace OpenSaur.Identity.Web.Tests.Infrastructure;

public sealed class EndpointResilienceTests
{
    private const string ClientId = "first-party-web";
    private const string RedirectUri = "https://first-party.test.opensaur/auth/callback";
    private const string ClientSecret = "test-first-party-secret";

    [Fact]
    public async Task GetMe_WhenDefaultRateLimitIsExceeded_ReturnsTooManyRequests()
    {
        using var factory = CreateFactory(
            ("EndpointResilience:RateLimiting:Default:PermitLimit", "2"),
            ("EndpointResilience:RateLimiting:Auth:PermitLimit", "10"),
            ("EndpointResilience:RateLimiting:Token:PermitLimit", "10"));

        await factory.ResetDatabaseAsync();
        await factory.SeedOidcClientAsync(ClientId, RedirectUri, ClientSecret);

        using var client = CreateClient(factory);
        var accessToken = await GetAccessTokenAsync(client, "SystemAdministrator", "Password1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var firstResponse = await client.GetAsync("/api/auth/me");
        var secondResponse = await client.GetAsync("/api/auth/me");
        var thirdResponse = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);
        Assert.Equal((HttpStatusCode)429, thirdResponse.StatusCode);
    }

    [Fact]
    public async Task Middleware_WhenEndpointRequiresIdempotencyAndHeaderIsMissing_ReturnsBadRequest()
    {
        var invocationCount = 0;
        using var services = CreateHybridCacheServices();
        var httpContext = CreateHttpContext(
            HttpMethods.Post,
            "/__test/idempotent",
            """
            {"value":"test"}
            """);
        httpContext.RequestServices = services;
        httpContext.SetEndpoint(CreateEndpoint(new EndpointIdempotencyMetadata()));

        var middleware = new IdempotencyMiddleware(
            async _ =>
            {
                Interlocked.Increment(ref invocationCount);
                await Results.Ok(new MetadataReplayResponse(invocationCount)).ExecuteAsync(httpContext);
            },
            new EndpointResilienceOptions());

        await middleware.InvokeAsync(
            httpContext,
            services.GetRequiredService<HybridCache>(),
            services.GetRequiredService<IdempotencyRequestLockProvider>());

        Assert.Equal(HttpStatusCode.BadRequest, (HttpStatusCode)httpContext.Response.StatusCode);
        Assert.Equal(0, invocationCount);
    }

    [Fact]
    public async Task Middleware_WhenEndpointRequiresIdempotencyAndKeyMatches_ReplaysCachedResponse()
    {
        var invocationCount = 0;
        using var services = CreateHybridCacheServices();
        var middleware = new IdempotencyMiddleware(
            async httpContext =>
            {
                var response = new MetadataReplayResponse(Interlocked.Increment(ref invocationCount));
                await Results.Json(response).ExecuteAsync(httpContext);
            },
            new EndpointResilienceOptions());

        var firstContext = CreateHttpContext(
            HttpMethods.Post,
            "/__test/idempotent",
            """
            {"value":"test"}
            """);
        firstContext.RequestServices = services;
        firstContext.Request.Headers["Idempotency-Key"] = "metadata-replay-key";
        firstContext.SetEndpoint(CreateEndpoint(new EndpointIdempotencyMetadata()));

        await middleware.InvokeAsync(
            firstContext,
            services.GetRequiredService<HybridCache>(),
            services.GetRequiredService<IdempotencyRequestLockProvider>());

        var secondContext = CreateHttpContext(
            HttpMethods.Post,
            "/__test/idempotent",
            """
            {"value":"test"}
            """);
        secondContext.RequestServices = services;
        secondContext.Request.Headers["Idempotency-Key"] = "metadata-replay-key";
        secondContext.SetEndpoint(CreateEndpoint(new EndpointIdempotencyMetadata()));

        await middleware.InvokeAsync(
            secondContext,
            services.GetRequiredService<HybridCache>(),
            services.GetRequiredService<IdempotencyRequestLockProvider>());

        Assert.Equal(1, invocationCount);
        Assert.Equal(HttpStatusCode.OK, (HttpStatusCode)firstContext.Response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (HttpStatusCode)secondContext.Response.StatusCode);
        Assert.Equal(
            await ReadResponseBodyAsync(firstContext),
            await ReadResponseBodyAsync(secondContext));
    }

    [Fact]
    public void Selector_WhenEndpointHasMetadataScope_UsesAnnotatedPolicyScope()
    {
        var httpContext = CreateHttpContext(HttpMethods.Get, "/__test/auth-rate");
        httpContext.SetEndpoint(CreateEndpoint(new EndpointResilienceScopeMetadata(EndpointResiliencePolicyScope.Auth)));

        var policyScope = EndpointResiliencePolicySelector.SelectScope(httpContext);

        Assert.Equal(EndpointResiliencePolicyScope.Auth, policyScope);
    }

    [Fact]
    public async Task PostLogin_WhenSensitiveRateLimitIsExceeded_UsesStricterPolicy()
    {
        using var factory = CreateFactory(
            ("EndpointResilience:RateLimiting:Default:PermitLimit", "10"),
            ("EndpointResilience:RateLimiting:Auth:PermitLimit", "1"));

        await factory.ResetDatabaseAsync();

        using var client = CreateClient(factory);
        var firstCredentials = TestFakers.CreateUserCredentials();
        var secondCredentials = TestFakers.CreateUserCredentials();

        var firstResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(firstCredentials.UserName, firstCredentials.Password));
        var secondResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequest(secondCredentials.UserName, secondCredentials.Password));

        Assert.Equal(HttpStatusCode.Unauthorized, firstResponse.StatusCode);
        Assert.Equal((HttpStatusCode)429, secondResponse.StatusCode);
    }

    [Fact]
    public async Task PostCreate_WhenIdempotencyKeyMatches_ReplaysStoredResponseWithoutCreatingDuplicate()
    {
        using var factory = CreateFactory();
        await factory.ResetDatabaseAsync();
        await factory.SeedOidcClientAsync(ClientId, RedirectUri, ClientSecret);

        var managerCredentials = TestFakers.CreateUserCredentials();
        var newUserCredentials = TestFakers.CreateUserCredentials();
        await factory.SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = CreateClient(factory);
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        const string idempotencyKey = "create-user-replay-key";
        var request = new CreateUserRequest(
            newUserCredentials.UserName,
            TestFakers.CreateEmail(newUserCredentials.UserName),
            newUserCredentials.Password,
            TestFakers.CreateDescription(),
            "{\"theme\":\"dark\"}");

        var firstResponse = await SendCreateUserRequestAsync(client, request, idempotencyKey);
        var secondResponse = await SendCreateUserRequestAsync(client, request, idempotencyKey);

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, secondResponse.StatusCode);

        var firstPayload = await firstResponse.Content.ReadFromJsonAsync<CreateUserResponse>();
        var secondPayload = await secondResponse.Content.ReadFromJsonAsync<CreateUserResponse>();

        Assert.NotNull(firstPayload);
        Assert.NotNull(secondPayload);
        Assert.Equal(firstPayload.Id, secondPayload.Id);
        Assert.Equal(firstResponse.Headers.Location, secondResponse.Headers.Location);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(1, await dbContext.Users.CountAsync(user => user.UserName == newUserCredentials.UserName));
    }

    [Fact]
    public async Task PostCreate_WhenIdempotencyKeyIsReusedWithDifferentPayload_ReturnsConflict()
    {
        using var factory = CreateFactory();
        await factory.ResetDatabaseAsync();
        await factory.SeedOidcClientAsync(ClientId, RedirectUri, ClientSecret);

        var managerCredentials = TestFakers.CreateUserCredentials();
        var firstUserCredentials = TestFakers.CreateUserCredentials();
        var secondUserCredentials = TestFakers.CreateUserCredentials();
        await factory.SeedUserAsync(managerCredentials.UserName, managerCredentials.Password, [SystemRoles.Administrator]);

        using var client = CreateClient(factory);
        var accessToken = await GetAccessTokenAsync(client, managerCredentials.UserName, managerCredentials.Password);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        const string idempotencyKey = "create-user-conflict-key";
        var firstRequest = new CreateUserRequest(
            firstUserCredentials.UserName,
            TestFakers.CreateEmail(firstUserCredentials.UserName),
            firstUserCredentials.Password,
            TestFakers.CreateDescription(),
            "{\"language\":\"vi\"}");
        var secondRequest = new CreateUserRequest(
            secondUserCredentials.UserName,
            TestFakers.CreateEmail(secondUserCredentials.UserName),
            secondUserCredentials.Password,
            TestFakers.CreateDescription(),
            "{\"language\":\"en\"}");

        var firstResponse = await SendCreateUserRequestAsync(client, firstRequest, idempotencyKey);
        var secondResponse = await SendCreateUserRequestAsync(client, secondRequest, idempotencyKey);

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    [Fact]
    public async Task AuthEndpoint_WhenCircuitBreakerOpens_ReturnsServiceUnavailableUntilCooldownSucceeds()
    {
        var probeState = new CircuitProbeState();
        var interceptor = new ThrowingSqliteCommandInterceptor(probeState);

        using var factory = CreateConfiguredFactory(
            configureDbContext: options => options.AddInterceptors(interceptor),
            overrides:
            [
                ("EndpointResilience:CircuitBreaker:Auth:FailureThreshold", "2"),
                ("EndpointResilience:CircuitBreaker:Auth:BreakDurationSeconds", "1")
            ]);

        await factory.ResetDatabaseAsync();

        using var client = CreateClient(factory);
        probeState.ShouldFail = true;

        var firstResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("circuit-user", "Password1"));
        var secondResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("circuit-user", "Password1"));
        var openResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("circuit-user", "Password1"));

        Assert.Equal(HttpStatusCode.InternalServerError, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.InternalServerError, secondResponse.StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, openResponse.StatusCode);

        probeState.ShouldFail = false;
        await Task.Delay(TimeSpan.FromSeconds(1.1));

        var halfOpenResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("circuit-user", "Password1"));
        var recoveredResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("circuit-user", "Password1"));

        Assert.Equal(HttpStatusCode.Unauthorized, halfOpenResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, recoveredResponse.StatusCode);
    }

    private static OpenSaurWebApplicationFactory CreateFactory(
        params (string Key, string Value)[] overrides)
    {
        return CreateConfiguredFactory(null, null, overrides);
    }

    private static OpenSaurWebApplicationFactory CreateConfiguredFactory(
        Action<IWebHostBuilder>? configureWebHost = null,
        Action<DbContextOptionsBuilder>? configureDbContext = null,
        params (string Key, string Value)[] overrides)
    {
        var settings = new Dictionary<string, string?>
        {
            ["EndpointResilience:RateLimiting:Default:PermitLimit"] = "50",
            ["EndpointResilience:RateLimiting:Default:WindowSeconds"] = "60",
            ["EndpointResilience:RateLimiting:Auth:PermitLimit"] = "10",
            ["EndpointResilience:RateLimiting:Auth:WindowSeconds"] = "60",
            ["EndpointResilience:RateLimiting:Token:PermitLimit"] = "10",
            ["EndpointResilience:RateLimiting:Token:WindowSeconds"] = "60",
            ["EndpointResilience:Idempotency:ReplayRetentionMinutes"] = "60",
            ["EndpointResilience:CircuitBreaker:Default:FailureThreshold"] = "5",
            ["EndpointResilience:CircuitBreaker:Default:BreakDurationSeconds"] = "30",
            ["EndpointResilience:CircuitBreaker:Auth:FailureThreshold"] = "3",
            ["EndpointResilience:CircuitBreaker:Auth:BreakDurationSeconds"] = "30",
            ["EndpointResilience:CircuitBreaker:Token:FailureThreshold"] = "3",
            ["EndpointResilience:CircuitBreaker:Token:BreakDurationSeconds"] = "30"
        };

        foreach (var (key, value) in overrides)
        {
            settings[key] = value;
        }

        return new OpenSaurWebApplicationFactory(settings, configureWebHost, configureDbContext);
    }

    private static HttpClient CreateClient(OpenSaurWebApplicationFactory factory)
    {
        return factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri(OpenSaurWebApplicationFactory.Issuer),
                HandleCookies = true
            });
    }

    private static ServiceProvider CreateHybridCacheServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddHybridCache();
        services.AddSingleton<IdempotencyRequestLockProvider>();
        return services.BuildServiceProvider();
    }

    private static DefaultHttpContext CreateHttpContext(string method, string path, string? body = null)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = method;
        httpContext.Request.Path = path;
        httpContext.Response.Body = new MemoryStream();

        if (body is not null)
        {
            httpContext.Request.ContentType = "application/json";
            httpContext.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
        }

        return httpContext;
    }

    private static Endpoint CreateEndpoint(params object[] metadataItems)
    {
        var builder = new RouteEndpointBuilder(
            static context => Task.CompletedTask,
            RoutePatternFactory.Parse("/__test"),
            0);

        foreach (var metadataItem in metadataItems)
        {
            builder.Metadata.Add(metadataItem);
        }

        return builder.Build();
    }

    private static async Task<string> ReadResponseBodyAsync(DefaultHttpContext httpContext)
    {
        httpContext.Response.Body.Position = 0;
        using var reader = new StreamReader(httpContext.Response.Body, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }

    private static async Task<HttpResponseMessage> SendCreateUserRequestAsync(
        HttpClient client,
        CreateUserRequest request,
        string idempotencyKey)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/api/user/create")
        {
            Content = JsonContent.Create(request)
        };
        httpRequest.Headers.Add("Idempotency-Key", idempotencyKey);

        return await client.SendAsync(httpRequest);
    }

    private static async Task<string> GetAccessTokenAsync(HttpClient client, string userName, string password)
    {
        var authorizeResponse = await client.GetAsync(CreateAuthorizeUrl());
        var loginUri = authorizeResponse.Headers.Location ?? throw new InvalidOperationException("FE login redirect was expected.");
        var loginQuery = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(loginUri.Query);
        var returnUrl = loginQuery["returnUrl"].ToString();

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(userName, password));
        if (loginResponse.StatusCode != HttpStatusCode.NoContent)
        {
            throw new InvalidOperationException("Login was expected to succeed.");
        }

        var callbackResponse = await client.GetAsync(returnUrl);
        if (callbackResponse.StatusCode != HttpStatusCode.Redirect
            || callbackResponse.Headers.Location is null
            || !string.Equals(callbackResponse.Headers.Location.GetLeftPart(UriPartial.Path), RedirectUri, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Authorization code callback was expected.");
        }

        var callbackQuery = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(callbackResponse.Headers.Location.Query);
        var authorizationCode = callbackQuery["code"].ToString();
        if (string.IsNullOrWhiteSpace(authorizationCode))
        {
            throw new InvalidOperationException("Authorization code was expected.");
        }

        var tokenResponse = await client.PostAsync(
            "/connect/token",
            new FormUrlEncodedContent(
            [
                new KeyValuePair<string, string>("grant_type", "authorization_code"),
                new KeyValuePair<string, string>("client_id", ClientId),
                new KeyValuePair<string, string>("client_secret", ClientSecret),
                new KeyValuePair<string, string>("redirect_uri", RedirectUri),
                new KeyValuePair<string, string>("code", authorizationCode)
            ]));

        if (tokenResponse.StatusCode != HttpStatusCode.OK)
        {
            throw new InvalidOperationException("Token exchange was expected to succeed.");
        }

        await using var payloadStream = await tokenResponse.Content.ReadAsStreamAsync();
        using var payload = await JsonDocument.ParseAsync(payloadStream);

        return payload.RootElement.GetProperty("access_token").GetString()
               ?? throw new InvalidOperationException("Access token was expected.");
    }

    private static string CreateAuthorizeUrl()
    {
        return Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(
            "/connect/authorize",
            new Dictionary<string, string?>
            {
                ["client_id"] = ClientId,
                ["redirect_uri"] = RedirectUri,
                ["response_type"] = "code",
                ["scope"] = "openid profile email roles offline_access api",
                ["state"] = "endpoint-resilience-state"
            });
    }

    private sealed class CircuitProbeState
    {
        public bool ShouldFail { get; set; }
    }

    private sealed class ThrowingSqliteCommandInterceptor(CircuitProbeState probeState) : DbCommandInterceptor
    {
        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            ThrowIfRequested();
            return base.ReaderExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            ThrowIfRequested();
            return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
        }

        public override InterceptionResult<object> ScalarExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<object> result)
        {
            ThrowIfRequested();
            return base.ScalarExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<object> result,
            CancellationToken cancellationToken = default)
        {
            ThrowIfRequested();
            return base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
        }

        private void ThrowIfRequested()
        {
            if (probeState.ShouldFail)
            {
                throw new SqliteException("Resilience test failure.", 1);
            }
        }
    }

    private sealed record LoginRequest(string UserName, string Password);

    private sealed record CreateUserRequest(
        string UserName,
        string Email,
        string Password,
        string Description,
        string UserSettings);

    private sealed record CreateUserResponse(Guid Id);

    private sealed record MetadataReplayResponse(int InvocationCount);
}
