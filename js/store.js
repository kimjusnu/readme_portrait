// Tiny immutable store: every change produces a new state object.
export function createStore(initial) {
  let state = initial;
  const subscribers = new Set();
  const set = (patch) => {
    state = { ...state, ...patch };
    subscribers.forEach((fn) => fn(state));
  };
  return {
    get: () => state,
    set,
    setOpts: (patch) => set({ opts: { ...state.opts, ...patch } }),
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
