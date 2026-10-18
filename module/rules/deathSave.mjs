// Applies one die result to the death save checkboxes and returns the next state.
// House rule (see docs/HOUSE_RULES.md).
export function resolveDeathSaveRoll(dieResult, currentDeathState = {}, currentHealth = 0) {
	const isSuccess = dieResult % 2 === 0;
	const state = {
		success1: Boolean(currentDeathState.success1),
		success2: Boolean(currentDeathState.success2),
		success3: Boolean(currentDeathState.success3),
		failure1: Boolean(currentDeathState.failure1),
		failure2: Boolean(currentDeathState.failure2),
		failure3: Boolean(currentDeathState.failure3)
	};

	let successes = (state.success1 ? 1 : 0) + (state.success2 ? 1 : 0) + (state.success3 ? 1 : 0);
	let failures = (state.failure1 ? 1 : 0) + (state.failure2 ? 1 : 0) + (state.failure3 ? 1 : 0);
	const updateData = {};

	if (isSuccess) {
		successes = Math.min(3, successes + 1);
		if (!state.success1) updateData["system.death.success1"] = true;
		else if (!state.success2) updateData["system.death.success2"] = true;
		else if (!state.success3) updateData["system.death.success3"] = true;
	} else {
		failures = Math.min(3, failures + 1);
		if (!state.failure1) updateData["system.death.failure1"] = true;
		else if (!state.failure2) updateData["system.death.failure2"] = true;
		else if (!state.failure3) updateData["system.death.failure3"] = true;
	}

	let outcome = "pending";
	if (successes >= 3) {
		outcome = "survived";
		updateData["system.health.value"] = Math.max(currentHealth || 0, 3);
		updateData["system.death.success1"] = false;
		updateData["system.death.success2"] = false;
		updateData["system.death.success3"] = false;
		updateData["system.death.failure1"] = false;
		updateData["system.death.failure2"] = false;
		updateData["system.death.failure3"] = false;
	} else if (failures >= 3) {
		outcome = "died";
	}

	return {
		isSuccess,
		successes,
		failures,
		outcome,
		updateData
	};
}
