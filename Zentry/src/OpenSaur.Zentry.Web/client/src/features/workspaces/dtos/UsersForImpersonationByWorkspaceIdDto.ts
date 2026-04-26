export type UserForImpersonationByWorkspaceIdDto = {
  email: string;
  id: string;
  userName: string;
};

export type UsersForImpersonationByWorkspaceIdDto = {
  users: UserForImpersonationByWorkspaceIdDto[];
  workspaceId: string;
  workspaceName: string;
};
