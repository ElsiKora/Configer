/**
 * Domain error used for explicit, code-based config failures.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export class ConfigError extends Error {
  public readonly CODE: string;

  public readonly SUGGESTIONS: Array<string> | undefined;

  public constructor(message: string, code: string, cause?: Error, suggestions?: Array<string>) {
    const resolvedSuggestions: Array<string> = suggestions ?? [];

    const suggestionLines: string = resolvedSuggestions
      .map((item: string) => `- ${item}`)
      .join('\n');

    const resolvedMessage: string =
      resolvedSuggestions.length > 0 ? `${message}\nSuggestions:\n${suggestionLines}` : message;

    super(resolvedMessage, { cause });
    this.CODE = code;
    this.SUGGESTIONS = resolvedSuggestions.length > 0 ? resolvedSuggestions : undefined;
    this.name = 'ConfigError';
  }
}
