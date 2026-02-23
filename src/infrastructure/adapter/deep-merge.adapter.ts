export class DeepMergeAdapter {
  public readonly merge = (
    baseValue: unknown,
    overrideValue: unknown,
    shouldConcatenateArrays: boolean = false,
  ): unknown => {
    if (overrideValue === undefined) {
      return this.cloneValue(baseValue);
    }

    if (baseValue === undefined) {
      return this.cloneValue(overrideValue);
    }

    if (Array.isArray(baseValue) && Array.isArray(overrideValue)) {
      if (shouldConcatenateArrays) {
        const baseArray: Array<unknown> = baseValue.map((entry: unknown) => this.cloneValue(entry));

        const overrideArray: Array<unknown> = overrideValue.map((entry: unknown) =>
          this.cloneValue(entry),
        );

        return [...baseArray, ...overrideArray];
      }

      return this.cloneValue(overrideValue);
    }

    if (this.isPlainObject(baseValue) && this.isPlainObject(overrideValue)) {
      const outputRecord: Record<string, unknown> = {};

      const keys: Set<string> = new Set<string>([
        ...Object.keys(baseValue),
        ...Object.keys(overrideValue),
      ]);

      for (const key of keys) {
        const nextBaseValue: unknown = baseValue[key];
        const nextOverrideValue: unknown = overrideValue[key];

        outputRecord[key] = this.merge(nextBaseValue, nextOverrideValue, shouldConcatenateArrays);
      }

      return outputRecord;
    }

    return this.cloneValue(overrideValue);
  };

  private readonly cloneValue = (inputValue: unknown): unknown => {
    if (Array.isArray(inputValue)) {
      return inputValue.map((item: unknown) => this.cloneValue(item));
    }

    if (this.isPlainObject(inputValue)) {
      const outputRecord: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(inputValue)) {
        outputRecord[key] = this.cloneValue(value);
      }

      return outputRecord;
    }

    return inputValue;
  };

  private readonly isPlainObject = (inputValue: unknown): inputValue is Record<string, unknown> => {
    return (
      inputValue !== null &&
      typeof inputValue === 'object' &&
      !Array.isArray(inputValue) &&
      Object.getPrototypeOf(inputValue) === Object.prototype
    );
  };
}
