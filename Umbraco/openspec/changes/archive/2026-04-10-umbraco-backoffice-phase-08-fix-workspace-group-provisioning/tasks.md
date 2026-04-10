## 1. Workspace Group Alias

- [x] 1.1 Replace the hyphenated GUID alias with a stable alphanumeric workspace group alias
- [x] 1.2 Keep the visible group name as the original `workspace_id`
- [x] 1.3 Fall back to legacy managed workspace groups created before this fix

## 2. Creation Result Handling

- [x] 2.1 Use the `IUserGroupService.CreateAsync` result when creation succeeds
- [x] 2.2 Include the Umbraco operation status when creation fails

## 3. Verification

- [x] 3.1 Build the Umbraco project successfully
