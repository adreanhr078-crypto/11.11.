export interface SingleFlight<K, T> {
  run: (key: K, task: (generation: number) => Promise<T>) => Promise<T>;
  invalidate: () => void;
  isCurrent: (key: K, generation: number) => boolean;
}

export function createSingleFlight<K, T>(): SingleFlight<K, T> {
  let generation = 0;
  let activeKey: K | null = null;
  let activePromise: Promise<T> | null = null;

  return {
    run(key, task) {
      if (activePromise && activeKey === key) return activePromise;
      activeKey = key;
      const runGeneration = ++generation;
      const promise = task(runGeneration);
      activePromise = promise;
      const clearIfCurrent = () => {
        if (activePromise === promise && activeKey === key) {
          activePromise = null;
        }
      };
      void promise.then(clearIfCurrent, clearIfCurrent);
      return promise;
    },
    invalidate() {
      generation += 1;
      activeKey = null;
      activePromise = null;
    },
    isCurrent(key, runGeneration) {
      return activeKey === key && generation === runGeneration;
    },
  };
}
