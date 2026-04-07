using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;

namespace OpenSaur.Umbraco.Web.Authentication;

internal sealed class OpenSaurBackOfficeUserProvisioningService(
    IUserService userService,
    IUserGroupService userGroupService,
    IContentService contentService,
    IMediaService mediaService,
    IShortStringHelper shortStringHelper,
    IOptions<OpenSaurIdentityBackOfficeOptions> optionsAccessor)
{
    private const string ManagedWorkspaceGroupDescription = "Managed by OpenSaur Identity workspace provisioning.";

    public IUserGroup EnsureWorkspaceGroup(OpenSaurIdentitySession session)
    {
        var existingGroup = userGroupService.GetAsync(session.WorkspaceGroupAlias).GetAwaiter().GetResult();
        if (existingGroup is not null)
        {
            return existingGroup;
        }

        var newGroup = new UserGroup(shortStringHelper)
        {
            Alias = session.WorkspaceGroupAlias,
            Name = session.WorkspaceGroupName,
            Description = ManagedWorkspaceGroupDescription
        };

        newGroup.AddAllowedSection(Constants.Applications.Content);
        newGroup.AddAllowedSection(Constants.Applications.Media);

        userGroupService.CreateAsync(newGroup, Constants.Security.SuperUserKey, Array.Empty<Guid>())
            .GetAwaiter()
            .GetResult();

        return userGroupService.GetAsync(session.WorkspaceGroupAlias).GetAwaiter().GetResult()
               ?? throw new InvalidOperationException($"Failed to create workspace group '{session.WorkspaceGroupAlias}'.");
    }

    public void PrepareAutoLinkedUser(BackOfficeIdentityUser autoLinkedUser, ExternalLoginInfo loginInfo)
    {
        if (!OpenSaurIdentitySession.TryCreate(loginInfo.Principal, out var session) || session is null)
        {
            throw new InvalidOperationException("Effective OpenSaur identity claims are missing.");
        }

        var workspaceGroup = EnsureWorkspaceGroup(session);
        autoLinkedUser.Culture = optionsAccessor.Value.DefaultCulture;
        autoLinkedUser.SetGroups([workspaceGroup.ToReadOnlyGroup()]);

        if (session.IsSuperAdministrator)
        {
            autoLinkedUser.StartContentIds = [Constants.System.Root];
            autoLinkedUser.StartMediaIds = [Constants.System.Root];
        }
        else
        {
            autoLinkedUser.StartContentIds = [];
            autoLinkedUser.StartMediaIds = [];
        }
    }

    public bool SynchronizeUser(BackOfficeIdentityUser identityUser, ExternalLoginInfo loginInfo)
    {
        if (!OpenSaurIdentitySession.TryCreate(loginInfo.Principal, out var session) || session is null)
        {
            return false;
        }

        if (!Guid.TryParse(identityUser.Id, out var userKey))
        {
            return false;
        }

        var user = userService.GetAsync(userKey).GetAwaiter().GetResult();
        if (user is null)
        {
            return false;
        }

        var workspaceGroup = EnsureWorkspaceGroup(session);
        var groupKeys = BuildDesiredUserGroupKeys(user, workspaceGroup);

        var hasContentRootAccess = session.IsSuperAdministrator || user.StartContentIds.Contains(Constants.System.Root);
        var hasMediaRootAccess = session.IsSuperAdministrator || user.StartMediaIds.Contains(Constants.System.Root);

        var updateModel = new UserUpdateModel
        {
            ExistingUserKey = user.Key,
            Email = session.Email,
            UserName = session.UserName,
            Name = session.DisplayName,
            LanguageIsoCode = optionsAccessor.Value.DefaultCulture,
            UserGroupKeys = groupKeys,
            HasContentRootAccess = hasContentRootAccess,
            ContentStartNodeKeys = hasContentRootAccess
                ? []
                : new HashSet<Guid>(ResolveContentStartNodeKeys(user.StartContentIds ?? [])),
            HasMediaRootAccess = hasMediaRootAccess,
            MediaStartNodeKeys = hasMediaRootAccess
                ? []
                : new HashSet<Guid>(ResolveMediaStartNodeKeys(user.StartMediaIds ?? []))
        };

        userService.UpdateAsync(Constants.Security.SuperUserKey, updateModel)
            .GetAwaiter()
            .GetResult();

        return true;
    }

    private static ISet<Guid> BuildDesiredUserGroupKeys(IUser user, IUserGroup workspaceGroup)
    {
        var preservedGroupKeys = user.Groups
            .Where(group => !IsManagedWorkspaceGroup(group) || group.Key == workspaceGroup.Key)
            .Select(group => group.Key);

        return preservedGroupKeys
            .Append(workspaceGroup.Key)
            .Distinct()
            .ToHashSet();
    }

    private static bool IsManagedWorkspaceGroup(IReadOnlyUserGroup group) =>
        string.Equals(group.Description, ManagedWorkspaceGroupDescription, StringComparison.Ordinal);

    private IEnumerable<Guid> ResolveContentStartNodeKeys(IEnumerable<int> startNodeIds)
    {
        foreach (var nodeId in startNodeIds.Where(id => id != Constants.System.Root).Distinct())
        {
            var content = contentService.GetById(nodeId);
            if (content is not null)
            {
                yield return content.Key;
            }
        }
    }

    private IEnumerable<Guid> ResolveMediaStartNodeKeys(IEnumerable<int> startNodeIds)
    {
        foreach (var nodeId in startNodeIds.Where(id => id != Constants.System.Root).Distinct())
        {
            var media = mediaService.GetById(nodeId);
            if (media is not null)
            {
                yield return media.Key;
            }
        }
    }
}
