using Microsoft.EntityFrameworkCore;
using OpenSaur.Brainbubby.Web.Domain;
using OpenSaur.Brainbubby.Web.Features.Nodes.Dtos;
using OpenSaur.Brainbubby.Web.Infrastructure.Database;

namespace OpenSaur.Brainbubby.Web.Features.Nodes.Services;

public sealed class NodeTreeService(BrainbubbyDbContext dbContext) : INodeTreeService
{
    public async Task<bool> CreateNodeAsync(Node node, Guid? parentId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // 1. Lock and validate parent folder if specified
        if (parentId.HasValue)
        {
            var parent = node.ProjectId.HasValue
                ? await dbContext.Nodes
                    .FromSqlInterpolated($"""
                        SELECT * FROM "Nodes"
                        WHERE "Id" = {parentId.Value}
                          AND "WorkspaceId" = {node.WorkspaceId}
                          AND "ProjectId" = {node.ProjectId.Value}
                          AND "IsActive" = TRUE
                        FOR UPDATE
                        """)
                    .FirstOrDefaultAsync(cancellationToken)
                : await dbContext.Nodes
                    .FromSqlInterpolated($"""
                        SELECT * FROM "Nodes"
                        WHERE "Id" = {parentId.Value}
                          AND "WorkspaceId" = {node.WorkspaceId}
                          AND "ProjectId" IS NULL
                          AND "IsActive" = TRUE
                        FOR UPDATE
                        """)
                    .FirstOrDefaultAsync(cancellationToken);

            if (parent is null || parent.Type != NodeType.Folder)
            {
                return false;
            }
        }

        // 2. Insert Node entity
        dbContext.Nodes.Add(node);
        await dbContext.SaveChangesAsync(cancellationToken);

        // 3. Atomically insert closure paths
        if (parentId.HasValue)
        {
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "NodeClosures" ("AncestorId", "DescendantId", "Depth")
                SELECT {node.Id}, {node.Id}, 0
                UNION ALL
                SELECT "AncestorId", {node.Id}, "Depth" + 1
                FROM "NodeClosures"
                WHERE "DescendantId" = {parentId.Value}
                """, cancellationToken);
        }
        else
        {
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "NodeClosures" ("AncestorId", "DescendantId", "Depth")
                VALUES ({node.Id}, {node.Id}, 0)
                """, cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateNodeAsync(Guid nodeId, Guid workspaceId, string name, string? description, Guid updatedBy, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var rowsAffected = await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE "Nodes"
            SET "Name" = {name},
                "Description" = {description},
                "UpdatedBy" = {updatedBy},
                "UpdatedOn" = {now}
            WHERE "Id" = {nodeId}
              AND "WorkspaceId" = {workspaceId}
              AND "IsActive" = TRUE
            """, cancellationToken);

        return rowsAffected > 0;
    }

    public async Task<DateTime?> MoveSubtreeAsync(Guid nodeId, Guid? newParentId, Guid updatedBy, CancellationToken cancellationToken = default)
    {
        // Cannot move a node under itself
        if (newParentId.HasValue && newParentId.Value == nodeId)
        {
            return null;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // 1. Lock nodes in consistent order to prevent deadlocks and race conditions
        if (newParentId.HasValue)
        {
            var firstId = nodeId.CompareTo(newParentId.Value) < 0 ? nodeId : newParentId.Value;
            var secondId = nodeId.CompareTo(newParentId.Value) < 0 ? newParentId.Value : nodeId;

            var lockedNodes = await dbContext.Nodes
                .FromSqlInterpolated($"""
                    SELECT * FROM "Nodes"
                    WHERE "Id" IN ({firstId}, {secondId}) AND "IsActive" = TRUE
                    FOR UPDATE
                    """)
                .ToListAsync(cancellationToken);

            // Both moving node and target parent must exist and be active
            if (lockedNodes.Count < 2)
            {
                return null;
            }

            var targetParent = lockedNodes.First(n => n.Id == newParentId.Value);
            var movingNode = lockedNodes.First(n => n.Id == nodeId);

            if (targetParent.Type != NodeType.Folder)
            {
                return null;
            }

            if (targetParent.ProjectId != movingNode.ProjectId || targetParent.WorkspaceId != movingNode.WorkspaceId)
            {
                return null;
            }

            // Cycle check: Cannot move a node to be under one of its own descendants
            var isDescendant = await dbContext.NodeClosures
                .AnyAsync(nc => nc.AncestorId == nodeId && nc.DescendantId == newParentId.Value, cancellationToken);

            if (isDescendant)
            {
                return null;
            }
        }
        else
        {
            // Moving to root: lock the moving node
            var lockedNode = await dbContext.Nodes
                .FromSqlInterpolated($"""
                    SELECT * FROM "Nodes"
                    WHERE "Id" = {nodeId} AND "IsActive" = TRUE
                    FOR UPDATE
                    """)
                .FirstOrDefaultAsync(cancellationToken);

            if (lockedNode is null)
            {
                return null;
            }
        }

        // 2. Disconnect subtree: delete all paths from external ancestors to subtree descendants
        await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            DELETE FROM "NodeClosures"
            WHERE "DescendantId" IN (
                SELECT "DescendantId" FROM "NodeClosures" WHERE "AncestorId" = {nodeId}
            )
            AND "AncestorId" NOT IN (
                SELECT "DescendantId" FROM "NodeClosures" WHERE "AncestorId" = {nodeId}
            )
            """, cancellationToken);

        // 3. Connect new parent ancestors to subtree descendants
        if (newParentId.HasValue)
        {
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "NodeClosures" ("AncestorId", "DescendantId", "Depth")
                SELECT p."AncestorId", c."DescendantId", p."Depth" + c."Depth" + 1
                FROM "NodeClosures" p
                CROSS JOIN "NodeClosures" c
                WHERE p."DescendantId" = {newParentId.Value}
                  AND c."AncestorId" = {nodeId}
                """, cancellationToken);
        }

        // 4. Update the moved node's UpdatedBy and UpdatedOn timestamp in the database
        var now = DateTime.UtcNow;
        await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE "Nodes"
            SET "UpdatedBy" = {updatedBy},
                "UpdatedOn" = {now}
            WHERE "Id" = {nodeId}
            """, cancellationToken);

        await transaction.CommitAsync(cancellationToken);
        return now;
    }

    public async Task SoftDeleteSubtreeAsync(Guid nodeId, Guid updatedBy, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Lock root of the subtree to serialize against concurrent moves or deletes
        var lockedNode = await dbContext.Nodes
            .FromSqlInterpolated($"""
                SELECT * FROM "Nodes"
                WHERE "Id" = {nodeId} AND "IsActive" = TRUE
                FOR UPDATE
                """)
            .FirstOrDefaultAsync(cancellationToken);

        if (lockedNode is null)
        {
            return;
        }

        var now = DateTime.UtcNow;

        await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE "Nodes"
            SET "IsActive" = FALSE, "UpdatedBy" = {updatedBy}, "UpdatedOn" = {now}
            WHERE "Id" IN (
                SELECT "DescendantId" FROM "NodeClosures" WHERE "AncestorId" = {nodeId}
            )
            """, cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<List<NodeBreadcrumbResponse>> GetBreadcrumbAsync(Guid nodeId, CancellationToken cancellationToken = default)
    {
        var breadcrumbs = await dbContext.NodeClosures
            .AsNoTracking()
            .Where(nc => nc.DescendantId == nodeId)
            .Join(dbContext.Nodes.Where(n => n.IsActive),
                closure => closure.AncestorId,
                node => node.Id,
                (closure, node) => new NodeBreadcrumbResponse(node.Id, node.Name, node.Type, closure.Depth))
            .OrderByDescending(b => b.Depth)
            .ToListAsync(cancellationToken);

        return breadcrumbs;
    }

    public async Task<List<NodeTreeNodeResponse>> BuildProjectTreeAsync(Guid workspaceId, Guid? projectId, CancellationToken cancellationToken = default)
    {
        // 1. Get all active nodes in the scope
        var nodes = await dbContext.Nodes
            .AsNoTracking()
            .Where(n => n.WorkspaceId == workspaceId && n.ProjectId == projectId && n.IsActive)
            .ToListAsync(cancellationToken);

        if (nodes.Count == 0)
        {
            return [];
        }

        var nodeIds = nodes.Select(n => n.Id).ToHashSet();

        // 2. Query direct parent links (Depth = 1) within this node set
        var directParentLinks = await dbContext.NodeClosures
            .AsNoTracking()
            .Where(nc => nc.Depth == 1 && nodeIds.Contains(nc.DescendantId) && nodeIds.Contains(nc.AncestorId))
            .ToDictionaryAsync(nc => nc.DescendantId, nc => nc.AncestorId, cancellationToken);

        // 3. Build tree nodes dictionary
        var treeNodeDict = nodes.ToDictionary(
            n => n.Id,
            n => new NodeTreeNodeResponse(
                id: n.Id,
                workspaceId: n.WorkspaceId,
                projectId: n.ProjectId,
                name: n.Name,
                type: n.Type,
                description: n.Description,
                parentId: directParentLinks.TryGetValue(n.Id, out var parentId) ? parentId : null,
                depth: 0,
                createdOn: n.CreatedOn,
                updatedOn: n.UpdatedOn,
                children: []
            ));

        var rootNodes = new List<NodeTreeNodeResponse>();

        // 4. Assemble hierarchy
        foreach (var node in nodes)
        {
            var treeNode = treeNodeDict[node.Id];
            if (directParentLinks.TryGetValue(node.Id, out var parentId) && treeNodeDict.TryGetValue(parentId, out var parentTreeNode))
            {
                parentTreeNode.Children.Add(treeNode);
            }
            else
            {
                rootNodes.Add(treeNode);
            }
        }

        // 5. Recursively sort folders first, then alphabetically
        SortTreeNodes(rootNodes, 0);

        return rootNodes;
    }

    private static void SortTreeNodes(List<NodeTreeNodeResponse> nodes, int currentDepth)
    {
        nodes.Sort((a, b) =>
        {
            if (a.Type != b.Type)
            {
                if (a.Type == NodeType.Folder) return -1;
                if (b.Type == NodeType.Folder) return 1;
            }

            return string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase);
        });

        foreach (var node in nodes)
        {
            node.Depth = currentDepth;
            if (node.Children.Count > 0)
            {
                SortTreeNodes(node.Children, currentDepth + 1);
            }
        }
    }
}
