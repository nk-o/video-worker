/**
 * Extend like jQuery.extend
 *
 * @param {Object} out - output object.
 * @param {...any} args - additional objects to extend.
 *
 * @returns {Object}
 */
export default function extend<T extends object>(
  out: T,
  ...args: Array<Partial<T> | undefined>
): T {
  const target = out || ({} as T);

  Object.keys(args).forEach((index) => {
    const source = args[Number(index)];
    if (!source) {
      return;
    }

    Object.keys(source).forEach((key) => {
      const typedKey = key as keyof T;
      const value = source[typedKey];

      if (typeof value !== 'undefined') {
        target[typedKey] = value as T[keyof T];
      }
    });
  });

  return target;
}
