/**
 * Single point of contact with the WebExtension APIs. Everything else in the
 * extension imports `browser` from here, never `chrome` or `browser` directly,
 * so swapping/patching the polyfill only ever touches this file.
 */
import browser from "webextension-polyfill";

export { browser };
export type { Runtime } from "webextension-polyfill";
