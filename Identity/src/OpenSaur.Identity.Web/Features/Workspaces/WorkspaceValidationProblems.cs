using OpenSaur.Identity.Web.Infrastructure.Results;

namespace OpenSaur.Identity.Web.Features.Workspaces;

internal static class WorkspaceValidationProblems
{
    public static ResultError[] ForName()
    {
        return
        [
            ResultErrors.Validation(
                "Invalid workspace name.",
                "Workspace name is required.")
        ];
    }

    public static ResultError[] ForDuplicateName()
    {
        return
        [
            ResultErrors.Validation(
                "Workspace name already exists.",
                "A workspace with this name already exists.")
        ];
    }
}
