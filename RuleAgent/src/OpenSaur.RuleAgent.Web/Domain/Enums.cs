namespace OpenSaur.RuleAgent.Web.Domain;

public enum NodeType : byte
{
    Folder = 1,
    File = 2,
    Template = 3
}

public enum ProjectPermissionType : byte
{
    CanView = 1,
    CanEdit = 2
}

public enum SnapshotStatus : byte
{
    Working = 1,
    Approved = 2
}
