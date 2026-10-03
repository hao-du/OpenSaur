using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OpenSaur.RuleAgent.Web.Features.Projects.Dtos;
using OpenSaur.RuleAgent.Web.Features.Projects.Handlers;
using OpenSaur.RuleAgent.Web.Infrastructure.Database;
using OpenSaur.RuleAgent.Web.Infrastructure.Security;

namespace OpenSaur.RuleAgent.Web.Features.Projects;

public static class ProjectsEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var projects = app.MapGroup("/api/projects")
            .RequireAuthorization();

        projects.MapGet("", async (
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetProjectsHandler.HandleAsync(userContext, dbContext, cancellationToken);
        });

        projects.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetProjectByIdHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        projects.MapPost("", async (
            CreateProjectRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            IValidator<CreateProjectRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await CreateProjectHandler.HandleAsync(request, userContext, dbContext, validator, cancellationToken);
        });

        projects.MapPut("/{id:guid}", async (
            Guid id,
            UpdateProjectRequest request,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            IValidator<UpdateProjectRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await UpdateProjectHandler.HandleAsync(id, request, userContext, dbContext, validator, cancellationToken);
        });

        projects.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RuleAgentDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await DeleteProjectHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        return app;
    }
}
