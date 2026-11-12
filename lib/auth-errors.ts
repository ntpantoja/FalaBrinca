/** Network outages and service limits do not mean the user signed out. */
export function temporaryAuthFailure(
  error: { status?: number; name?: string } | null,
) {
  return (
    !!error &&
    (error.name === "AuthRetryableFetchError" ||
      error.status === undefined ||
      error.status === 0 ||
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500)
  );
}
