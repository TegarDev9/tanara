export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Function which joins passed values with space following these rules:
 * 1. If value is non-empty string, it will be added to output.
 * 2. If value is object, only those keys will be added, which values are truthy.
 * 3. If value is array, classNames will be called with this value spread.
 * 4. All other values are ignored.
 *
 * You can find this function to similar one from the package {@link https://www.npmjs.com/package/classnames|classnames}.
 * @param values - values array.
 * @returns Final class name.
 */
export type ClassName = string | number | boolean | null | undefined;
export type ClassNameRecord = Record<string, ClassName>;
export type ClassNameItem = ClassName | ClassNameRecord | ClassNameItem[];

export function classNames(...values: ClassNameItem[]): string {
  return values
    .map((value) => {
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
      }

      if (isRecord(value)) {
        // Ensure the mapped array is of type ClassNameItem[]
        const objectClassNames = Object.entries(value).map(([key, val]) => (val ? key : null));
        return classNames(...objectClassNames.filter(Boolean) as string[]);
      }

      if (Array.isArray(value)) {
        return classNames(...value);
      }
      return ''; // Explicitly return empty string for other types or filter them out earlier
    })
    .filter(Boolean) // This will also filter out the empty strings from unhandled types
    .join(' ');
}

// Helper type to extract keys that are strings from a union of objects
type UnionStringKeys<U> = U extends unknown
  ? { [K in keyof U]-?: U[K] extends string | undefined ? K : never }[keyof U]
  : never;

// Helper type to get required string keys from a union of objects
type UnionRequiredKeys<U> = U extends unknown
  ? {
      [K in UnionStringKeys<U>]: object extends Pick<U, K> ? never : K;
    }[UnionStringKeys<U>]
  : never;

// Helper type to get optional string keys from a union of objects
type UnionOptionalKeys<U> = Exclude<UnionStringKeys<U>, UnionRequiredKeys<U>>;

// Adjusted MergeClassNames to work with a wider range of possible inputs for partials
export type MergeClassNames<Tuple extends ClassNameRecord[]> =
  // Removes all types from union that will be ignored by the mergeClassNames function.
  Exclude<
    Tuple[number],
    // Exclude types not representing class name structures
    number | string | null | undefined | unknown[] | boolean
  > extends infer Union
    // Ensure Union is treated as a record type for key mapping
    ? Union extends Record<string, unknown>
      ? { [K in UnionRequiredKeys<Union>]: string } &
        { [K in UnionOptionalKeys<Union>]?: string }
      : never
    : never;

/**
 * Merges two sets of classnames.
 *
 * The function expects to pass an array of objects with values that could be passed to
 * the `classNames` function.
 * @returns An object with keys from all objects with merged values.
 * @see classNames
 */
export function mergeClassNames<T extends ClassNameRecord[]>(
  ...partials: T
): MergeClassNames<T> {
  return partials.reduce<MergeClassNames<T>>((acc, partial) => {
    if (isRecord(partial)) {
      Object.entries(partial).forEach(([key, value]) => {
        const currentAccValue = (acc as ClassNameRecord)[key];
        // Ensure value is treated as ClassNameItem for the classNames function
        const className = classNames(currentAccValue, value as ClassNameItem);
        if (className) {
          (acc as Record<string, string>)[key] = className;
        }
      });
    }
    return acc;
  }, {} as MergeClassNames<T>);
}