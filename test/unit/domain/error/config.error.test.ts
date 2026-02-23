import { ConfigError } from '@domain/error/config.error';
import { describe, expect, it } from 'vitest';

describe('ConfigError', () => {
  it('creates error with code and message only', () => {
    const error: ConfigError = new ConfigError('Something went wrong.', 'CONFIG_GENERIC_ERROR');

    expect(error.message).toBe('Something went wrong.');
    expect(error.CODE).toBe('CONFIG_GENERIC_ERROR');
    expect(error.SUGGESTIONS).toBeUndefined();
    expect(error.name).toBe('ConfigError');
    expect(error).toBeInstanceOf(Error);
  });

  it('creates error with cause', () => {
    const cause: Error = new Error('Root cause');
    const error: ConfigError = new ConfigError('Wrapped error.', 'CONFIG_WRAPPED', cause);

    expect(error.cause).toBe(cause);
    expect(error.CODE).toBe('CONFIG_WRAPPED');
  });

  it('appends suggestions to the message', () => {
    const suggestions: Array<string> = ['Check the file path.', 'Verify file permissions.'];

    const error: ConfigError = new ConfigError(
      'File not found.',
      'CONFIG_FILE_NOT_FOUND',
      undefined,
      suggestions,
    );

    expect(error.message).toContain('Suggestions:');
    expect(error.message).toContain('- Check the file path.');
    expect(error.message).toContain('- Verify file permissions.');
    expect(error.SUGGESTIONS).toEqual(suggestions);
  });

  it('ignores empty suggestions array', () => {
    const error: ConfigError = new ConfigError(
      'No suggestions.',
      'CONFIG_NO_SUGGESTIONS',
      undefined,
      [],
    );

    expect(error.SUGGESTIONS).toBeUndefined();
    expect(error.message).toBe('No suggestions.');
  });
});
