namespace OpenSaur.CashPilot.Web.Features.Tags.Services;

public interface ITagService
{
    Task EnsureTagDefinitionsExistAsync(
        Guid ownerId,
        IEnumerable<string> tagNames,
        CancellationToken cancellationToken);

    Task EnsureTemplateTagDefinitionsExistAsync(
        Guid ownerId,
        string templateDataJson,
        CancellationToken cancellationToken);
}
