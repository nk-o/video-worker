/**
 * Extend like jQuery.extend
 *
 * @param {Object} out - output object.
 * @param {...any} args - additional objects to extend.
 *
 * @returns {Object}
 */
export default function extend<T extends object>(out: T, ...args: Array<Partial<T> | undefined>): T;
//# sourceMappingURL=extend.d.ts.map