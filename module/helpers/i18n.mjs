export function localize(key) {
	if (globalThis.game?.i18n?.localize) {
		return globalThis.game.i18n.localize(key);
	}
	return key;
}

export function format(key, data = {}) {
	if (globalThis.game?.i18n?.format) {
		return globalThis.game.i18n.format(key, data);
	}
	return key.replace(/\{(\w+)\}/g, (_, k) => data[k] ?? "");
}
