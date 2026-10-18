import { calculateInventorySlots, resolvePainOverflow } from "../rules/inventory.mjs";
import { calculateNpcStats } from "../rules/npcStats.mjs";
import {
	calculateCombatActions,
	calculateMaxHealth,
	calculateMountMaxHealth,
	calculateMovements
} from "../rules/progression.mjs";

export class SacramentoRPGActor extends Actor {
	/** @override */
	prepareData() {
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {}

	/** @override */
	prepareDerivedData() {
		const systemData = this.system;

		this._prepareCharacterData(this);
		this._prepareNpcData(this);

		const slots = calculateInventorySlots(
			this.items,
			Boolean(systemData.mount?.hasWagon ?? systemData.mount?.comCarroca)
		);
		systemData.slots = slots.backpack;
		if (systemData.mount) {
			systemData.mount.slots = slots.mount;
		}
	}

	_prepareCharacterData(actorData) {
		if (actorData.type !== "character") return;

		const systemData = actorData.system;
		const abilities = systemData.abilities;
		const attributes = systemData.attributes;

		const fisVal = abilities.fis?.value || 0;
		const velVal = abilities.vel?.value || 0;
		const corVal = abilities.cor?.value || 0;
		const level = attributes.level?.value || 1;

		if (systemData.health) {
			systemData.health.max = calculateMaxHealth(level, fisVal);
		}
		if (attributes.movement) {
			attributes.movement.value = calculateMovements(velVal);
		}
		if (attributes.actions) {
			attributes.actions.value = calculateCombatActions(corVal);
		}
		if (systemData.mount) {
			const res = systemData.mount.endurance?.value ?? systemData.mount.resistencia?.value ?? 0;
			systemData.mount.health.max = calculateMountMaxHealth(res);
		}
		for (const ability of Object.values(systemData.abilities)) {
			ability.mod = ability.value;
		}
	}

	_prepareNpcData(actorData) {
		if (actorData.type !== "npc") return;

		const systemData = actorData.system;
		const ndc = systemData.attributes.cr?.value || 1;
		const isSpecial = systemData.attributes.isSpecial?.value || false;
		const stats = calculateNpcStats(ndc, isSpecial);

		if (systemData.pain) systemData.pain.max = stats.maxPain;
		if (systemData.attributes.defense) systemData.attributes.defense.value = stats.defense;
		if (systemData.health) systemData.health.max = stats.maxHealth;
		if (systemData.attributes.actions) systemData.attributes.actions.value = stats.actions;
	}

	/** @override */
	async _preUpdate(changed, options, user) {
		await super._preUpdate(changed, options, user);

		const newPain = foundry.utils.getProperty(changed, "system.pain.value");
		const actorOverflow = resolvePainOverflow(newPain, this.system.health?.value, this.system.pain?.max);
		if (actorOverflow) {
			changed["system.health.value"] = actorOverflow.healthValue;
			changed["system.pain.value"] = actorOverflow.painValue;
		}

		const newMountPain = foundry.utils.getProperty(changed, "system.mount.pain.value");
		const mountOverflow = resolvePainOverflow(
			newMountPain,
			this.system.mount?.health?.value,
			this.system.mount?.pain?.max
		);
		if (mountOverflow) {
			changed["system.mount.health.value"] = mountOverflow.healthValue;
			changed["system.mount.pain.value"] = mountOverflow.painValue;
		}
	}

	/** @override */
	getRollData() {
		const data = { ...this.system };

		this._getCharacterRollData(data);
		this._getNpcRollData(data);

		return data;
	}

	_getCharacterRollData(data) {
		if (this.type !== "character") return;

		if (data.abilities) {
			for (const [k, v] of Object.entries(data.abilities)) {
				data[k] = foundry.utils.deepClone(v);
			}
		}

		if (data.attributes.level) {
			data.lvl = data.attributes.level.value ?? 0;
		}
	}

	_getNpcRollData(data) {
		if (this.type !== "npc") return;

		if (data.attributes.cr) {
			data.ndc = data.attributes.cr.value ?? 0;
		}
	}
}
