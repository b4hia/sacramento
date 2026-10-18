import { format, localize } from "./i18n.mjs";

export function onManageActiveEffect(event, owner) {
	event.preventDefault();
	const a = event.currentTarget;
	const li = a.closest("li");
	const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
	switch (a.dataset.action) {
		case "create":
			return owner.createEmbeddedDocuments("ActiveEffect", [
				{
					name: format("DOCUMENT.New", {
						type: localize("DOCUMENT.ActiveEffect")
					}),
					icon: "icons/svg/aura.svg",
					origin: owner.uuid,
					"duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
					disabled: li.dataset.effectType === "inactive"
				}
			]);
		case "edit":
			return effect.sheet.render(true);
		case "delete":
			return effect.delete();
		case "toggle":
			return effect.update({ disabled: !effect.disabled });
	}
}

export function prepareActiveEffectCategories(effects) {
	const categories = {
		temporary: {
			type: "temporary",
			label: localize("SACRAMENTO_RPG.Effect.Temporary"),
			effects: []
		},
		passive: {
			type: "passive",
			label: localize("SACRAMENTO_RPG.Effect.Passive"),
			effects: []
		},
		inactive: {
			type: "inactive",
			label: localize("SACRAMENTO_RPG.Effect.Inactive"),
			effects: []
		}
	};

	for (const e of effects) {
		if (e.disabled) categories.inactive.effects.push(e);
		else if (e.isTemporary) categories.temporary.effects.push(e);
		else categories.passive.effects.push(e);
	}
	return categories;
}
