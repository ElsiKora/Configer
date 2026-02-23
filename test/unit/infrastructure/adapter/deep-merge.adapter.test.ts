import { DeepMergeAdapter } from '@infrastructure/adapter/deep-merge.adapter';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const VALUE_ONE: number = Number.parseInt('1', DECIMAL_RADIX);
const VALUE_TWO: number = Number.parseInt('2', DECIMAL_RADIX);
const VALUE_THREE: number = Number.parseInt('3', DECIMAL_RADIX);

describe('DeepMergeAdapter', () => {
  it('returns clone of base when override is undefined', () => {
    const deepMergeAdapter: DeepMergeAdapter = new DeepMergeAdapter();
    const baseValue: Record<string, unknown> = { value: VALUE_ONE };
    const overrideValue: unknown = undefined as unknown;
    const mergedValue: unknown = deepMergeAdapter.merge(baseValue, overrideValue);

    expect(mergedValue).toEqual(baseValue);
    expect(mergedValue).not.toBe(baseValue);
  });

  it('returns clone of override when base is undefined', () => {
    const deepMergeAdapter: DeepMergeAdapter = new DeepMergeAdapter();
    const baseValue: unknown = undefined as unknown;
    const overrideValue: Record<string, unknown> = { value: VALUE_TWO };
    const mergedValue: unknown = deepMergeAdapter.merge(baseValue, overrideValue);

    expect(mergedValue).toEqual(overrideValue);
    expect(mergedValue).not.toBe(overrideValue);
  });

  it('deep merges nested plain objects', () => {
    const deepMergeAdapter: DeepMergeAdapter = new DeepMergeAdapter();

    const baseValue: Record<string, unknown> = {
      nested: { first: VALUE_ONE },
      title: 'base',
    };

    const overrideValue: Record<string, unknown> = {
      nested: { second: VALUE_TWO },
    };

    const mergedValue: unknown = deepMergeAdapter.merge(baseValue, overrideValue);

    expect(mergedValue).toEqual({
      nested: { first: VALUE_ONE, second: VALUE_TWO },
      title: 'base',
    });
  });

  it('replaces arrays by default', () => {
    const deepMergeAdapter: DeepMergeAdapter = new DeepMergeAdapter();
    const baseValue: Record<string, unknown> = { items: [VALUE_ONE, VALUE_TWO] };
    const overrideValue: Record<string, unknown> = { items: [VALUE_THREE] };
    const mergedValue: unknown = deepMergeAdapter.merge(baseValue, overrideValue);

    expect(mergedValue).toEqual({ items: [VALUE_THREE] });
  });

  it('concatenates arrays when flag is set', () => {
    const deepMergeAdapter: DeepMergeAdapter = new DeepMergeAdapter();
    const baseValue: Record<string, unknown> = { items: [VALUE_ONE, VALUE_TWO] };
    const overrideValue: Record<string, unknown> = { items: [VALUE_THREE] };
    const shouldConcatenateArrays: boolean = true;

    const mergedValue: unknown = deepMergeAdapter.merge(
      baseValue,
      overrideValue,
      shouldConcatenateArrays,
    );

    expect(mergedValue).toEqual({ items: [VALUE_ONE, VALUE_TWO, VALUE_THREE] });
  });

  it('overrides scalar values', () => {
    const deepMergeAdapter: DeepMergeAdapter = new DeepMergeAdapter();
    const mergedValue: unknown = deepMergeAdapter.merge('old', 'new');

    expect(mergedValue).toBe('new');
  });

  it('handles deeply nested structures without shared references', () => {
    const deepMergeAdapter: DeepMergeAdapter = new DeepMergeAdapter();

    const baseValue: Record<string, unknown> = {
      a: { b: { c: VALUE_ONE } },
    };

    const overrideValue: Record<string, unknown> = {
      a: { b: { d: VALUE_TWO } },
    };

    const mergedValue: unknown = deepMergeAdapter.merge(baseValue, overrideValue);

    expect(mergedValue).toEqual({
      a: { b: { c: VALUE_ONE, d: VALUE_TWO } },
    });

    const mergedRecord: Record<string, unknown> = mergedValue as Record<string, unknown>;
    const baseRecord: Record<string, unknown> = baseValue.a as Record<string, unknown>;

    expect(mergedRecord.a).not.toBe(baseRecord);
  });
});
