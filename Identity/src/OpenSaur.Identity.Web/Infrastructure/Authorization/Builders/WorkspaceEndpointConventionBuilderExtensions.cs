using OpenSaur.Identity.Web.Infrastructure.Authorization.Filters;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;

public static class WorkspaceEndpointConventionBuilderExtensions
{
    public static TBuilder RequireWorkspaceAccess<TBuilder>(
        this TBuilder builder,
        bool restrictToSuperAdministrator = false,
        bool allowImpersonatedSuperAdministrator = false)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.AddEndpointFilterFactory(
            (_, next) =>
            {
                var filter = new WorkspaceAccessFilter(
                    restrictToSuperAdministrator,
                    allowImpersonatedSuperAdministrator);
                return invocationContext => filter.InvokeAsync(invocationContext, next);
            });

        return builder;
    }
}
