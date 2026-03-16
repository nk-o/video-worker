export default class Deferred<TArgs extends unknown[] = unknown[]> {
    doneCallbacks: Array<(...args: TArgs) => void>;
    failCallbacks: Array<(...args: TArgs) => void>;
    execute(list: Array<(...args: TArgs) => void>, args: TArgs): void;
    resolve(...args: TArgs): void;
    reject(...args: TArgs): void;
    done(callback: (...args: TArgs) => void): void;
    fail(callback: (...args: TArgs) => void): void;
}
//# sourceMappingURL=deferred.d.ts.map