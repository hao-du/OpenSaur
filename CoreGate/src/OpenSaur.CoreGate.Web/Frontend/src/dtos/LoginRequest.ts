export type LoginRequest = {
  userName: string;
  password: string;
  returnUrl: string;
  turnstileToken: string;
};
