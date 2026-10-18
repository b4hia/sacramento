export const TARGET_MIGRATION_VERSION = "0.0.2";

// Migrates legacy Portuguese Actor schema keys (moviment, sexo, caracteristicas, bolsaDeCarga, etc.) to English.
export function migrateActorData(actorData = {}) {
	const updateData = {};
	const sys = actorData.system || {};

	if (sys.attributes?.moviment !== undefined) {
		if (sys.attributes?.movement?.value === undefined) {
			updateData["system.attributes.movement.value"] = sys.attributes.moviment.value ?? 0;
		}
		updateData["system.attributes.-=moviment"] = null;
	}

	const mount = sys.mount;
	if (mount) {
		if (mount.sexo !== undefined) {
			if (!mount.sex) updateData["system.mount.sex"] = mount.sexo;
			updateData["system.mount.-=sexo"] = null;
		}
		if (mount.caracteristicas !== undefined) {
			if (!mount.traits) updateData["system.mount.traits"] = mount.caracteristicas;
			updateData["system.mount.-=caracteristicas"] = null;
		}
		if (mount.bolsaDeCarga !== undefined) {
			if (mount.hasSaddlebag === undefined) updateData["system.mount.hasSaddlebag"] = Boolean(mount.bolsaDeCarga);
			updateData["system.mount.-=bolsaDeCarga"] = null;
		}
		if (mount.comCarroca !== undefined) {
			if (mount.hasWagon === undefined) updateData["system.mount.hasWagon"] = Boolean(mount.comCarroca);
			updateData["system.mount.-=comCarroca"] = null;
		}
		if (mount.potencia !== undefined) {
			if (mount.potency?.value === undefined) {
				updateData["system.mount.potency.value"] = mount.potencia.value ?? 0;
			}
			updateData["system.mount.-=potencia"] = null;
		}
		if (mount.resistencia !== undefined) {
			if (mount.endurance?.value === undefined) {
				updateData["system.mount.endurance.value"] = mount.resistencia.value ?? 0;
			}
			updateData["system.mount.-=resistencia"] = null;
		}
		if (mount.fidelidade !== undefined) {
			if (mount.loyalty?.value === undefined) {
				updateData["system.mount.loyalty.value"] = mount.fidelidade.value ?? 0;
				updateData["system.mount.loyalty.max"] = mount.fidelidade.max ?? 5;
			}
			updateData["system.mount.-=fidelidade"] = null;
		}
		if (mount.interacoes !== undefined) {
			const inter = mount.interacoes;
			updateData["system.mount.interactions.fed"] = Boolean(inter.alimentou);
			updateData["system.mount.interactions.talked"] = Boolean(inter.conversou);
			updateData["system.mount.interactions.played"] = Boolean(inter.brincou);
			updateData["system.mount.interactions.brushed"] = Boolean(inter.escovou);
			updateData["system.mount.-=interacoes"] = null;
		}
	}

	return updateData;
}

export async function migrateWorld() {
	if (!game.user?.isGM) return;

	const currentVersion = game.settings.get("sacramento-rpg", "systemMigrationVersion");
	if (currentVersion === game.system.version) return;

	for (const actor of game.actors.contents) {
		const updateData = migrateActorData(actor.toObject());
		if (Object.keys(updateData).length > 0) {
			await actor.update(updateData, { enforceTypes: false });
		}
	}

	await game.settings.set("sacramento-rpg", "systemMigrationVersion", game.system.version);
}
