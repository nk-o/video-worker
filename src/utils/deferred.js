// Deferred
// thanks http://stackoverflow.com/questions/18096715/implement-deferred-object-without-using-jquery
function Deferred() {
  this.doneCallbacks = [];
  this.failCallbacks = [];
}

Deferred.prototype = {
  execute(list, args) {
    let i = list.length;
    // eslint-disable-next-line no-param-reassign
    args = Array.prototype.slice.call(args);

    while (i) {
      i -= 1;
      list[i].apply(null, args);
    }
  },
  resolve(...args) {
    this.execute(this.doneCallbacks, args);
  },
  reject(...args) {
    this.execute(this.failCallbacks, args);
  },
  done(callback) {
    this.doneCallbacks.push(callback);
  },
  fail(callback) {
    this.failCallbacks.push(callback);
  },
};

export default Deferred;
