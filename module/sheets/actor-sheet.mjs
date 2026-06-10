import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

/**
 * Estende a ficha de PJ com modificações para o Sacramento RPG
 * @extends {ActorSheet}
 */
export class SacramentoRPGActorSheet extends ActorSheet {
	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["sacramento-rpg", "sheet", "actor"],
			width: 800,
			height: 600,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "features"
				}
			]
		});
	}

	/** @override */
	get template() {
		return `systems/sacramento-rpg/templates/actor/actor-${this.actor.type}-sheet.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	async getData() {
		const context = super.getData();

		// Use a safe clone of the actor data for further operations.
		const actorData = this.document.toObject(false);

		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = actorData.system;
		context.flags = actorData.flags;

		// Acessa as configurações globais
		context.config = CONFIG.SACRAMENTO_RPG;

		// Prepara dados de PJ
		if (actorData.type === "character") {
			this._prepareItems(context);
			this._prepareCharacterData(context);
		}

		// Prepara dados de NPC
		if (actorData.type === "npc") {
			this._prepareItems(context);
		}

		// Enriquece a biografia (permite arrastar itens para dentro do texto, rolar dados, etc)
		context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.biography, {
			secrets: this.document.isOwner,
			async: true,
			rollData: this.actor.getRollData(),
			relativeTo: this.actor
		});

		// Prepara efeitos ativos (Buffs/Debuffs)
		context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());

		return context;
	}

	_prepareCharacterData(context) {
		const systemData = context.system;
		const attributes = systemData.attributes;
		const abilitiesMap = systemData.abilities || {};

		const level = attributes.level?.value || 1;

		// XP Thresholds
		const xpMaxLevels = {
			1: 10,
			2: 20,
			3: 30,
			4: 45,
			5: 65,
			6: 100 // Level max
		};
		if (attributes.xp) {
			attributes.xp.max = xpMaxLevels[level] || 100;
		}

		const warnings = [];

		// Calculate total attributes distributed
		let totalAttributes = 0;
		for (const ab of Object.values(abilitiesMap)) {
			totalAttributes += ab.value || 0;
		}

		// Expected Attributes
		let expectedAttributes = 4; // Level 1
		if (level >= 3) expectedAttributes += 1;
		if (level >= 4) expectedAttributes += 1;
		if (level >= 5) expectedAttributes += 1;
		if (level >= 6) expectedAttributes += 1;

		if (totalAttributes < expectedAttributes) {
			warnings.push(`Falta distribuir ${expectedAttributes - totalAttributes} ponto(s) de Atributo.`);
		} else if (totalAttributes > expectedAttributes) {
			warnings.push(`Você distribuiu pontos de Atributo a mais! O esperado é ${expectedAttributes}.`);
		}

		// Expected Abilities
		let expectedAbilities = 2; // Level 1
		if (level >= 2) expectedAbilities += 1;
		if (level >= 3) expectedAbilities += 1;
		if (level >= 4) expectedAbilities += 1;
		if (level >= 6) expectedAbilities += 1;

		const actualAbilities = context.abilities?.length || 0;
		if (actualAbilities < expectedAbilities) {
			warnings.push(`Você precisa adicionar ${expectedAbilities - actualAbilities} Habilidade(s).`);
		} else if (actualAbilities > expectedAbilities) {
			warnings.push(`Você tem Habilidades a mais! O esperado é ${expectedAbilities}.`);
		}

		// Expected Antecedents
		const intVal = abilitiesMap.int?.value || 0;
		let expectedAntecedents = intVal; // Level 1
		if (level >= 2) expectedAntecedents += 1;
		if (level >= 3) expectedAntecedents += 1;
		if (level >= 4) expectedAntecedents += 1;
		if (level >= 5) expectedAntecedents += 1;
		if (level >= 6) expectedAntecedents += 1;

		let totalAntecedents = 0;
		for (const ant of Object.values(systemData.antecedents || {})) {
			totalAntecedents += ant.value || 0;
		}

		if (totalAntecedents < expectedAntecedents) {
			warnings.push(`Falta distribuir ${expectedAntecedents - totalAntecedents} ponto(s) de Antecedente.`);
		} else if (totalAntecedents > expectedAntecedents) {
			warnings.push(`Você distribuiu pontos de Antecedente a mais! O esperado é ${expectedAntecedents}.`);
		}

		context.warnings = warnings;

		// Mount fidelity logic
		if (systemData.mount) {
			const mountWarnings = [];
			const fid = systemData.mount.fidelidade?.value || 0;

			let expectedMountAttributes = 0;
			if (fid >= 2) expectedMountAttributes += 1;
			if (fid >= 5) expectedMountAttributes += 1;

			const currentMountAttributes =
				(systemData.mount.potencia?.value || 0) + (systemData.mount.resistencia?.value || 0);

			if (currentMountAttributes < expectedMountAttributes) {
				mountWarnings.push(
					`Falta distribuir ${expectedMountAttributes - currentMountAttributes} ponto(s) nos Atributos da Montaria.`
				);
			} else if (currentMountAttributes > expectedMountAttributes) {
				mountWarnings.push(`Você distribuiu pontos a mais na Montaria! O esperado é ${expectedMountAttributes}.`);
			}

			context.mountWarnings = mountWarnings;

			context.fidelityOpacity = {
				l1: fid >= 1 ? 1 : 0.4,
				l2: fid >= 2 ? 1 : 0.4,
				l3: fid >= 3 ? 1 : 0.4,
				l4: fid >= 4 ? 1 : 0.4,
				l5: fid >= 5 ? 1 : 0.4
			};
		}
	}

	_prepareItems(context) {
		const weapons = [];
		const equipment = [];
		const consumables = [];
		const abilities = [];

		const mountWeapons = [];
		const mountEquipment = [];
		const mountConsumables = [];

		for (const i of context.items) {
			i.img = i.img || Item.DEFAULT_ICON;
			const isMount = i.system.attributes?.isMountItem?.value === true;

			if (i.type === "weapon") {
				if (isMount) mountWeapons.push(i);
				else weapons.push(i);
			} else if (i.type === "equipment") {
				if (isMount) mountEquipment.push(i);
				else equipment.push(i);
			} else if (i.type === "consumable") {
				if (isMount) mountConsumables.push(i);
				else consumables.push(i);
			} else if (i.type === "ability") {
				abilities.push(i);
			}
		}

		context.weapons = weapons;
		context.equipment = equipment;
		context.consumables = consumables;
		context.abilities = abilities;

		context.mountWeapons = mountWeapons;
		context.mountEquipment = mountEquipment;
		context.mountConsumables = mountConsumables;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		html.on("click", ".item-edit", (ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.sheet.render(true);
		});

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Handle item ammo update
		html.on("change", ".item-ammo", async (ev) => {
			const itemId = ev.currentTarget.dataset.itemId;
			const item = this.actor.items.get(itemId);
			const newAmmo = parseInt(ev.currentTarget.value);
			await item.update({ "system.attributes.ammo.value": newAmmo });
		});

		// Handle item equip toggle
		html.on("change", ".item-equip", async (ev) => {
			const itemId = ev.currentTarget.dataset.itemId;
			const item = this.actor.items.get(itemId);
			const isEquipped = ev.currentTarget.checked;
			await item.update({ "system.attributes.isEquipped.value": isEquipped });
		});

		// Add Inventory Item
		html.on("click", ".item-create", this._onItemCreate.bind(this));

		// Equip/Unequip Toggle
		html.find(".item-equip").click((ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.update({
				"system.attributes.isEquipped.value": !item.system.attributes.isEquipped.value
			});
		});

		// Mount/Unmount Toggle
		html.find(".item-mount").click((ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			const current = item.system.attributes?.isMountItem?.value || false;
			item.update({
				"system.attributes.isMountItem.value": !current
			});
		});

		// Delete Inventory Item
		html.on("click", ".item-delete", (ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

		// Active Effect management
		html.on("click", ".effect-control", (ev) => {
			const row = ev.currentTarget.closest("li");
			const document = row.dataset.parentId === this.actor.id ? this.actor : this.actor.items.get(row.dataset.parentId);
			onManageActiveEffect(ev, document);
		});

		// Rollable abilities.
		html.on("click", ".rollable", this._onRoll.bind(this));

		// Drag events for macros.
		if (this.actor.isOwner) {
			const handler = (ev) => this._onDragStart(ev);
			html.find("li.item").each((i, li) => {
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = foundry.utils.duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${type.capitalize()}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			system: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.system["type"];

		// Finally, create the item!
		return await Item.create(itemData, { parent: this.actor });
	}

	async _onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		// Handle item rolls.
		if (dataset.rollType) {
			if (dataset.rollType === "item") {
				const itemId = element.closest(".item").dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll();
			}
		}

		// Handle rolls that supply the formula directly.
		if (dataset.roll) {
			let label = dataset.label ? `<strong>Teste de ${dataset.label}</strong>` : "Teste";
			const roll = new Roll(dataset.roll, this.actor.getRollData());
			await roll.evaluate({ async: true });

			const dieResult = roll.dice[0].results[0].result;
			const total = roll.total;
			let flavor = "";

			if (dieResult === 1) {
				const reroll = new Roll("1d6");
				await reroll.evaluate({ async: true });
				if (reroll.total === 1) {
					flavor = "<span style='color: red; font-weight: bold;'>Falha Crítica! (Rolou 1 duas vezes)</span>";
				} else {
					flavor = "<span style='color: darkred; font-weight: bold;'>Falha Automática! (Rolou 1)</span>";
				}
			} else if (dieResult === 6) {
				const reroll = new Roll("1d6");
				await reroll.evaluate({ async: true });
				if (reroll.total === 6) {
					flavor = "<span style='color: blue; font-weight: bold;'>Acerto Crítico! (Rolou 6 duas vezes)</span>";
				} else {
					flavor = "<span style='color: green; font-weight: bold;'>Sucesso! (Dado = 6)</span>";
				}
			} else {
				if (total >= 6) {
					flavor = "<span style='color: green; font-weight: bold;'>Sucesso! (NA 6)</span>";
				} else {
					flavor = "<span style='color: #333; font-weight: bold;'>Falha! (Total menor que 6)</span>";
				}
			}

			label += `<br>${flavor}`;

			roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: label,
				rollMode: game.settings.get("core", "rollMode")
			});
			return roll;
		}
	}
}
