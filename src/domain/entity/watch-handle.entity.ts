/**
 * Handle for stopping active config watching.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IWatchHandle {
  close: () => void;
}
