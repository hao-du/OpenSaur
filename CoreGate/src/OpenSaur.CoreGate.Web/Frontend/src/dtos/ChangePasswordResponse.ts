export type ChangePasswordResponse = {
  success: boolean;
  redirectUri?: string | null;
  error?: string | null;
  forbidden?: boolean;
};
