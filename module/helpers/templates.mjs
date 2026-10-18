/* global loadTemplates */

export const preloadHandlebarsTemplates = async function () {
	return loadTemplates([
		"systems/sacramento-rpg/templates/actor/parts/actor-items.hbs",
		"systems/sacramento-rpg/templates/actor/parts/actor-mount-items.hbs",
		"systems/sacramento-rpg/templates/actor/parts/actor-effects.hbs",
		"systems/sacramento-rpg/templates/item/parts/item-header.hbs",
		"systems/sacramento-rpg/templates/item/parts/item-description.hbs",
		"systems/sacramento-rpg/templates/item/parts/item-effects.hbs",
		"systems/sacramento-rpg/templates/item/details/details-weapon.hbs",
		"systems/sacramento-rpg/templates/item/details/details-equipment.hbs",
		"systems/sacramento-rpg/templates/item/details/details-consumable.hbs",
		"systems/sacramento-rpg/templates/item/details/details-ability.hbs",
		"systems/sacramento-rpg/templates/chat/attack-roll.hbs"
	]);
};
