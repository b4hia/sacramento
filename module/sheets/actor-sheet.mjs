import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { format, localize } from "../helpers/i18n.mjs";
import { evaluateCheckOutcome } from "../rules/criticals.mjs";
import { resolveDeathSaveRoll } from "../rules/deathSave.mjs";
import { calculateWeaponReload, validateEquipmentAndAmmoLimits } from "../rules/inventory.mjs";
import { getXpThreshold, validateCharacterProgression, validateMountProgression } from "../rules/progression.mjs";

const BaseActorSheet = globalThis.foundry?.appv1?.sheets?.ActorSheet ?? globalThis.ActorSheet;

export class SacramentoRPGActorSheet extends BaseActorSheet {
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
					initial: "status"
				}
			]
		});
	}

	/** @override */
	get template() {
		return `systems/sacramento-rpg/templates/actor/actor-${this.actor.type}-sheet.hbs`;
	}

	/** @override */
	async getData() {
		const context = super.getData();
		const actorData = this.document.toObject(false);

		context.system = actorData.system;
		context.flags = actorData.flags;
		context.config = CONFIG.SACRAMENTO_RPG;

		if (actorData.type === "character") {
			this._prepareItems(context);
			this._prepareCharacterData(context);
		}

		if (actorData.type === "npc") {
			this._prepareItems(context);
		}

		const bioObj = this.actor.system.bio || {};
		const legacyBio = typeof this.actor.system.biography === "string" ? this.actor.system.biography : "";
		const characteristicsContent = bioObj.characteristics || legacyBio || "";

		if (!context.system.bio) {
			context.system.bio = {
				characteristics: characteristicsContent,
				past: bioObj.past || "",
				motivation: bioObj.motivation || "",
				howToAchieve: bioObj.howToAchieve || "",
				whyAchieve: bioObj.whyAchieve || "",
				notes: bioObj.notes || ""
			};
		}

		const enrichmentOptions = {
			secrets: this.document.isOwner,
			async: true,
			rollData: this.actor.getRollData(),
			relativeTo: this.actor
		};

		const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;
		context.enrichedBiography = await TextEditorImpl.enrichHTML(legacyBio, enrichmentOptions);
		context.enrichedCharacteristics = await TextEditorImpl.enrichHTML(characteristicsContent, enrichmentOptions);
		context.enrichedPast = await TextEditorImpl.enrichHTML(bioObj.past || "", enrichmentOptions);
		context.enrichedNotes = await TextEditorImpl.enrichHTML(bioObj.notes || "", enrichmentOptions);

		context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());

		return context;
	}

	_prepareCharacterData(context) {
		const systemData = context.system;
		const attributes = systemData.attributes;
		const level = attributes.level?.value || 1;

		if (attributes.xp) {
			attributes.xp.max = getXpThreshold(level);
		}

		for (const [k, v] of Object.entries(systemData.abilities || {})) {
			const i18nKey = CONFIG.SACRAMENTO_RPG.abilities[k];
			if (i18nKey) v.label = localize(i18nKey);
		}

		for (const [k, v] of Object.entries(systemData.antecedents || {})) {
			const i18nKey = CONFIG.SACRAMENTO_RPG.antecedents?.[k];
			if (i18nKey) v.label = localize(i18nKey);
		}

		const progressionWarnings = validateCharacterProgression(systemData, context.abilities?.length || 0);
		const inventoryWarnings = validateEquipmentAndAmmoLimits(
			context.items,
			systemData.slots,
			systemData.mount?.slots
		);
		context.warnings = [...progressionWarnings, ...inventoryWarnings];

		if (systemData.mount) {
			const fid = systemData.mount.loyalty?.value ?? systemData.mount.fidelidade?.value ?? 0;
			context.mountWarnings = validateMountProgression(systemData.mount);
			context.fidelityClasses = {
				l1: fid >= 1 ? "unlocked" : "locked",
				l2: fid >= 2 ? "unlocked" : "locked",
				l3: fid >= 3 ? "unlocked" : "locked",
				l4: fid >= 4 ? "unlocked" : "locked",
				l5: fid >= 5 ? "unlocked" : "locked"
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

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		html.on("click", ".item-edit", (ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.sheet.render(true);
		});

		if (!this.isEditable) return;

		html.on("change", ".item-ammo", async (ev) => {
			const itemId = ev.currentTarget.dataset.itemId;
			const item = this.actor.items.get(itemId);
			const newAmmo = parseInt(ev.currentTarget.value);
			await item.update({ "system.attributes.ammo.value": newAmmo });
		});

		html.on("change", ".item-quantity", async (ev) => {
			const itemId = ev.currentTarget.dataset.itemId;
			const item = this.actor.items.get(itemId);
			const newQty = parseInt(ev.currentTarget.value);
			await item.update({ "system.attributes.quantity.value": newQty });
		});

		html.on("change", ".item-equip", async (ev) => {
			const itemId = ev.currentTarget.dataset.itemId;
			const item = this.actor.items.get(itemId);
			const isEquipped = ev.currentTarget.checked;
			await item.update({ "system.attributes.isEquipped.value": isEquipped });
		});

		html.on("click", ".item-reload", this._onReloadWeapon.bind(this));
		html.on("click", ".item-create", this._onItemCreate.bind(this));

		html.find(".item-mount").click((ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			const current = item.system.attributes?.isMountItem?.value || false;
			item.update({
				"system.attributes.isMountItem.value": !current
			});
		});

		html.on("click", ".item-delete", (ev) => {
			const li = $(ev.currentTarget).parents(".item");
			const item = this.actor.items.get(li.data("itemId"));
			item.delete();
			li.slideUp(200, () => this.render(false));
		});

		html.on("click", ".effect-control", (ev) => {
			const row = ev.currentTarget.closest("li");
			const document =
				row.dataset.parentId === this.actor.id ? this.actor : this.actor.items.get(row.dataset.parentId);
			onManageActiveEffect(ev, document);
		});

		html.on("click", ".rollable", this._onRoll.bind(this));

		if (this.actor.isOwner) {
			const handler = (ev) => this._onDragStart(ev);
			html.find("li.item").each((i, li) => {
				if (li.classList.contains("inventory-header")) return;
				li.setAttribute("draggable", true);
				li.addEventListener("dragstart", handler, false);
			});
		}
	}

	async _onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		const type = header.dataset.type;
		const data = foundry.utils.duplicate(header.dataset);
		const typeLabel = localize(`TYPES.Item.${type}`);
		const name = format("SACRAMENTO_RPG.Item.NewItemName", { type: typeLabel });
		const itemData = {
			name,
			type,
			system: data
		};
		delete itemData.system["type"];

		return await Item.create(itemData, { parent: this.actor });
	}

	async _onRoll(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		if (dataset.rollType) {
			if (dataset.rollType === "item") {
				const itemId = element.closest(".item").dataset.itemId;
				const item = this.actor.items.get(itemId);
				if (item) return item.roll();
			}
			if (dataset.rollType === "death-save") {
				return this._onRollDeathSave();
			}
		}

		if (dataset.roll) {
			const checkLabel = dataset.label
				? format("SACRAMENTO_RPG.Roll.CheckOf", { label: dataset.label })
				: localize("SACRAMENTO_RPG.Roll.GenericCheck");
			let label = `<strong>${checkLabel}</strong>`;
			const roll = new Roll(dataset.roll, this.actor.getRollData());
			await roll.evaluate({ async: true });

			const dieResult = roll.dice[0].results[0].result;
			let confirmDie = null;

			if (dieResult === 1 || dieResult === 6) {
				const reroll = new Roll("1d6");
				await reroll.evaluate({ async: true });
				confirmDie = reroll.total;
			}

			const outcome = evaluateCheckOutcome(dieResult, roll.total, confirmDie);
			let flavor = "";

			if (outcome.criticalFailure) {
				flavor = `<span class='chat-outcome-crit-fail'>${localize("SACRAMENTO_RPG.Roll.OutcomeCritFail")}</span>`;
			} else if (outcome.automaticFailure) {
				flavor = `<span class='chat-outcome-auto-fail'>${localize("SACRAMENTO_RPG.Roll.OutcomeAutoFail")}</span>`;
			} else if (outcome.criticalSuccess) {
				flavor = `<span class='chat-outcome-crit-success'>${localize("SACRAMENTO_RPG.Roll.OutcomeCritSuccess")}</span>`;
			} else if (outcome.success && dieResult === 6) {
				flavor = `<span class='chat-outcome-success'>${localize("SACRAMENTO_RPG.Roll.OutcomeSuccessDie6")}</span>`;
			} else if (outcome.success) {
				flavor = `<span class='chat-outcome-success'>${localize("SACRAMENTO_RPG.Roll.OutcomeSuccessTN6")}</span>`;
			} else {
				flavor = `<span class='chat-outcome-fail'>${localize("SACRAMENTO_RPG.Roll.OutcomeFailTN6")}</span>`;
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

	async _onRollDeathSave() {
		const roll = new Roll("1d6");
		await roll.evaluate({ async: true });

		const dieResult = roll.total;
		const result = resolveDeathSaveRoll(dieResult, this.actor.system.death, this.actor.system.health?.value);

		const outcomeText = result.isSuccess
			? format("SACRAMENTO_RPG.DeathSave.EvenSuccess", { die: dieResult, current: result.successes })
			: format("SACRAMENTO_RPG.DeathSave.OddFailure", { die: dieResult, current: result.failures });

		let statusMessage = result.isSuccess
			? `<span class="chat-outcome-success">${outcomeText}</span>`
			: `<span class="chat-outcome-auto-fail">${outcomeText}</span>`;

		if (result.outcome === "survived") {
			statusMessage += `<br><strong class='chat-outcome-success'>${localize("SACRAMENTO_RPG.DeathSave.SurvivedMsg")}</strong>`;
		} else if (result.outcome === "died") {
			statusMessage += `<br><strong class='chat-outcome-auto-fail'>${localize("SACRAMENTO_RPG.DeathSave.DiedMsg")}</strong>`;
		}

		await this.actor.update(result.updateData);

		const title = localize("SACRAMENTO_RPG.DeathSave.Title");
		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			flavor: `<strong>${title}</strong><br>${statusMessage}`,
			rollMode: game.settings.get("core", "rollMode")
		});

		return roll;
	}

	async _onReloadWeapon(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const itemId = element.closest(".item").dataset.itemId;
		const weapon = this.actor.items.get(itemId);

		if (!weapon || weapon.type !== "weapon") return;

		const reloadPlan = calculateWeaponReload(weapon, Array.from(this.actor.items));
		if (reloadPlan.error) {
			if (reloadPlan.error === "already_full") {
				ui.notifications.info(reloadPlan.message);
			} else {
				ui.notifications.warn(reloadPlan.message);
			}
			return;
		}

		await this.actor.updateEmbeddedDocuments("Item", reloadPlan.itemUpdates);
		await weapon.update({ "system.attributes.ammo.value": reloadPlan.newAmmoValue });

		ui.notifications.info(format("SACRAMENTO_RPG.Reload.SuccessNotification", { count: reloadPlan.ammoToReload }));
	}
}
