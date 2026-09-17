// Minimal chrome global so webextension-polyfill's environment check passes
// under jsdom. Individual tests that need real storage/runtime behavior
// mock "webextension-polyfill" directly (see webextensionStorage.test.ts).
if (typeof (globalThis as unknown as { chrome?: unknown }).chrome === "undefined") {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      id: "test-extension-id",
      getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
      onMessage: { addListener() {}, removeListener() {} },
      onInstalled: { addListener() {} },
      sendMessage: () => Promise.resolve()
    },
    storage: {
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve()
      },
      onChanged: { addListener() {}, removeListener() {} }
    },
    tabs: { create: () => Promise.resolve() }
  };
}
