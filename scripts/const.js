export const MODULE_ID = "musslop-foundry";
export const SOCKET = `module.${MODULE_ID}`;
export const ROOT_DIR = "musslop";            // Data/musslop/<slug>/
export const FLAG_SCOPE = "musslop";

export const log = {
  info: (...a) => console.log(`musslop |`, ...a),
  warn: (...a) => console.warn(`musslop |`, ...a),
  error: (...a) => console.error(`musslop |`, ...a),
};

export const i18n = (key, data) => data ? game.i18n.format(key, data) : game.i18n.localize(key);
