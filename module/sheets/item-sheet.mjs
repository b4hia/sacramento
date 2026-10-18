import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

const BaseItemSheet = globalThis.foundry?.appv1?.sheets?.ItemSheet ?? globalThis.ItemSheet;

export class SacramentoRPGItemSheet extends BaseItemSheet {
	/** @override */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["sacramento-rpg", "sheet", "item"],
			width: 520,
			height: 480,
			tabs: [
				{
					navSelector: ".sheet-tabs",
					contentSelector: ".sheet-body",
					initial: "description"
				}
			]
		});
	}

	/** @override */
	get template() {
		return "systems/sacramento-rpg/templates/item/item-sheet.hbs";
	}

	/** @override */
	async getData() {
		const context = super.getData();
		const itemData = this.document.toObject(false);
		const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;

		context.enrichedDescription = await TextEditorImpl.enrichHTML(this.item.system.description, {
			secrets: this.document.isOwner,
			async: true,
			rollData: this.item.getRollData(),
			relativeTo: this.item
		});

		context.system = itemData.system;
		context.flags = itemData.flags;
		context.config = CONFIG.SACRAMENTO_RPG;
		context.effects = prepareActiveEffectCategories(this.item.effects);

		return context;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		if (!this.isEditable) return;

		html.on("click", ".effect-control", (ev) => onManageActiveEffect(ev, this.item));
	}
}
