export type MockProfile = {
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
  roles: string[];
  timeZone: string;
  userName: string;
  workspaceName: string;
};

export const mockProfile: MockProfile = {
  email: "SystemAdministrator@opensaur.local",
  firstName: "System",
  lastName: "Administrator",
  locale: "English",
  roles: ["Administrator", "Workspace Manager"],
  timeZone: "Asia/Saigon",
  userName: "SystemAdministrator",
  workspaceName: "Zentry HQ"
};
