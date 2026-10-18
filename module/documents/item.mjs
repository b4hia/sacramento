import { format, localize } from "../helpers/i18n.mjs";
import { formatFixedDamageHtml, isExplosiveWeapon, resolveAttackCriticals } from "../rules/criticals.mjs";

const DAMAGE_MODE_STRATEGIES = {
	async fixed({ dmg, bonusDamage }) {
		return {
			damageFixedHtml: formatFixedDamageHtml(dmg, bonusDamage),
			damageRolls: []
		};
	},

	async roll({ dmg, isPain, bonusDamage }) {
		const damageRolls = [];

		if (isPain) {
			const roll = new Roll(`1d6${bonusDamage > 0 ? " + " + bonusDamage : ""}`);
			await roll.evaluate();
			if (game.dice3d) await game.dice3d.showForRoll(roll, game.user, true);
			damageRolls.push({
				label:
					bonusDamage > 0
						? localize("SACRAMENTO_RPG.Chat.DamagePainCirclesCrit")
						: localize("SACRAMENTO_RPG.Chat.DamagePainCircles"),
				icon: "systems/sacramento-rpg/icons/common/PainPoint.svg",
				renderedRoll: await roll.render()
			});
			return { damageFixedHtml: "", damageRolls };
		}

		const dmgMatches = [...dmg.matchAll(/\d+/g)];
		if (dmgMatches.length > 0) {
			for (const match of dmgMatches) {
				const num = parseInt(match[0]);
				if (num <= 0) continue;
				const diceCount = num * 2;
				const roll = new Roll(`${diceCount}d6${bonusDamage > 0 ? " + " + bonusDamage : ""}`);
				await roll.evaluate();
				if (game.dice3d) await game.dice3d.showForRoll(roll, game.user, true);
				damageRolls.push({
					label: localize("SACRAMENTO_RPG.Chat.DamagePainCircles"),
					icon: "systems/sacramento-rpg/icons/common/PainPoint.svg",
					renderedRoll: await roll.render()
				});
			}
		} else if (bonusDamage > 0) {
			const roll = new Roll(`${bonusDamage}`);
			await roll.evaluate();
			damageRolls.push({
				label: localize("SACRAMENTO_RPG.Chat.DamagePainCirclesDeadly"),
				icon: "systems/sacramento-rpg/icons/common/PainPoint.svg",
				renderedRoll: await roll.render()
			});
		}

		return { damageFixedHtml: "", damageRolls };
	}
};

const ITEM_CHAT_STRATEGIES = {
	equipment(itemData, chatContext) {
		const slots = itemData.attributes?.slots?.value || 0;
		const effect = itemData.attributes?.effect?.value || "";
		const slotsLabel = localize("SACRAMENTO_RPG.Chat.SlotsOccupied");
		const effectLabel = localize("SACRAMENTO_RPG.Chat.EffectLabel");

		chatContext.additionalInfo += `<p><strong>${slotsLabel}:</strong> ${slots}</p>`;
		if (effect) {
			chatContext.additionalInfo += `
            <div class="chat-effect-box equipment-effect">
               <strong>${effectLabel}:</strong> ${effect}
            </div>`;
		}
	},

	consumable(itemData, chatContext) {
		const slots = itemData.attributes?.slots?.value || 0;
		const effect = itemData.attributes?.effect?.value || "";
		const qtd = itemData.attributes?.quantity?.value || 1;
		const qtyLabel = localize("SACRAMENTO_RPG.Chat.QuantityLabel");
		const slotsLabel = localize("SACRAMENTO_RPG.Chat.SlotsOccupied");
		const effectLabel = localize("SACRAMENTO_RPG.Chat.EffectLabel");

		chatContext.additionalInfo += `<p><strong>${qtyLabel}:</strong> ${qtd} | <strong>${slotsLabel}:</strong> ${slots}</p>`;
		if (effect) {
			chatContext.additionalInfo += `
            <div class="chat-effect-box consumable-effect">
               <strong>${effectLabel}:</strong> ${effect}
            </div>`;
		}
	}
};

export class SacramentoRPGItem extends Item {
	/** @override */
	prepareData() {
		super.prepareData();
	}

	/** @override */
	getRollData() {
		const rollData = { ...this.system };
		if (!this.actor) return rollData;
		rollData.actor = this.actor.getRollData();
		return rollData;
	}

	async roll() {
		if (this.type === "weapon") {
			new Dialog({
				title: format("SACRAMENTO_RPG.Dialog.AttackWithTitle", { name: this.name }),
				content: `<p>${format("SACRAMENTO_RPG.Dialog.ChooseAttackMode", { name: this.name })}</p>`,
				buttons: {
					roll: {
						label: localize("SACRAMENTO_RPG.Dialog.RollAttackBtn"),
						callback: () => this._executeItemRoll("roll")
					},
					fixed: {
						label: localize("SACRAMENTO_RPG.Dialog.FixedDamageBtn"),
						callback: () => this._executeItemRoll("fixed")
					}
				},
				default: "roll"
			}).render(true);
		} else {
			await this._executeItemRoll("fixed");
		}
	}

	// Consumes weapon internal ammo if configured, or draws from matching inventory consumables prioritizing equipped slots.
	async _consumeWeaponAmmo() {
		const itemData = this.system;
		const actor = this.actor;
		let ammoVal = itemData.attributes.ammo?.value || 0;
		const ammoMax = itemData.attributes.ammo?.max || 0;
		const ammoType = itemData.attributes.ammoType?.value || "";

		if (ammoMax > 0) {
			if (ammoVal <= 0) {
				ui.notifications.warn(format("SACRAMENTO_RPG.Warnings.WeaponUnloaded", { name: this.name }));
				return { canProceed: false, infoHtml: "" };
			}
			ammoVal--;
			await this.update({ "system.attributes.ammo.value": ammoVal });
			const remainingLabel = localize("SACRAMENTO_RPG.Chat.RemainingAmmo");
			return {
				canProceed: true,
				infoHtml: `<p class="chat-ammo-info"><strong>${remainingLabel}:</strong> ${ammoVal}/${ammoMax}</p>`
			};
		}

		if (ammoType !== "") {
			const lowerAmmoType = ammoType.toLowerCase();
			const matchingAmmos = actor.items
				.filter((i) => {
					if (i.type !== "consumable" || !(i.system.attributes.quantity?.value > 0)) return false;
					const category = (i.system.attributes?.ammoCategory?.value || "").toLowerCase();
					if (category && category !== "none" && category === lowerAmmoType) return true;
					return i.name.toLowerCase().includes(lowerAmmoType);
				})
				.sort((a, b) => {
					const eqA = a.system.attributes?.isEquipped?.value ? 1 : 0;
					const eqB = b.system.attributes?.isEquipped?.value ? 1 : 0;
					return eqB - eqA;
				});

			if (matchingAmmos.length === 0) {
				ui.notifications.warn(format("SACRAMENTO_RPG.Warnings.NoAmmoForWeapon", { ammoType, name: this.name }));
				return { canProceed: false, infoHtml: "" };
			}

			const ammoToConsume = matchingAmmos[0];
			const newQtd = (ammoToConsume.system.attributes.quantity?.value || 1) - 1;
			await ammoToConsume.update({ "system.attributes.quantity.value": newQtd });
			const consumedLabel = localize("SACRAMENTO_RPG.Chat.ConsumedAmmo");
			return {
				canProceed: true,
				infoHtml: `<p class="chat-ammo-info"><strong>${consumedLabel}:</strong> 1 ${ammoType}</p>`
			};
		}

		return { canProceed: true, infoHtml: "" };
	}

	async _rollWeaponAttack(mode) {
		const itemData = this.system;
		const actor = this.actor;
		const dmg = String(itemData.attributes.damage?.value || "");
		const reload = itemData.attributes.reload?.value || 0;
		const slots = itemData.attributes.slots?.value || 0;
		const isPain = dmg.toLowerCase().includes("dor") || dmg.toLowerCase().includes("pain");
		const isExplosive = isExplosiveWeapon(itemData.attributes.weaponType?.value);

		let attackMod = 0;
		if (actor.type === "character") {
			attackMod = actor.system.antecedents?.violencia?.value || 0;
		} else if (actor.type === "npc") {
			attackMod = actor.system.attributes?.cr?.value || 0;
		}

		const attackRoll = new Roll("1d6 + @mod", { mod: attackMod });
		await attackRoll.evaluate();
		const initialDie = attackRoll.dice[0].results[0].result;

		let confirmDie = null;
		let tableDie = null;

		if (initialDie === 6 || initialDie === 1) {
			const confirmRoll = new Roll("1d6");
			await confirmRoll.evaluate();
			confirmDie = confirmRoll.total;

			if ((initialDie === 6 && confirmDie === 6) || (initialDie === 1 && confirmDie === 1 && !isExplosive)) {
				const tableRoll = new Roll("1d6");
				await tableRoll.evaluate();
				tableDie = tableRoll.total;
				if (game.dice3d) await game.dice3d.showForRoll(tableRoll, game.user, true);
			}
			if (game.dice3d) await game.dice3d.showForRoll(confirmRoll, game.user, true);
		}

		if (game.dice3d) await game.dice3d.showForRoll(attackRoll, game.user, true);

		const hasFogoNoCeu = actor.items.some(
			(i) => i.system?.attributes?.slug?.value === "fogo-no-ceu" || i.name.toLowerCase() === "fogo no céu"
		);
		const critResult = resolveAttackCriticals({
			initialDie,
			confirmDie,
			tableDie,
			isExplosive,
			hasFogoNoCeu
		});

		const damageStrategy = DAMAGE_MODE_STRATEGIES[mode] || DAMAGE_MODE_STRATEGIES.fixed;
		const damageOutput = await damageStrategy({
			dmg,
			isPain,
			bonusDamage: critResult.bonusDamage
		});

		let extraInfo = "";
		if (reload > 0 && (itemData.attributes.ammo?.max || 0) > 0) {
			const reloadLabel = localize("SACRAMENTO_RPG.Chat.ReloadActions");
			extraInfo += `<p><strong>${reloadLabel}:</strong> ${reload}</p>`;
		}
		if (slots > 0) {
			const slotsLabel = localize("SACRAMENTO_RPG.Chat.SlotsOccupied");
			extraInfo += `<p><strong>${slotsLabel}:</strong> ${slots}</p>`;
		}

		return {
			attack: {
				renderedRoll: await attackRoll.render(),
				criticalHit: critResult.isCriticalHit,
				criticalMiss: critResult.isCriticalMiss,
				criticalEffect: critResult.criticalEffect
			},
			damageFixedHtml: damageOutput.damageFixedHtml,
			damageRolls: damageOutput.damageRolls,
			damageOriginalText: dmg,
			extraInfo
		};
	}

	async _executeItemRoll(mode = "fixed") {
		const speaker = ChatMessage.getSpeaker({ actor: this.actor });
		const rollMode = game.settings.get("core", "rollMode");

		const chatContext = {
			item: this,
			mode,
			additionalInfo: "",
			damageFixedHtml: ""
		};

		if (this.type === "weapon") {
			const ammoResult = await this._consumeWeaponAmmo();
			if (!ammoResult.canProceed) return;
			chatContext.additionalInfo += ammoResult.infoHtml;

			const weaponResult = await this._rollWeaponAttack(mode);
			chatContext.attack = weaponResult.attack;
			chatContext.damageFixedHtml = weaponResult.damageFixedHtml;
			chatContext.damageRolls = weaponResult.damageRolls;
			chatContext.damageOriginalText = weaponResult.damageOriginalText;
			chatContext.additionalInfo += weaponResult.extraInfo;
		} else if (ITEM_CHAT_STRATEGIES[this.type]) {
			ITEM_CHAT_STRATEGIES[this.type](this.system, chatContext);
		}

		const html = await renderTemplate("systems/sacramento-rpg/templates/chat/attack-roll.hbs", chatContext);

		await ChatMessage.create({
			speaker,
			rollMode,
			content: html
		});
	}
}
