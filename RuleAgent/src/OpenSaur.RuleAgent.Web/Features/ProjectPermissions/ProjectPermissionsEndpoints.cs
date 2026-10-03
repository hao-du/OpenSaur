using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Dtos;
using OpenSaur.RuleAgent.Web.Features.ProjectPermissions.Handlers;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.ProjectPermissions;

public static class ProjectPermissionsEndpoints
{
    public static IEndpointRouteBuilder MapProjectPermissionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:guid}/members")
            .RequireAuthorization();

        group.MapGet("", async (
            Guid projectId,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetProjectMembersHandler.HandleAsync(projectId, userContext, dbContext, cancellationToken);
        });

        group.MapGet("/candidates", async (
            Guid projectId,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetCandidateMembersHandler.HandleAsync(projectId, userContext, dbContext, cancellationToken);
        });

        group.MapPost("", async (
            Guid projectId,
            AssignProjectPermissionRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            IValidator<AssignProjectPermissionRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await AssignProjectPermissionHandler.HandleAsync(projectId, request, userContext, dbContext, validator, cancellationToken);
        });

        group.MapPut("/{userId:guid}", async (
            Guid projectId,
            Guid userId,
            UpdateProjectPermissionRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            IValidator<UpdateProjectPermissionRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await UpdateProjectPermissionHandler.HandleAsync(projectId, userId, request, userContext, dbContext, validator, cancellationToken);
        });

        group.MapDelete("/{userId:guid}", async (
            Guid projectId,
            Guid userId,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await RevokeProjectPermissionHandler.HandleAsync(projectId, userId, userContext, dbContext, cancellationToken);
        });

        return app;
    }
}
