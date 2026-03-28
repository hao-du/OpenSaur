export const userQueryKeys = {
  all: () => ["users"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
  list: () => ["users", "list"] as const,
  roleCandidates: () => ["users", "role-candidates"] as const,
  userAssignments: (userId: string) => ["users", "assignments", userId] as const
};
