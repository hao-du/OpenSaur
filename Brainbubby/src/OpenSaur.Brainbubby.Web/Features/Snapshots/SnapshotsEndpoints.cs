using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Dtos;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Handlers;
using OpenSaur.Brainbubby.Web.Features.Snapshots.Services;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;
using OpenSaur.Brainbubby.Web.Infrastructure.Security;

namespace OpenSaur.Brainbubby.Web.Features.Snapshots;

public static class SnapshotsEndpoints
{
    public static IEndpointRouteBuilder MapSnapshotEndpoints(this IEndpointRouteBuilder app)
    {
        // --- Node-scoped content & snapshot endpoints ---
        var nodes = app.MapGroup("/api/nodes")
            .RequireAuthorization();

        // 1. Update live node content (files / templates)
        nodes.MapPut("/{id:guid}/content", async (
            Guid id,
            UpdateNodeContentRequest request,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            ISnapshotService snapshotService,
            IClaimService claimService,
            IValidator<UpdateNodeContentRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await UpdateNodeContentHandler.HandleAsync(id, request, userContext, dbContext, snapshotService, validator, cancellationToken);
        });

        // 2. Create permanent snapshot for a node
        nodes.MapPost("/{id:guid}/snapshots", async (
            Guid id,
            CreateSnapshotRequest request,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            ISnapshotService snapshotService,
            IClaimService claimService,
            IValidator<CreateSnapshotRequest> validator,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await CreateSnapshotHandler.HandleAsync(id, request, userContext, dbContext, snapshotService, validator, cancellationToken);
        });

        // 3. List snapshot history for a node
        nodes.MapGet("/{id:guid}/snapshots", async (
            Guid id,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetNodeSnapshotsHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        // --- Snapshot-scoped endpoints ---
        var snapshots = app.MapGroup("/api/snapshots")
            .RequireAuthorization();

        // 4. Get snapshot details by snapshot ID
        snapshots.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetSnapshotByIdHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        // 5. Get snapshot diff against current live node content
        snapshots.MapGet("/{id:guid}/diff", async (
            Guid id,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await GetSnapshotDiffHandler.HandleAsync(id, userContext, dbContext, cancellationToken);
        });

        // 6. Approve snapshot (transition status to Approved)
        snapshots.MapPut("/{id:guid}/approve", async (
            Guid id,
            ClaimsPrincipal principal,
            BrainbubbyDbContext dbContext,
            ISnapshotService snapshotService,
            IClaimService claimService,
            CancellationToken cancellationToken) =>
        {
            var userContext = claimService.GetUserContext(principal);
            return await ApproveSnapshotHandler.HandleAsync(id, userContext, dbContext, snapshotService, cancellationToken);
        });

        return app;
    }
}
