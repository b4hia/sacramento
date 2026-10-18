import { format } from "../helpers/i18n.mjs";

const XP_THRESHOLDS = {
	1: 10,
	2: 20,
	3: 30,
	4: 45,
	5: 65,
	6: 100
};

export function getXpThreshold(level = 1) {
	return XP_THRESHOLDS[level] || 100;
}

export function calculateMaxHealth(level = 1, fisico = 0) {
	let maxHealth = 6 + fisico;
	const bonusPerTier = Math.max(1, fisico);

	if (level >= 2) maxHealth += bonusPerTier;
	if (level >= 4) maxHealth += bonusPerTier;
	if (level >= 5) maxHealth += bonusPerTier;
	if (level >= 6) maxHealth += 3;

	return maxHealth;
}

// House rule (see docs/HOUSE_RULES.md): intentionally diverges from the rulebook formula.
export function calculateMovements(velocidade = 0) {
	return Math.max(1, velocidade);
}

export function calculateCombatActions(coragem = 0) {
	return Math.max(1, coragem);
}

export function calculateMountMaxHealth(resistencia = 0) {
	return 6 + resistencia;
}

export function getExpectedAttributePoints(level = 1) {
	let expected = 4;
	if (level >= 3) expected += 1;
	if (level >= 4) expected += 1;
	if (level >= 5) expected += 1;
	if (level >= 6) expected += 1;
	return expected;
}

export function getExpectedAbilityCount(level = 1) {
	let expected = 2;
	if (level >= 2) expected += 1;
	if (level >= 3) expected += 1;
	if (level >= 4) expected += 1;
	if (level >= 6) expected += 1;
	return expected;
}

export function getExpectedAntecedentPoints(level = 1, intelecto = 0) {
	let expected = 4 + intelecto;
	if (level >= 2) expected += 1;
	return expected;
}

export function getExpectedMountAttributePoints(fidelidade = 0) {
	let expected = 3;
	if (fidelidade >= 2) expected += 1;
	if (fidelidade >= 5) expected += 1;
	return expected;
}

export function validateCharacterProgression(systemData, actualAbilitiesCount = 0) {
	const warnings = [];
	const level = systemData.attributes?.level?.value || 1;
	const abilitiesMap = systemData.abilities || {};

	let totalAttributes = 0;
	for (const ab of Object.values(abilitiesMap)) {
		totalAttributes += ab.value || 0;
	}

	const expectedAttributes = getExpectedAttributePoints(level);
	if (totalAttributes < expectedAttributes) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.MissingAttributes", { count: expectedAttributes - totalAttributes })
		);
	} else if (totalAttributes > expectedAttributes) {
		warnings.push(format("SACRAMENTO_RPG.Warnings.ExcessAttributes", { expected: expectedAttributes }));
	}

	const expectedAbilities = getExpectedAbilityCount(level);
	if (actualAbilitiesCount < expectedAbilities) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.MissingAbilities", { count: expectedAbilities - actualAbilitiesCount })
		);
	} else if (actualAbilitiesCount > expectedAbilities) {
		warnings.push(format("SACRAMENTO_RPG.Warnings.ExcessAbilities", { expected: expectedAbilities }));
	}

	const intVal = abilitiesMap.int?.value || 0;
	const expectedAntecedents = getExpectedAntecedentPoints(level, intVal);
	let totalAntecedents = 0;
	for (const ant of Object.values(systemData.antecedents || {})) {
		totalAntecedents += ant.value || 0;
	}

	if (totalAntecedents < expectedAntecedents) {
		warnings.push(
			format("SACRAMENTO_RPG.Warnings.MissingAntecedents", { count: expectedAntecedents - totalAntecedents })
		);
	} else if (totalAntecedents > expectedAntecedents) {
		warnings.push(format("SACRAMENTO_RPG.Warnings.ExcessAntecedents", { expected: expectedAntecedents }));
	}

	return warnings;
}

export function validateMountProgression(mountData) {
	if (!mountData) return [];

	const warnings = [];
	const fid = mountData.loyalty?.value ?? mountData.fidelidade?.value ?? 0;
	const expected = getExpectedMountAttributePoints(fid);
	const current =
		(mountData.potency?.value ?? mountData.potencia?.value ?? 0)
		+ (mountData.endurance?.value ?? mountData.resistencia?.value ?? 0);

	if (current < expected) {
		warnings.push(format("SACRAMENTO_RPG.Warnings.MissingMountAttributes", { count: expected - current }));
	} else if (current > expected) {
		warnings.push(format("SACRAMENTO_RPG.Warnings.ExcessMountAttributes", { expected }));
	}

	return warnings;
}
