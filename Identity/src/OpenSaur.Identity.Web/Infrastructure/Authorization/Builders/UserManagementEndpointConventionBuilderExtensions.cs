using OpenSaur.Identity.Web.Infrastructure.Authorization.Filters;

namespace OpenSaur.Identity.Web.Infrastructure.Authorization.Builders;

public static class UserManagementEndpointConventionBuilderExtensions
{
    public static TBuilder RequireUserManagementAccess<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.AddEndpointFilterFactory(
            (_, next) =>
            {
                var filter = new UserManagementAccessFilter();
                return invocationContext => filter.InvokeAsync(invocationContext, next);
            });

        return builder;
    }
}
