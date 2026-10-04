using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OpenSaur.RuleAgent.Web.Features.Nodes.Services;
using OpenSaur.RuleAgent.Web.Features.Snapshots.Services;
using OpenSaur.RuleAgent.Web.Features.Templates.Dtos;
using OpenSaur.RuleAgent.Web.Features.Templates.Handlers;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Templates;

public static class TemplatesEndpoints
{
    public static IEndpointRouteBuilder MapTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        var templates = app.MapGroup("/api/templates")
            .RequireAuthorization();

        // 1. List active workspace instruction templates (all authenticated members)
        templates.MapGet("", async (
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetTemplatesHandler.HandleAsync(userContext, dbContext, cancellationToken);
        });

        // 2. Get instruction template by ID (all authenticated members)
        templates.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetTemplateByIdHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        // 3. Create instruction template (SuperAdministrator only)
        templates.MapPost("", async (
            CreateTemplateRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            IValidator<CreateTemplateRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await CreateTemplateHandler.HandleAsync(request, userContext, dbContext, nodeTreeService, validator, cancellationToken);
        });

        // 4. Update instruction template (SuperAdministrator only)
        templates.MapPut("/{id:guid}", async (
            Guid id,
            UpdateTemplateRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            ISnapshotService snapshotService,
            IClaimService claimService,
            IValidator<UpdateTemplateRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await UpdateTemplateHandler.HandleAsync(id, request, userContext, dbContext, nodeTreeService, snapshotService, validator, cancellationToken);
        });

        // 5. Delete instruction template (SuperAdministrator only)
        templates.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await DeleteTemplateHandler.HandleAsync(id, userContext, dbContext, nodeTreeService, cancellationToken);
        });

        return app;
    }
}
