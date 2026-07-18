export type CreateUserRequestDto = {
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  requirePasswordChange: boolean;
  userName: string;
};
