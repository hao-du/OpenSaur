using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Dtos;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Handlers;
using OpenSaur.Brainbubby.Web.Features.SharedFiles.Services;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.SharedFiles;

public static class SharedFilesEndpoints
{
    public static IEndpointRouteBuilder MapSharedFilesEndpoints(this IEndpointRouteBuilder app)
    {
        var projects = app.MapGroup("/api/projects/{projectId:guid}/shared-files")
            .RequireAuthorization();

        // 1. List files shared with this project (CanView, CanEdit, or Creator)
        projects.MapGet("", async (
            Guid projectId,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetProjectSharedFilesHandler.HandleAsync(projectId, userContext, dbContext, cancellationToken);
        });

        // 2. Read specific shared file in this project (Read-Only)
        projects.MapGet("/{fileNodeId:guid}", async (
            Guid projectId,
            Guid fileNodeId,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetSharedFileContentHandler.HandleAsync(projectId, fileNodeId, userContext, dbContext, cancellationToken);
        });

        // 3. Share a file with this project (CanEdit or Creator)
        projects.MapPost("", async (
            Guid projectId,
            ShareFileRequest request,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            ISharedFileService sharedFileService,
            IClaimService claimService,
            IValidator<ShareFileRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await ShareFileWithProjectHandler.HandleAsync(projectId, request, userContext, dbContext, sharedFileService, validator, cancellationToken);
        });

        // 4. Unshare a file from this project (CanEdit or Creator)
        projects.MapDelete("/{fileNodeId:guid}", async (
            Guid projectId,
            Guid fileNodeId,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            ISharedFileService sharedFileService,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await UnshareFileFromProjectHandler.HandleAsync(projectId, fileNodeId, userContext, dbContext, sharedFileService, cancellationToken);
        });

        return app;
    }
}
