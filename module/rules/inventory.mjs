import { format, localize } from "../helpers/i18n.mjs";

export const MAX_BACKPACK_SLOTS = 10;
export const MAX_MOUNT_SLOTS = 15;
export const MAX_WAGON_SLOTS = 30;
export const MAX_BODY_WEAPONS = 4;
export const HOLSTER_AMMO_CAPACITY = 36;
export const BANDOLIER_AMMO_CAPACITY = 24;

const PHYSICAL_ITEM_TYPES = new Set(["weapon", "equipment", "consumable"]);

export function calculateInventorySlots(items = [], hasWagon = false) {
	let backpackSlots = 0;
	let mountSlots = 0;

	for (const item of items) {
		if (!PHYSICAL_ITEM_TYPES.has(item.type)) continue;

		const isEquipped = Boolean(item.system?.attributes?.isEquipped?.value);
		const isMountItem = Boolean(item.system?.attributes?.isMountItem?.value);
		const itemSlots = Number(item.system?.attributes?.slots?.value) || 0;

		if (isMountItem) {
			mountSlots += itemSlots;
		} else if (!isEquipped) {
			backpackSlots += itemSlots;
		}
	}

	return {
		backpack: {
			value: backpackSlots,
			max: MAX_BACKPACK_SLOTS
		},
		mount: {
			value: mountSlots,
			max: hasWagon ? MAX_WAGON_SLOTS : MAX_MOUNT_SLOTS
		}
	};
}

export function validateEquipmentAndAmmoLimits(items = [], backpackSlots = null, mountSlots = null) {
	const warnings = [];

	if (backpackSlots && backpackSlots.value > backpackSlots.max) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.OverloadedBackpack", {
				current: backpackSlots.value,
				max: backpackSlots.max
			})
		);
	}
	if (mountSlots && mountSlots.value > mountSlots.max) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.OverloadedMount", {
				current: mountSlots.value,
				max: mountSlots.max
			})
		);
	}

	let numColdres = 0;
	let numBandoleiras = 0;
	let numBainhas = 0;

	let equipWeaponsRevolver = 0;
	let equipWeaponsFuzil = 0;
	let equipWeaponsMelee = 0;
	let equipWeaponsTotal = 0;

	let equipAmmoRevolver = 0;
	let equipAmmoFuzil = 0;

	for (const item of items) {
		const attrs = item.system?.attributes;
		if (!attrs?.isEquipped?.value) continue;

		if (item.type === "equipment") {
			const eqType = attrs.equipType?.value;
			if (eqType === "coldre") numColdres++;
			else if (eqType === "bandoleira") numBandoleiras++;
			else if (eqType === "bainha") numBainhas++;
		} else if (item.type === "weapon") {
			const wType = attrs.weaponType?.value;
			if (wType !== "smallBlade") equipWeaponsTotal++;

			if (wType === "revolver") equipWeaponsRevolver++;
			else if (wType === "rifle" || wType === "shotgun" || wType === "fuzil" || wType === "espingarda")
				equipWeaponsFuzil++;
			else if (wType === "melee") equipWeaponsMelee++;
		} else if (item.type === "consumable") {
			const ammoCategory = (attrs.ammoCategory?.value || "").toLowerCase();
			const itemName = (item.name || "").toLowerCase();
			const qty = Number(attrs.quantity?.value) || 0;
			if (ammoCategory === "revolver") {
				equipAmmoRevolver += qty;
			} else if (ammoCategory === "rifle" || ammoCategory === "shotgun") {
				equipAmmoFuzil += qty;
			} else if (!ammoCategory || ammoCategory === "none") {
				if (itemName.includes("revólver") || itemName.includes("revolver")) {
					equipAmmoRevolver += qty;
				} else if (
					itemName.includes("fuzil")
					|| itemName.includes("espingarda")
					|| itemName.includes("rifle")
					|| itemName.includes("shotgun")
				) {
					equipAmmoFuzil += qty;
				}
			}
		}
	}

	if (equipWeaponsTotal > MAX_BODY_WEAPONS) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.ExcessBodyWeapons", {
				current: equipWeaponsTotal,
				max: MAX_BODY_WEAPONS
			})
		);
	}
	if (equipWeaponsRevolver > numColdres) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.MissingHolsters", {
				weapons: equipWeaponsRevolver,
				containers: numColdres
			})
		);
	}
	if (equipWeaponsFuzil > numBandoleiras) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.MissingBandoliers", {
				weapons: equipWeaponsFuzil,
				containers: numBandoleiras
			})
		);
	}
	if (equipWeaponsMelee > numBainhas) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.MissingSheaths", {
				weapons: equipWeaponsMelee,
				containers: numBainhas
			})
		);
	}

	const maxAmmoRevolver = numColdres * HOLSTER_AMMO_CAPACITY;
	if (equipAmmoRevolver > maxAmmoRevolver) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.ExcessRevolverAmmo", {
				current: equipAmmoRevolver,
				max: maxAmmoRevolver
			})
		);
	}
	const maxAmmoFuzil = numBandoleiras * BANDOLIER_AMMO_CAPACITY;
	if (equipAmmoFuzil > maxAmmoFuzil) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.ExcessRifleAmmo", {
				current: equipAmmoFuzil,
				max: maxAmmoFuzil
			})
		);
	}

	return warnings;
}

// Returns the health/pain update to apply when the pain countdown is exhausted, or null when nothing changes.
export function resolvePainOverflow(newPain, currentHealth, maxPain = 6) {
	if (newPain === undefined || newPain > 0) return null;

	return {
		healthValue: currentHealth > 0 ? currentHealth - 1 : 0,
		painValue: maxPain || 6
	};
}

export function calculateWeaponReload(weapon, inventoryItems = []) {
	const ammoMax = weapon.system?.attributes?.ammo?.max || 0;
	const ammoCurrent = weapon.system?.attributes?.ammo?.value || 0;
	const ammoType = weapon.system?.attributes?.ammoType?.value?.toLowerCase() || "";

	if (ammoMax === 0) return { error: "no_ammo_capacity", message: localize("SACRAMENTO_RPG.Reload.NoAmmoCapacity") };
	if (ammoCurrent >= ammoMax)
		return { error: "already_full", message: localize("SACRAMENTO_RPG.Reload.AlreadyFull") };
	if (!ammoType) return { error: "missing_ammo_type", message: localize("SACRAMENTO_RPG.Reload.MissingAmmoType") };

	const missingAmmo = ammoMax - ammoCurrent;
	const matchingAmmos = inventoryItems
		.filter((i) => {
			if (i.type !== "consumable") return false;
			const category = (i.system?.attributes?.ammoCategory?.value || "").toLowerCase();
			if (category && category !== "none" && category === ammoType) return true;
			return (i.name || "").toLowerCase().includes(ammoType);
		})
		.sort((a, b) => {
			const eqA = a.system?.attributes?.isEquipped?.value ? 1 : 0;
			const eqB = b.system?.attributes?.isEquipped?.value ? 1 : 0;
			return eqB - eqA;
		});

	if (matchingAmmos.length === 0) {
		return {
			error: "no_matching_ammo",
			message: format("SACRAMENTO_RPG.Reload.NoMatchingAmmo", { ammoType })
		};
	}

	let ammoToReload = 0;
	const itemUpdates = [];

	for (const ammoItem of matchingAmmos) {
		if (ammoToReload >= missingAmmo) break;

		const qty = ammoItem.system?.attributes?.quantity?.value || 0;
		if (qty <= 0) continue;

		const needed = missingAmmo - ammoToReload;
		const taken = Math.min(qty, needed);

		ammoToReload += taken;
		itemUpdates.push({
			_id: ammoItem.id || ammoItem._id,
			"system.attributes.quantity.value": qty - taken
		});
	}

	if (ammoToReload === 0) {
		return {
			error: "depleted_ammo",
			message: format("SACRAMENTO_RPG.Reload.DepletedAmmo", { ammoType })
		};
	}

	return {
		error: null,
		ammoToReload,
		newAmmoValue: ammoCurrent + ammoToReload,
		itemUpdates
	};
}
