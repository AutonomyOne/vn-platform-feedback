/**
 * Shared singleton config store.
 * All integrations write here on init; all modules read from here.
 */

let _config = null;

export function setConfig(config) {
  _config = config;
}

export function getStoredConfig() {
  return _config;
}
