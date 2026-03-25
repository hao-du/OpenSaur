namespace OpenSaur.Identity.Web.Tests.Workspaces;

public sealed class WorkspacesSliceStructureTests
{
    [Fact]
    public void WorkspacesSlice_ExposesDedicatedEndpointHandlerAndContractTypes()
    {
        var assembly = typeof(Program).Assembly;

        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.WorkspaceEndpoints"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaces.GetWorkspacesHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaces.GetWorkspacesResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaceById.GetWorkspaceByIdHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.GetWorkspaceById.GetWorkspaceByIdResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace.CreateWorkspaceHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace.CreateWorkspaceRequest"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.CreateWorkspace.CreateWorkspaceResponse"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace.EditWorkspaceHandler"));
        Assert.NotNull(assembly.GetType("OpenSaur.Identity.Web.Features.Workspaces.EditWorkspace.EditWorkspaceRequest"));
    }
}
