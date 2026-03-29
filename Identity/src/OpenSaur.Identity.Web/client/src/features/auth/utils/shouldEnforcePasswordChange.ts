type PasswordChangeState = {
  isImpersonating: boolean;
  requirePasswordChange: boolean;
};

export function shouldEnforcePasswordChange(state: PasswordChangeState) {
  return state.requirePasswordChange && !state.isImpersonating;
}
