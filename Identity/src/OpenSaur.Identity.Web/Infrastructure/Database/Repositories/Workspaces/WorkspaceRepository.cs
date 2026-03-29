using Microsoft.EntityFrameworkCore;
using OpenSaur.Identity.Web.Domain.Workspaces;
using OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces.Dtos;
using OpenSaur.Identity.Web.Infrastructure.Results;
using OpenSaur.Identity.Web.Infrastructure.Security;

namespace OpenSaur.Identity.Web.Infrastructure.Database.Repositories.Workspaces;

public sealed class WorkspaceRepository(ApplicationDbContext dbContext)
{
    public async Task<Result<GetAccessibleWorkspacesResponse>> GetAccessibleWorkspacesAsync(
        GetAccessibleWorkspacesRequest request,
        CancellationToken cancellationToken)
    {
        var workspaces = await ApplyManagedScope(
                dbContext.Workspaces
                    .AsNoTracking()
                    .Include(workspace => workspace.WorkspaceRoles.Where(workspaceRole => workspaceRole.IsActive))
                    .OrderBy(workspace => workspace.Name),
                request.CurrentUserContext)
            .ToListAsync(cancellationToken);

        return Result<GetAccessibleWorkspacesResponse>.Success(new GetAccessibleWorkspacesResponse(workspaces));
    }

    public async Task<Result<GetAccessibleWorkspaceByIdResponse>> GetAccessibleWorkspaceByIdAsync(
        GetAccessibleWorkspaceByIdRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.Workspaces
                .Include(candidate => candidate.WorkspaceRoles)
                .AsQueryable()
            : dbContext.Workspaces
                .AsNoTracking()
                .Include(candidate => candidate.WorkspaceRoles);

        var workspace = await ApplyManagedScope(query, request.CurrentUserContext)
            .SingleOrDefaultAsync(candidate => candidate.Id == request.WorkspaceId, cancellationToken);

        return workspace is null
            ? Result<GetAccessibleWorkspaceByIdResponse>.NotFound(
                "Workspace not found.",
                "No accessible workspace matched the provided identifier.")
            : Result<GetAccessibleWorkspaceByIdResponse>.Success(new GetAccessibleWorkspaceByIdResponse(workspace));
    }

    public async Task<Result<GetWorkspaceByIdResponse>> GetWorkspaceByIdAsync(
        GetWorkspaceByIdRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.Workspaces
                .Include(candidate => candidate.WorkspaceRoles)
                .AsQueryable()
            : dbContext.Workspaces
                .AsNoTracking()
                .Include(candidate => candidate.WorkspaceRoles);

        var workspace = await query.SingleOrDefaultAsync(candidate => candidate.Id == request.WorkspaceId, cancellationToken);

        return workspace is null
            ? Result<GetWorkspaceByIdResponse>.NotFound(
                "Workspace not found.",
                "No workspace matched the provided identifier.")
            : Result<GetWorkspaceByIdResponse>.Success(new GetWorkspaceByIdResponse(workspace));
    }

    public async Task<Result<GetActiveWorkspaceByIdResponse>> GetActiveWorkspaceByIdAsync(
        GetActiveWorkspaceByIdRequest request,
        CancellationToken cancellationToken)
    {
        var query = request.TrackChanges
            ? dbContext.Workspaces.AsQueryable()
            : dbContext.Workspaces.AsNoTracking();

        var workspace = await query.SingleOrDefaultAsync(candidate => candidate.Id == request.WorkspaceId, cancellationToken);
        if (workspace is null || !workspace.IsActive)
        {
            return Result<GetActiveWorkspaceByIdResponse>.Validation(
                ResultErrors.Validation(
                    "Invalid workspace selection.",
                    "An active workspace is required."));
        }

        return Result<GetActiveWorkspaceByIdResponse>.Success(new GetActiveWorkspaceByIdResponse(workspace));
    }

    public async Task<Result<GetWorkspacesByNameResponse>> GetWorkspacesByNameAsync(
        GetWorkspacesByNameRequest request,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Workspaces
            .AsNoTracking()
            .Where(candidate => candidate.Name == request.Name);

        if (request.ExcludedWorkspaceId.HasValue)
        {
            query = query.Where(candidate => candidate.Id != request.ExcludedWorkspaceId.Value);
        }

        var workspaces = await query.ToListAsync(cancellationToken);

        return Result<GetWorkspacesByNameResponse>.Success(new GetWorkspacesByNameResponse(workspaces));
    }

    private static IQueryable<Workspace> ApplyManagedScope(
        IQueryable<Workspace> query,
        CurrentUserContext currentUserContext)
    {
        return currentUserContext.HasGlobalWorkspaceScope
            ? query
            : query.Where(candidate => candidate.Id == currentUserContext.WorkspaceId);
    }
}
