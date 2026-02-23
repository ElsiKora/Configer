/**
 * Parsed configuration payload and metadata.
 * @see https://elsikora.dev/configer/docs/api-reference
 */
export interface IConfigResult<TEntity> {
  config: TEntity | undefined;
  filepath: string;
  isEmpty?: true;
  sources?: Array<string>;
}
