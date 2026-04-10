using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
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
    ILogger<OpenSaurBackOfficeUserProvisioningService> logger,
    IOptions<OpenSaurIdentityBackOfficeOptions> optionsAccessor)
{
    private const string ManagedWorkspaceGroupDescription = "Managed by OpenSaur Identity workspace provisioning.";

    public IUserGroup EnsureWorkspaceGroup(OpenSaurIdentitySession session)
    {
        var existingGroup = FindExistingWorkspaceGroup(session);
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

        var createResult = userGroupService.CreateAsync(newGroup, Constants.Security.SuperUserKey, Array.Empty<Guid>())
            .GetAwaiter()
            .GetResult();

        if (createResult.Success)
        {
            return createResult.Result;
        }

        existingGroup = FindExistingWorkspaceGroup(session);
        if (existingGroup is not null)
        {
            return existingGroup;
        }

        throw new InvalidOperationException(
            $"Failed to create workspace group '{session.WorkspaceGroupAlias}'. Status: {createResult.Status}.");
    }

    public void PrepareAutoLinkedUser(BackOfficeIdentityUser autoLinkedUser, ExternalLoginInfo loginInfo)
    {
        if (!OpenSaurIdentitySession.TryCreate(loginInfo.Principal, out var session) || session is null)
        {
            throw new InvalidOperationException("Effective OpenSaur identity claims are missing.");
        }

        var workspaceGroup = EnsureWorkspaceGroup(session);
        var hasFullAdminAccess = session.IsSuperAdministrator;
        autoLinkedUser.Culture = optionsAccessor.Value.DefaultCulture;
        autoLinkedUser.EmailConfirmed = true;
        autoLinkedUser.IsApproved = true;
        autoLinkedUser.SetGroups(BuildDesiredIdentityGroups(hasFullAdminAccess, workspaceGroup));

        if (hasFullAdminAccess)
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
            logger.LogWarning("OpenSaur external login was rejected because required Identity claims were missing.");
            return false;
        }

        var workspaceGroup = EnsureWorkspaceGroup(session);
        var hasFullAdminAccess = session.IsSuperAdministrator;
        ApplyCurrentIdentityUserAccess(identityUser, hasFullAdminAccess, workspaceGroup);

        var user = ResolveUser(identityUser, session);
        if (user is null)
        {
            logger.LogWarning(
                "OpenSaur external login could not resolve persisted Umbraco user. Applying workspace-group access to the current identity user. Identity user id: {IdentityUserId}, username: {IdentityUserName}, email: {IdentityUserEmail}, session username: {SessionUserName}, session email: {SessionEmail}.",
                identityUser.Id,
                identityUser.UserName,
                identityUser.Email,
                session.UserName,
                session.Email);

            return true;
        }

        hasFullAdminAccess = session.IsSuperAdministrator;
        var groupKeys = BuildDesiredUserGroupKeys(user, workspaceGroup, hasFullAdminAccess);

        var hasContentRootAccess = hasFullAdminAccess || user.StartContentIds.Contains(Constants.System.Root);
        var hasMediaRootAccess = hasFullAdminAccess || user.StartMediaIds.Contains(Constants.System.Root);

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
        EnsureExistingUserCanLogin(user);
        EnsurePersistedUserAccess(user.Key, workspaceGroup.Key, hasFullAdminAccess);

        return true;
    }

    private void ApplyCurrentIdentityUserAccess(
        BackOfficeIdentityUser identityUser,
        bool hasFullAdminAccess,
        IUserGroup workspaceGroup)
    {
        identityUser.Culture = optionsAccessor.Value.DefaultCulture;
        identityUser.EmailConfirmed = true;
        identityUser.IsApproved = true;
        identityUser.SetGroups(BuildDesiredIdentityGroups(hasFullAdminAccess, workspaceGroup));

        if (hasFullAdminAccess)
        {
            identityUser.StartContentIds = [Constants.System.Root];
            identityUser.StartMediaIds = [Constants.System.Root];
            return;
        }

        identityUser.StartContentIds = [];
        identityUser.StartMediaIds = [];
    }

    private void EnsureExistingUserCanLogin(IUser user)
    {
        if (user.UserState is UserState.Disabled or UserState.Inactive)
        {
            userService.EnableAsync(Constants.Security.SuperUserKey, new HashSet<Guid> { user.Key })
                .GetAwaiter()
                .GetResult();
        }

        if (user.UserState is UserState.LockedOut)
        {
            userService.UnlockAsync(Constants.Security.SuperUserKey, [user.Key])
                .GetAwaiter()
                .GetResult();
        }
    }

    private IUser? ResolveUser(BackOfficeIdentityUser identityUser, OpenSaurIdentitySession session)
    {
        if (Guid.TryParse(identityUser.Id, out var userKey))
        {
            var user = userService.GetAsync(userKey).GetAwaiter().GetResult();
            if (user is not null)
            {
                return user;
            }
        }

        return ResolveUserByEmail(identityUser.Email)
               ?? ResolveUserByEmail(session.Email)
               ?? ResolveUserByUserName(identityUser.UserName)
               ?? ResolveUserByUserName(session.UserName);
    }

    private IUser? ResolveUserByEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? null
            : userService.GetByEmail(email);
    }

    private IUser? ResolveUserByUserName(string? userName)
    {
        return string.IsNullOrWhiteSpace(userName)
            ? null
            : userService.GetByUsername(userName);
    }

    private void EnsurePersistedUserAccess(Guid userKey, Guid workspaceGroupKey, bool isSuperAdministrator)
    {
        var refreshedUser = userService.GetAsync(userKey).GetAwaiter().GetResult()
            ?? throw new InvalidOperationException($"Failed to reload Umbraco user '{userKey}' after synchronization.");

        var requiresWorkspaceGroup = !refreshedUser.Groups.Any(group => group.Key == workspaceGroupKey);
        var requiresAdminGroup = isSuperAdministrator
                                 && !refreshedUser.Groups.Any(group => group.Key == Constants.Security.AdminGroupKey);
        var requiresSensitiveDataGroup = isSuperAdministrator
                                         && !refreshedUser.Groups.Any(group => group.Key == Constants.Security.SensitiveDataGroupKey);

        if (requiresWorkspaceGroup || requiresAdminGroup || requiresSensitiveDataGroup)
        {
            RepairPersistedUserGroups(refreshedUser, workspaceGroupKey, isSuperAdministrator);
            refreshedUser = userService.GetAsync(userKey).GetAwaiter().GetResult()
                ?? throw new InvalidOperationException($"Failed to reload Umbraco user '{userKey}' after repairing access.");
        }

        if (!refreshedUser.Groups.Any(group => group.Key == workspaceGroupKey))
        {
            throw new InvalidOperationException(
                $"Umbraco user '{userKey}' is not assigned to workspace group '{workspaceGroupKey}' after repair.");
        }

        if (isSuperAdministrator && !refreshedUser.Groups.Any(group => group.Key == Constants.Security.AdminGroupKey))
        {
            throw new InvalidOperationException(
                $"Super administrator Umbraco user '{userKey}' is not assigned to the Umbraco admin group after repair.");
        }

        if (isSuperAdministrator && !refreshedUser.Groups.Any(group => group.Key == Constants.Security.SensitiveDataGroupKey))
        {
            throw new InvalidOperationException(
                $"Super administrator Umbraco user '{userKey}' is not assigned to the Umbraco sensitive data group after repair.");
        }
    }

    private void RepairPersistedUserGroups(IUser user, Guid workspaceGroupKey, bool isSuperAdministrator)
    {
        var workspaceGroup = FindUserGroupByKey(workspaceGroupKey)
            ?? throw new InvalidOperationException($"Failed to resolve workspace group '{workspaceGroupKey}' for repair.");

        var repairedGroupKeys = BuildDesiredUserGroupKeys(user, workspaceGroup, isSuperAdministrator);
        var hasContentRootAccess = isSuperAdministrator || user.StartContentIds.Contains(Constants.System.Root);
        var hasMediaRootAccess = isSuperAdministrator || user.StartMediaIds.Contains(Constants.System.Root);

        var repairModel = new UserUpdateModel
        {
            ExistingUserKey = user.Key,
            Email = user.Email,
            UserName = user.Username,
            Name = user.Name ?? user.Username,
            LanguageIsoCode = user.Language ?? optionsAccessor.Value.DefaultCulture,
            UserGroupKeys = repairedGroupKeys,
            HasContentRootAccess = hasContentRootAccess,
            ContentStartNodeKeys = hasContentRootAccess
                ? []
                : new HashSet<Guid>(ResolveContentStartNodeKeys(user.StartContentIds ?? [])),
            HasMediaRootAccess = hasMediaRootAccess,
            MediaStartNodeKeys = hasMediaRootAccess
                ? []
                : new HashSet<Guid>(ResolveMediaStartNodeKeys(user.StartMediaIds ?? []))
        };

        userService.UpdateAsync(Constants.Security.SuperUserKey, repairModel)
            .GetAwaiter()
            .GetResult();
    }

    private IUserGroup? FindUserGroupByKey(Guid groupKey)
    {
        var page = userGroupService.GetAllAsync(0, 10_000).GetAwaiter().GetResult();
        return page.Items.FirstOrDefault(group => group.Key == groupKey);
    }

    private static ISet<Guid> BuildDesiredUserGroupKeys(IUser user, IUserGroup workspaceGroup, bool isSuperAdministrator)
    {
        var preservedGroupKeys = user.Groups
            .Where(group =>
                (!IsManagedWorkspaceGroup(group) || group.Key == workspaceGroup.Key)
                && (!string.Equals(group.Alias, Constants.Security.AdminGroupAlias, StringComparison.OrdinalIgnoreCase)
                    || isSuperAdministrator)
                && (group.Key != Constants.Security.SensitiveDataGroupKey || isSuperAdministrator))
            .Select(group => group.Key);

        IEnumerable<Guid> desiredGroupKeys = preservedGroupKeys.Append(workspaceGroup.Key);
        if (isSuperAdministrator)
        {
            desiredGroupKeys = desiredGroupKeys
                .Append(Constants.Security.AdminGroupKey)
                .Append(Constants.Security.SensitiveDataGroupKey);
        }

        return desiredGroupKeys.Distinct().ToHashSet();
    }

    private static bool IsManagedWorkspaceGroup(IReadOnlyUserGroup group) =>
        string.Equals(group.Description, ManagedWorkspaceGroupDescription, StringComparison.Ordinal);

    private IReadOnlyCollection<IReadOnlyUserGroup> BuildDesiredIdentityGroups(
        bool hasFullAdminAccess,
        IUserGroup workspaceGroup)
    {
        if (!hasFullAdminAccess)
        {
            return [workspaceGroup.ToReadOnlyGroup()];
        }

        var adminGroup = userGroupService.GetAsync(Constants.Security.AdminGroupAlias).GetAwaiter().GetResult()
            ?? throw new InvalidOperationException("Failed to resolve the built-in Umbraco administrator group.");
        var sensitiveDataGroup = FindUserGroupByKey(Constants.Security.SensitiveDataGroupKey)
            ?? throw new InvalidOperationException("Failed to resolve the built-in Umbraco sensitive data group.");

        return
        [
            workspaceGroup.ToReadOnlyGroup(),
            adminGroup.ToReadOnlyGroup(),
            sensitiveDataGroup.ToReadOnlyGroup()
        ];
    }

    private IUserGroup? FindExistingWorkspaceGroup(OpenSaurIdentitySession session)
    {
        var existingGroup = userGroupService.GetAsync(session.WorkspaceGroupAlias).GetAwaiter().GetResult()
                            ?? userGroupService.GetAsync(session.LegacyWorkspaceGroupAlias).GetAwaiter().GetResult();
        if (existingGroup is not null)
        {
            return existingGroup;
        }

        var page = userGroupService.GetAllAsync(0, 10_000).GetAwaiter().GetResult();
        return page.Items.FirstOrDefault(group =>
            string.Equals(group.Name, session.WorkspaceGroupName, StringComparison.Ordinal)
            && string.Equals(group.Description, ManagedWorkspaceGroupDescription, StringComparison.Ordinal));
    }

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
