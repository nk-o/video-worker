// Deferred
// thanks http://stackoverflow.com/questions/18096715/implement-deferred-object-without-using-jquery
export default class Deferred<TArgs extends unknown[] = unknown[]> {
  doneCallbacks: Array<(...args: TArgs) => void> = [];

  failCallbacks: Array<(...args: TArgs) => void> = [];

  execute(list: Array<(...args: TArgs) => void>, args: TArgs): void {
    let index = list.length;

    while (index) {
      index -= 1;
      list[index](...args);
    }
  }

  resolve(...args: TArgs): void {
    this.execute(this.doneCallbacks, args);
  }

  reject(...args: TArgs): void {
    this.execute(this.failCallbacks, args);
  }

  done(callback: (...args: TArgs) => void): void {
    this.doneCallbacks.push(callback);
  }

  fail(callback: (...args: TArgs) => void): void {
    this.failCallbacks.push(callback);
  }
}
