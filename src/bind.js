"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise) {

function returnThis() { return this.value; }
function throwThis() { throw this.reason; }
function awaitBindingThenResolve(value) {
    return this._then(returnThis, null, null, {value: value}, undefined);
}
function awaitBindingThenReject(reason) {
    return this._then(throwThis, throwThis, null, {reason: reason}, undefined);
}
function setBinding(binding) { this._setBoundTo(binding); }
Promise.prototype.bind = function (thisArg) {
    var maybePromise = tryConvertToPromise(thisArg);
    if (maybePromise instanceof Promise) {
        if (maybePromise.isFulfilled()) {
            thisArg = maybePromise.value();
        } else if (maybePromise.isRejected()) {
            return Promise.reject(maybePromise.reason());
        } else if (maybePromise.isCancelled()) {
            return maybePromise.then();
        } else {
            var ret = this.then();
            ret._attachCancellationCallback(maybePromise);
            ret = ret._then(awaitBindingThenResolve,
                            awaitBindingThenReject,
                            null, maybePromise, undefined);
            maybePromise._then(setBinding, ret._reject, null, ret, null);
            return ret;
        }
    }
    var ret = this.then();
    ret._setBoundTo(thisArg);
    return ret;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};

Promise.prototype._setIsBound = function () {
    this._bitField = this._bitField | IS_BOUND;
};

Promise.prototype._unsetIsBound = function () {
    this._bitField = this._bitField & (~IS_BOUND);
};

Promise.prototype._isBound = function () {
    return (this._bitField & IS_BOUND) === IS_BOUND;
};

Promise.prototype._setIsMigratingBinding = function () {
    this._bitField = this._bitField | IS_MIGRATING_BINDING;
};

Promise.prototype._unsetIsMigratingBinding = function () {
    this._bitField = this._bitField & (~IS_MIGRATING_BINDING);
};

Promise.prototype._isMigratingBinding = function () {
    return (this._bitField & IS_MIGRATING_BINDING) === IS_MIGRATING_BINDING;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj === undefined) {
        if (this._isBound()) {
            this._boundTo = undefined;
        }
        this._unsetIsBound();
    } else {
        this._setIsBound();
        this._boundTo = obj;
    }
};
};
