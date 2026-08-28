export interface AuthPanelLifecycleInput {
  open: boolean;
  openedWithoutAuthenticatedUser: boolean;
  signedIn: boolean;
}

/**
 * Close a sign-in attempt after Firebase establishes an authenticated user.
 * Panels opened by an existing player remain available for account management.
 */
export function shouldCloseAuthPanelAfterAuthentication({
  open,
  openedWithoutAuthenticatedUser,
  signedIn,
}: AuthPanelLifecycleInput): boolean {
  return open && openedWithoutAuthenticatedUser && signedIn;
}