/**
 * Polyfill for Node's async_hooks for Cloudflare Pages.
 * Next-on-pages bundles expect this module; provide a minimal stub.
 */

class AsyncResource {
  constructor() {}
  runInAsyncScope(fn, ...args) {
    return fn(...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
}

function createHook(hooks = {}) {
  return {
    enable: () => {},
    disable: () => {},
  };
}

function executionAsyncId() {
  return 0;
}

function triggerAsyncId() {
  return 0;
}

function executionAsyncResource() {
  return null;
}

module.exports = {
  AsyncResource,
  createHook,
  executionAsyncId,
  triggerAsyncId,
  executionAsyncResource,
};
