using OpenSaur.RuleAgent.Web.Domain;

namespace OpenSaur.RuleAgent.Web.Features.SharedFiles.Services;

public enum ShareFileResult
{
    Success,
    FileNotFoundOrNotActive,
    AlreadyInSameProject,
    AlreadyShared,
    ProjectNotFoundOrInactive
}

public interface ISharedFileService
{
    Task<(ShareFileResult Result, ProjectSharedFile? SharedFile, Node? FileNode)> ShareFileAsync(
        Guid projectId,
        Guid fileNodeId,
        Guid workspaceId,
        Guid createdBy,
        CancellationToken cancellationToken = default);

    Task<bool> UnshareFileAsync(
        Guid projectId,
        Guid fileNodeId,
        CancellationToken cancellationToken = default);
}
