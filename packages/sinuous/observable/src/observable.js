import { safePush } from './utils.js';

let currentUpdate;
let parentUpdate;

export default function observable(value) {
  data._listeners = [];

  function data(nextValue) {
    if (typeof nextValue === 'undefined') {
      if (currentUpdate) {
        safePush(data._listeners, currentUpdate);
        safePush(currentUpdate._observables, data);
      }
      return value;
    }

    value = nextValue;

    data._listeners.forEach((update) => (update._fresh = false));
    // Update can alter data._listeners, make a copy before running.
    data._listeners.slice().forEach((update) => {
      update._children.forEach(_unsubscribe);
      if (!update._fresh) update();
    });
    return value;
  }

  return data;
}

export function S(listener) {
  let result;
  let prevUpdate;

  // Keep track of which observables trigger updates. Needed for unsubscribe.
  update._observables = [];
  listener._update = update;
  update._listener = listener;

  function update() {
    update._fresh = true;
    _unsubscribe(update);

    prevUpdate = currentUpdate;
    currentUpdate = update;
    update._children = [];

    let parent;
    if (parentUpdate) {
      safePush(parentUpdate._children, update);
    } else {
      parent = true;
      parentUpdate = update;
    }

    result = listener();

    if (parent) {
      parent = false;
      parentUpdate = undefined;
    }

    currentUpdate = prevUpdate;
    prevUpdate = undefined;
    return result;
  }

  data._update = update;

  function data() {
    if (update._fresh) {
      update._observables.forEach(o => o());
    } else {
      result = update();
    }
    return result;
  }

  update();
  return data;
}

/**
 * Subscribe to updates of value.
 * @param  {Function} update
 * @return {Function} unsubscribe
 */
export function subscribe(listener) {
  const update = S(listener)._update;
  return () => _unsubscribe(update);
}

/**
 * Unsubscribe from a listener.
 * @param  {Function} listener
 */
export function unsubscribe(listener) {
  _unsubscribe(listener._update);
  listener._update = undefined;
}

function _unsubscribe(update) {
  update._observables.forEach((o) => {
    o._listeners.splice(o._listeners.indexOf(update), 1);
  });
  update._observables = [];
}
