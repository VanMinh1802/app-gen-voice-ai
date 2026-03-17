/** 
 * Polyfill for Node's async_hooks for Cloudflare Pages.
 * Next-on-pages bundles expect this module; provide a minimal stub.
 */
export class AsyncResource {
  constructor() {}
  runInAsyncScope(fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
    return fn(...args);
  }
  asyncId(): number {
    return 0;
  }
  triggerAsyncId(): number {
    return 0;
  }
}

export function createHook(_hooks: {
  init?: Function;
  before?: Function;
  after?: Function;
  destroy?: Function;
} = {}) {
  return {
    enable: () => {},
    disable: () => {},
  };
}

export function executionAsyncId() {
  return 0;
}

export function triggerAsyncId() {
  return 0;
}

export function executionAsyncResource(): AsyncResource | null {
  return null;
}
