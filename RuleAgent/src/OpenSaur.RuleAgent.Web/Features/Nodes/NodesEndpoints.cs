using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OpenSaur.RuleAgent.Web.Features.Nodes.Dtos;
using OpenSaur.RuleAgent.Web.Features.Nodes.Handlers;
using OpenSaur.RuleAgent.Web.Features.Nodes.Services;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Nodes;

public static class NodesEndpoints
{
    public static IEndpointRouteBuilder MapNodeEndpoints(this IEndpointRouteBuilder app)
    {
        var nodes = app.MapGroup("/api/nodes")
            .RequireAuthorization();

        // 1. Get hierarchical project/workspace tree
        nodes.MapGet("/tree", async (
            Guid? projectId,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetProjectTreeHandler.HandleAsync(projectId, userContext, dbContext, nodeTreeService, cancellationToken);
        });

        // 2. Get node by ID
        nodes.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetNodeByIdHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        // 3. Get direct children of a folder
        nodes.MapGet("/{id:guid}/children", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetNodeChildrenHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        // 4. Get breadcrumb trail from root to node
        nodes.MapGet("/{id:guid}/breadcrumb", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetNodeBreadcrumbHandler.HandleAsync(id, userContext, dbContext, nodeTreeService, cancellationToken);
        });

        // 5. Create a new node (folder or file)
        nodes.MapPost("", async (
            Guid? projectId,
            CreateNodeRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            IValidator<CreateNodeRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await CreateNodeHandler.HandleAsync(projectId, request, userContext, dbContext, nodeTreeService, validator, cancellationToken);
        });

        // 6. Update node name or description
        nodes.MapPut("/{id:guid}", async (
            Guid id,
            UpdateNodeRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            IValidator<UpdateNodeRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await UpdateNodeHandler.HandleAsync(id, request, userContext, dbContext, nodeTreeService, validator, cancellationToken);
        });

        // 7. Relocate subtree under a new parent folder or root
        nodes.MapPut("/{id:guid}/move", async (
            Guid id,
            MoveNodeRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await MoveNodeHandler.HandleAsync(id, request, userContext, dbContext, nodeTreeService, cancellationToken);
        });

        // 8. Soft-delete subtree cascading down all descendants
        nodes.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            INodeTreeService nodeTreeService,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await DeleteNodeHandler.HandleAsync(id, userContext, dbContext, nodeTreeService, cancellationToken);
        });

        return app;
    }
}
