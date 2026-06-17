/**
 * Server-side Hook System for SitusBisnis.
 * Improved Type Safety using Generics and 'unknown' over 'any'.
 */
class HookSystem {
  private actions: Map<string, Array<(..._args: any[]) => void>> = new Map();
  private filters: Map<string, Array<(_value: any, ..._args: any[]) => any>> = new Map();

  /**
   * Register a new action hook.
   */
  addAction<Args extends unknown[]>(name: string, callback: (..._args: Args) => void) {
    if (!this.actions.has(name)) {
      this.actions.set(name, []);
    }
    // We store as any[] internally but keep external API type-safe via generics
    this.actions.get(name)!.push(callback as (..._args: any[]) => void);
  }

  /**
   * Execute all callbacks registered for an action hook.
   */
  doAction<Args extends unknown[]>(name: string, ...args: Args) {
    const callbacks = this.actions.get(name);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[HookSystem] Error in action "${name}":`, error);
      }
    });
  }

  /**
   * Register a new filter hook.
   */
  addFilter<T, Args extends unknown[] = []>(
    name: string,
    callback: (_value: T, ..._args: Args) => T
  ) {
    if (!this.filters.has(name)) {
      this.filters.set(name, []);
    }
    this.filters.get(name)!.push(callback as (_value: any, ..._args: any[]) => any);
  }

  /**
   * Apply filters to a value.
   */
  applyFilters<T, Args extends unknown[] = []>(
    name: string,
    value: T,
    ...args: Args
  ): T {
    const callbacks = this.filters.get(name);
    if (!callbacks) return value;

    return callbacks.reduce((acc, callback) => {
      try {
        return callback(acc, ...args);
      } catch (error) {
        console.error(`[HookSystem] Error in filter "${name}":`, error);
        return acc;
      }
    }, value);
  }
}

export const hooks = new HookSystem();

