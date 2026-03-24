using System.ComponentModel;

namespace OpenSaur.Identity.Web.Domain.Permissions;

public enum PermissionCode
{
    [Description("Administrator.CanManage")]
    Administrator_CanManage = 1,

    [Description("Administrator.CanView")]
    Administrator_CanView = 2
}
