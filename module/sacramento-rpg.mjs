/* global Actors, Items */
import { registerDataModels } from "./data/models.mjs";
import { SacramentoRPGActor } from "./documents/actor.mjs";
import { SacramentoRPGCombat } from "./documents/combat.mjs";
import { SacramentoRPGItem } from "./documents/item.mjs";
import { SACRAMENTO_RPG } from "./helpers/config.mjs";
import { format, localize } from "./helpers/i18n.mjs";
import { migrateWorld } from "./helpers/migration.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { SacramentoRPGActorSheet } from "./sheets/actor-sheet.mjs";
import { SacramentoRPGItemSheet } from "./sheets/item-sheet.mjs";

Hooks.once("init", function () {
	game.sacramentorpg = {
		SacramentoRPGActor,
		SacramentoRPGItem,
		rollItemMacro
	};

	CONFIG.SACRAMENTO_RPG = SACRAMENTO_RPG;

	CONFIG.Actor.documentClass = SacramentoRPGActor;
	CONFIG.Item.documentClass = SacramentoRPGItem;
	CONFIG.Combat.documentClass = SacramentoRPGCombat;

	registerDataModels();

	CONFIG.ActiveEffect.legacyTransferral = false;

	game.settings.register("sacramento-rpg", "systemMigrationVersion", {
		name: "System Migration Version",
		scope: "world",
		config: false,
		type: String,
		default: ""
	});

	const ActorsCollection = foundry.documents?.collections?.Actors ?? Actors;
	const ItemsCollection = foundry.documents?.collections?.Items ?? Items;
	const CoreActorSheet = foundry.appv1?.sheets?.ActorSheet ?? ActorSheet;
	const CoreItemSheet = foundry.appv1?.sheets?.ItemSheet ?? ItemSheet;

	ActorsCollection.unregisterSheet("core", CoreActorSheet);
	ActorsCollection.registerSheet("sacramento-rpg", SacramentoRPGActorSheet, {
		makeDefault: true,
		label: "SACRAMENTO_RPG.SheetLabels.Actor"
	});
	ItemsCollection.unregisterSheet("core", CoreItemSheet);
	ItemsCollection.registerSheet("sacramento-rpg", SacramentoRPGItemSheet, {
		makeDefault: true,
		label: "SACRAMENTO_RPG.SheetLabels.Item"
	});

	if (game.babele) {
		game.babele.register({
			module: "sacramento-rpg",
			lang: "en",
			dir: "lang/babele/en"
		});
	}

	return preloadHandlebarsTemplates();
});

Handlebars.registerHelper("toLowerCase", function (str) {
	return str.toLowerCase();
});

Handlebars.registerHelper("eq", function (a, b) {
	return a === b;
});

Hooks.once("ready", async function () {
	await migrateWorld();
	Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

async function createItemMacro(data, slot) {
	if (data.type !== "Item") return;
	if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
		return ui.notifications.warn(localize("SACRAMENTO_RPG.Warnings.MacroOwnedItemsOnly"));
	}
	const item = await Item.fromDropData(data);

	const command = `game.sacramentorpg.rollItemMacro("${data.uuid}");`;
	let macro = game.macros.find((m) => m.name === item.name && m.command === command);
	if (!macro) {
		macro = await Macro.create({
			name: item.name,
			type: "script",
			img: item.img,
			command: command,
			flags: { "sacramento-rpg.itemMacro": true }
		});
	}
	game.user.assignHotbarMacro(macro, slot);
	return false;
}

function rollItemMacro(itemUuid) {
	const dropData = {
		type: "Item",
		uuid: itemUuid
	};
	Item.fromDropData(dropData).then((item) => {
		if (!item || !item.parent) {
			const itemName = item?.name ?? itemUuid;
			return ui.notifications.warn(format("SACRAMENTO_RPG.Warnings.MacroItemNotFound", { item: itemName }));
		}

		item.roll();
	});
}
