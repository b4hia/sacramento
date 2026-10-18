import { format, localize } from "../helpers/i18n.mjs";

export const DEFAULT_TARGET_NUMBER = 6;
export const EXPLOSIVE_TARGET_NUMBER = 7;

export const CRIT_SUCCESS_KEYS = [
	"SACRAMENTO_RPG.CritTable.Hit1",
	"SACRAMENTO_RPG.CritTable.Hit2",
	"SACRAMENTO_RPG.CritTable.Hit3",
	"SACRAMENTO_RPG.CritTable.Hit4",
	"SACRAMENTO_RPG.CritTable.Hit5",
	"SACRAMENTO_RPG.CritTable.Hit6"
];

export const CRIT_FAILURE_KEYS = [
	"SACRAMENTO_RPG.CritTable.Fail1",
	"SACRAMENTO_RPG.CritTable.Fail2",
	"SACRAMENTO_RPG.CritTable.Fail3",
	"SACRAMENTO_RPG.CritTable.Fail4",
	"SACRAMENTO_RPG.CritTable.Fail5",
	"SACRAMENTO_RPG.CritTable.Fail6"
];

const EXPLOSIVE_WEAPON_TYPES = new Set(["explosive", "cannon", "explosivo", "canhão", "canhao"]);

export function isExplosiveWeapon(weaponType = "") {
	return EXPLOSIVE_WEAPON_TYPES.has(String(weaponType).toLowerCase());
}

export function getWeaponTargetNumber(weaponType = "") {
	return isExplosiveWeapon(weaponType) ? EXPLOSIVE_TARGET_NUMBER : DEFAULT_TARGET_NUMBER;
}

// Classifies a check into success, failure, critical hit or critical failure from the die, total and confirmation die.
export function evaluateCheckOutcome(dieResult, total, confirmationDie = null, targetNumber = DEFAULT_TARGET_NUMBER) {
	if (dieResult === 1) {
		const isCriticalFailure = confirmationDie === 1;
		return {
			success: false,
			automaticFailure: true,
			criticalSuccess: false,
			criticalFailure: isCriticalFailure
		};
	}

	if (dieResult === 6) {
		const isCriticalSuccess = confirmationDie === 6;
		return {
			success: total >= targetNumber || isCriticalSuccess,
			automaticFailure: false,
			criticalSuccess: isCriticalSuccess,
			criticalFailure: false
		};
	}

	return {
		success: total >= targetNumber,
		automaticFailure: false,
		criticalSuccess: false,
		criticalFailure: false
	};
}

export function resolveAttackCriticals({
	initialDie,
	confirmDie = null,
	tableDie = null,
	isExplosive = false,
	hasFogoNoCeu = false
}) {
	if (initialDie === 6 && confirmDie === 6) {
		const index = Math.min(Math.max((tableDie || 1) - 1, 0), CRIT_SUCCESS_KEYS.length - 1);
		const effect = localize(CRIT_SUCCESS_KEYS[index]);
		return {
			isCriticalHit: true,
			isCriticalMiss: false,
			criticalEffect: effect,
			bonusDamage: index === 0 ? 2 : 0
		};
	}

	if (initialDie === 1 && confirmDie === 1) {
		if (isExplosive) {
			return {
				isCriticalHit: false,
				isCriticalMiss: true,
				criticalEffect: hasFogoNoCeu
					? localize("SACRAMENTO_RPG.CritTable.ExplosiveSafe")
					: localize("SACRAMENTO_RPG.CritTable.ExplosiveMisfire"),
				bonusDamage: 0
			};
		}

		const index = Math.min(Math.max((tableDie || 1) - 1, 0), CRIT_FAILURE_KEYS.length - 1);
		return {
			isCriticalHit: false,
			isCriticalMiss: true,
			criticalEffect: localize(CRIT_FAILURE_KEYS[index]),
			bonusDamage: 0
		};
	}

	return {
		isCriticalHit: false,
		isCriticalMiss: false,
		criticalEffect: "",
		bonusDamage: 0
	};
}

export function formatFixedDamageHtml(rawDamage, bonusDamage = 0) {
	const dmg = String(rawDamage || "");
	if (!dmg || dmg === "0") return "";

	const isPain = dmg.toLowerCase().includes("dor") || dmg.toLowerCase().includes("pain");
	let formatted = dmg;

	if (bonusDamage > 0) {
		const matches = [...dmg.matchAll(/\d+/g)];
		for (const match of matches) {
			const num = parseInt(match[0]);
			formatted = formatted.replace(match[0], `${num + bonusDamage}`);
		}
		formatted += ` ${format("SACRAMENTO_RPG.Chat.CritBonusSuffix", { bonus: bonusDamage })}`;
	}

	const iconPath = isPain
		? "systems/sacramento-rpg/icons/common/PainPoint.svg"
		: "systems/sacramento-rpg/icons/common/LifePoint.svg";
	const title = isPain
		? localize("SACRAMENTO_RPG.Chat.DamagePainTitle")
		: localize("SACRAMENTO_RPG.Chat.DamageLifeTitle");

	return `${formatted} <img src="${iconPath}" class="skill-icon" title="${title}"/>`;
}
