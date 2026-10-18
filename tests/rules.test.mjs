import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const ptBr = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "lang/pt_br.json"), "utf8"));

function resolveKey(obj, dotPath) {
	return dotPath.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), obj);
}

globalThis.game = {
	i18n: {
		localize(key) {
			return resolveKey(ptBr, key) ?? key;
		},
		format(key, data = {}) {
			const template = resolveKey(ptBr, key) ?? key;
			return String(template).replace(/\{(\w+)\}/g, (_, k) => data[k] ?? "");
		}
	}
};

import {
	getXpThreshold,
	calculateMaxHealth,
	calculateMovements,
	calculateCombatActions,
	calculateMountMaxHealth,
	validateCharacterProgression,
	validateMountProgression
} from "../module/rules/progression.mjs";

import { calculateNpcStats } from "../module/rules/npcStats.mjs";

import { resolveDeathSaveRoll } from "../module/rules/deathSave.mjs";

import {
	MAX_BACKPACK_SLOTS,
	MAX_MOUNT_SLOTS,
	MAX_WAGON_SLOTS,
	HOLSTER_AMMO_CAPACITY,
	BANDOLIER_AMMO_CAPACITY,
	calculateInventorySlots,
	validateEquipmentAndAmmoLimits,
	resolvePainOverflow,
	calculateWeaponReload
} from "../module/rules/inventory.mjs";

import {
	SUIT_DECIMALS,
	getCardNumericValue,
	getCardSuit,
	calculateCardInitiative
} from "../module/rules/initiative.mjs";

import {
	DEFAULT_TARGET_NUMBER,
	EXPLOSIVE_TARGET_NUMBER,
	getWeaponTargetNumber,
	evaluateCheckOutcome,
	resolveAttackCriticals,
	formatFixedDamageHtml
} from "../module/rules/criticals.mjs";

describe("Sacramento RPG — Character & Mount Progression Rules", () => {
	it("calculates XP thresholds per level", () => {
		assert.equal(getXpThreshold(1), 10);
		assert.equal(getXpThreshold(3), 30);
		assert.equal(getXpThreshold(6), 100);
		assert.equal(getXpThreshold(99), 100);
	});

	it("calculates max health across levels 1 to 6", () => {
		assert.equal(calculateMaxHealth(1, 0), 6);
		assert.equal(calculateMaxHealth(2, 0), 7);
		assert.equal(calculateMaxHealth(4, 0), 8);
		assert.equal(calculateMaxHealth(5, 0), 9);
		assert.equal(calculateMaxHealth(6, 0), 12);

		assert.equal(calculateMaxHealth(1, 2), 8);
		assert.equal(calculateMaxHealth(2, 2), 10);
		assert.equal(calculateMaxHealth(4, 2), 12);
		assert.equal(calculateMaxHealth(5, 2), 14);
		assert.equal(calculateMaxHealth(6, 2), 17);
	});

	it("applies the project rule override for Movements and Combat Actions: Math.max(1, attr)", () => {
		assert.equal(calculateMovements(0), 1);
		assert.equal(calculateMovements(1), 1);
		assert.equal(calculateMovements(3), 3);

		assert.equal(calculateCombatActions(0), 1);
		assert.equal(calculateCombatActions(1), 1);
		assert.equal(calculateCombatActions(4), 4);
	});

	it("calculates mount max health as 6 + resistencia", () => {
		assert.equal(calculateMountMaxHealth(0), 6);
		assert.equal(calculateMountMaxHealth(3), 9);
	});

	it("validates Level 1 character progression (4 attributes, 2 abilities, 4 + Intelecto antecedents)", () => {
		const validLevel1 = {
			attributes: { level: { value: 1 } },
			abilities: {
				fis: { value: 1 },
				vel: { value: 1 },
				int: { value: 1 },
				cor: { value: 1 }
			},
			antecedents: {
				atencao: { value: 2 },
				montaria: { value: 2 },
				violencia: { value: 1 }
			}
		};
		assert.deepEqual(validateCharacterProgression(validLevel1, 2), []);

		const missingPoints = {
			attributes: { level: { value: 1 } },
			abilities: {
				fis: { value: 1 },
				vel: { value: 0 },
				int: { value: 1 },
				cor: { value: 0 }
			},
			antecedents: {
				atencao: { value: 1 }
			}
		};
		const warnings = validateCharacterProgression(missingPoints, 1);
		assert.equal(warnings.length, 3);
	});

	it("validates mount progression (3 base points, +1 at Loyalty 2, +1 at Loyalty 5)", () => {
		assert.deepEqual(
			validateMountProgression({
				loyalty: { value: 1 },
				potency: { value: 2 },
				endurance: { value: 1 }
			}),
			[]
		);

		const warningsAtFid2 = validateMountProgression({
			loyalty: { value: 2 },
			potency: { value: 2 },
			endurance: { value: 1 }
		});
		assert.equal(warningsAtFid2.length, 1);
	});
});

describe("Sacramento RPG — NPC Scaling Rules", () => {
	it("scales Common vs Special NPC stats by NdC (CR)", () => {
		const commonCr2 = calculateNpcStats(2, false);
		assert.equal(commonCr2.maxHealth, 6);
		assert.equal(commonCr2.maxPain, 6);
		assert.equal(commonCr2.defense, 5);
		assert.equal(commonCr2.actions, 3);

		const specialCr3 = calculateNpcStats(3, true);
		assert.equal(specialCr3.maxHealth, 18);
		assert.equal(specialCr3.maxPain, 6);
		assert.equal(specialCr3.defense, 5);
		assert.equal(specialCr3.actions, 6);
	});
});

describe("Sacramento RPG — Death Save Rules (Best-of-3 Even/Odd)", () => {
	it("marks a success on even d6 rolls (2, 4, 6) and failure on odd rolls (1, 3, 5)", () => {
		const resEven = resolveDeathSaveRoll(4, {}, 0);
		assert.equal(resEven.isSuccess, true);
		assert.equal(resEven.outcome, "pending");
		assert.equal(resEven.updateData["system.death.success1"], true);

		const resOdd = resolveDeathSaveRoll(3, {}, 0);
		assert.equal(resOdd.isSuccess, false);
		assert.equal(resOdd.outcome, "pending");
		assert.equal(resOdd.updateData["system.death.failure1"], true);
	});

	it("stabilizes with 3 restored Life Circles and resets checkboxes on the 3rd success", () => {
		const currentDeath = {
			success1: true,
			success2: true,
			success3: false,
			failure1: true,
			failure2: false,
			failure3: false
		};
		const result = resolveDeathSaveRoll(6, currentDeath, 0);
		assert.equal(result.isSuccess, true);
		assert.equal(result.outcome, "survived");
		assert.equal(result.updateData["system.health.value"], 3);
		assert.equal(result.updateData["system.death.success1"], false);
		assert.equal(result.updateData["system.death.success2"], false);
		assert.equal(result.updateData["system.death.success3"], false);
		assert.equal(result.updateData["system.death.failure1"], false);
	});

	it("triggers character death on the 3rd failure", () => {
		const currentDeath = {
			success1: true,
			success2: false,
			success3: false,
			failure1: true,
			failure2: true,
			failure3: false
		};
		const result = resolveDeathSaveRoll(1, currentDeath, 0);
		assert.equal(result.isSuccess, false);
		assert.equal(result.outcome, "died");
		assert.equal(result.updateData["system.death.failure3"], true);
	});
});

describe("Sacramento RPG — Inventory, Ammo & Reload Rules", () => {
	it("calculates backpack, mount, and wagon slots", () => {
		assert.equal(HOLSTER_AMMO_CAPACITY, 36);
		assert.equal(BANDOLIER_AMMO_CAPACITY, 24);

		const items = [
			{
				type: "weapon",
				system: {
					attributes: { slots: { value: 2 }, isEquipped: { value: false }, isMountItem: { value: false } }
				}
			},
			{
				type: "weapon",
				system: {
					attributes: { slots: { value: 2 }, isEquipped: { value: true }, isMountItem: { value: false } }
				}
			},
			{
				type: "consumable",
				system: {
					attributes: { slots: { value: 3 }, isEquipped: { value: false }, isMountItem: { value: true } }
				}
			}
		];

		const withoutWagon = calculateInventorySlots(items, false);
		assert.equal(withoutWagon.backpack.value, 2);
		assert.equal(withoutWagon.backpack.max, MAX_BACKPACK_SLOTS);
		assert.equal(withoutWagon.mount.value, 3);
		assert.equal(withoutWagon.mount.max, MAX_MOUNT_SLOTS);

		const withWagon = calculateInventorySlots(items, true);
		assert.equal(withWagon.mount.max, MAX_WAGON_SLOTS);
	});

	it("enforces holster (36), bandolier (24), and body weapon (4) limits via ammoCategory or legacy name", () => {
		const itemsOverLimit = [
			{
				name: "Coldre",
				type: "equipment",
				system: { attributes: { isEquipped: { value: true }, equipType: { value: "coldre" } } }
			},
			{
				name: "Custom Six-Shooter Bullets",
				type: "consumable",
				system: {
					attributes: {
						isEquipped: { value: true },
						ammoCategory: { value: "revolver" },
						quantity: { value: 40 }
					}
				}
			},
			{
				name: "Custom Winchester Shells",
				type: "consumable",
				system: {
					attributes: {
						isEquipped: { value: true },
						ammoCategory: { value: "rifle" },
						quantity: { value: 25 }
					}
				}
			}
		];
		const warnings = validateEquipmentAndAmmoLimits(itemsOverLimit);
		assert.equal(warnings.length, 2);
	});

	it("converts 6th Pain Circle (countdown reaching 0) into 1 Life damage and resets Pain to 6", () => {
		assert.equal(resolvePainOverflow(2, 6, 6), null);
		const overflow = resolvePainOverflow(0, 6, 6);
		assert.deepEqual(overflow, { healthValue: 5, painValue: 6 });
	});

	it("calculates weapon reload prioritizing equipped ammo stacks", () => {
		const weapon = {
			system: {
				attributes: {
					ammo: { value: 2, max: 6 },
					ammoType: { value: "revólver" }
				}
			}
		};
		const inventory = [
			{
				id: "backpack-ammo",
				name: "Munição de Revólver",
				type: "consumable",
				system: { attributes: { isEquipped: { value: false }, quantity: { value: 12 } } }
			},
			{
				id: "holster-ammo",
				name: "Munição de Revólver",
				type: "consumable",
				system: { attributes: { isEquipped: { value: true }, quantity: { value: 3 } } }
			}
		];

		const reload = calculateWeaponReload(weapon, inventory);
		assert.equal(reload.error, null);
		assert.equal(reload.ammoToReload, 4);
		assert.equal(reload.newAmmoValue, 6);
		assert.deepEqual(reload.itemUpdates, [
			{ _id: "holster-ammo", "system.attributes.quantity.value": 0 },
			{ _id: "backpack-ammo", "system.attributes.quantity.value": 11 }
		]);
	});
});

describe("Sacramento RPG — Card Deck Initiative Rules", () => {
	it("ranks card values (2..14) and suit tie-breakers (Spades > Hearts > Diamonds > Clubs)", () => {
		assert.equal(SUIT_DECIMALS.spades, 0.4);
		assert.equal(SUIT_DECIMALS.hearts, 0.3);
		assert.equal(SUIT_DECIMALS.diamonds, 0.2);
		assert.equal(SUIT_DECIMALS.clubs, 0.1);

		const aceOfSpades = { name: "Ace of Spades", value: 1, suit: "spades" };
		const aceOfHearts = { name: "Ace of Hearts", value: 1, suit: "hearts" };
		const kingOfSpades = { name: "King of Spades", value: 13, suit: "spades" };

		assert.equal(getCardNumericValue(aceOfSpades), 14);
		assert.equal(getCardSuit(aceOfSpades), "spades");
		assert.equal(calculateCardInitiative(aceOfSpades), 14.4);
		assert.equal(calculateCardInitiative(aceOfHearts), 14.3);
		assert.equal(calculateCardInitiative(kingOfSpades), 13.4);

		assert.ok(calculateCardInitiative(aceOfSpades) > calculateCardInitiative(aceOfHearts));
		assert.ok(calculateCardInitiative(aceOfHearts) > calculateCardInitiative(kingOfSpades));
	});
});

describe("Sacramento RPG — Combat & Critical Rules", () => {
	it("sets target number (NA) to 7 for explosives and 6 for standard weapons", () => {
		assert.equal(getWeaponTargetNumber("explosive"), EXPLOSIVE_TARGET_NUMBER);
		assert.equal(getWeaponTargetNumber("cannon"), EXPLOSIVE_TARGET_NUMBER);
		assert.equal(getWeaponTargetNumber("explosivo"), EXPLOSIVE_TARGET_NUMBER);
		assert.equal(getWeaponTargetNumber("canhão"), EXPLOSIVE_TARGET_NUMBER);
		assert.equal(getWeaponTargetNumber("revolver"), DEFAULT_TARGET_NUMBER);
	});

	it("treats natural 1 on the check die as an automatic failure and double 1 as a critical failure", () => {
		const autoFail = evaluateCheckOutcome(1, 10, 4, 6);
		assert.equal(autoFail.success, false);
		assert.equal(autoFail.automaticFailure, true);
		assert.equal(autoFail.criticalFailure, false);

		const critFail = evaluateCheckOutcome(1, 10, 1, 6);
		assert.equal(critFail.criticalFailure, true);

		const critHit = evaluateCheckOutcome(6, 6, 6, 7);
		assert.equal(critHit.success, true);
		assert.equal(critHit.criticalSuccess, true);
	});

	it("resolves attack critical tables and explosive misfires", () => {
		const mortalCrit = resolveAttackCriticals({ initialDie: 6, confirmDie: 6, tableDie: 1 });
		assert.equal(mortalCrit.isCriticalHit, true);
		assert.equal(mortalCrit.bonusDamage, 2);

		const explosiveMisfire = resolveAttackCriticals({
			initialDie: 1,
			confirmDie: 1,
			isExplosive: true,
			hasFogoNoCeu: false
		});
		assert.equal(explosiveMisfire.isCriticalMiss, true);
		assert.ok(explosiveMisfire.criticalEffect.includes("detonar na sua mão"));

		const safeExplosive = resolveAttackCriticals({
			initialDie: 1,
			confirmDie: 1,
			isExplosive: true,
			hasFogoNoCeu: true
		});
		assert.ok(safeExplosive.criticalEffect.includes("Fogo no Céu previne"));
	});

	it("formats fixed damage HTML with critical bonus and Life/Pain icons", () => {
		const lifeHtml = formatFixedDamageHtml("2", 2);
		assert.ok(lifeHtml.includes("4 (+2 Crítico)"));
		assert.ok(lifeHtml.includes("LifePoint.svg"));

		const painHtml = formatFixedDamageHtml("1 Dor", 0);
		assert.ok(painHtml.includes("PainPoint.svg"));
	});
});
