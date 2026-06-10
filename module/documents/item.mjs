/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class SacramentoRPGItem extends Item {
	/**
	 * Prepara dados derivados.
	 * Útil se você quiser calcular peso total (peso * quantidade) ou outras regras de item.
	 */
	prepareData() {
		super.prepareData();
	}

	/**
	 * Prepare a data object which defines the data schema used by dice roll commands against this Item
	 * @override
	 */
	getRollData() {
		// Starts off by populating the roll data with a shallow copy of `this.system`
		const rollData = { ...this.system };
		// Quit early if there's no parent actor
		if (!this.actor) return rollData;
		// If present, add the actor's roll data
		rollData.actor = this.actor.getRollData();
		return rollData;
	}

	/**
	 * Lida com o clique no item.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async roll() {
		const item = this;
		const itemData = item.system;
		const actor = item.actor;

		// Inicializa dados básicos do chat
		const speaker = ChatMessage.getSpeaker({ actor: actor });
		const rollMode = game.settings.get("core", "rollMode");
		let label = `<b>${item.name}</b>`;

		// Logica de munição
		if (item.type === "weapon") {
			let ammoVal = itemData.attributes.ammo?.value || 0;
			const ammoMax = itemData.attributes.ammo?.max || 0;
			// Se a arma usa munição (Max > 0)
			if (ammoVal) {
				if (ammoVal <= 0) {
					ui.notifications.warn(`A arma ${item.name} está sem munição!`);
					return; // Cancela a ação
				}
				// Gasta a munição
				ammoVal--;
				// Atualiza o item
				await item.update({ "system.attributes.ammo.value": ammoVal });
				label += ` <span style="font-size: 0.8em; color: #555;">(Bala gasta: ${ammoVal}/${ammoMax})</span>`;
			}
		}

		// Card
		let content = `
    <div class="sacramento-chat-card">
        <div class="card-description" style="font-style: italic; margin-bottom: 5px;">${itemData.description ?? ""}</div>
        <hr>
    `;

		// Exibir armas
		if (item.type === "weapon") {
			const dmg = itemData.attributes.damage?.value || 0;
			const reload = itemData.attributes.reload?.value || 0;
			const slots = itemData.attributes.slots?.value || 0;

			if (dmg > 0) content += `<p><strong>Dano:</strong> ${dmg}</p>`;
			if (reload > 0) content += `<p><strong>Ação(ões) para Recarregar:</strong> ${reload}</p>`;
			if (slots > 0) content += `<p><strong>Espaços ocupados:</strong> ${slots}</p>`;
		}

		// Exibir equipamento
		else if (item.type === "equipment") {
			const slots = itemData.attributes.slots?.value || 0;
			const effect = itemData.attributes.effect?.value || "";

			content += `<p><strong>Espaços ocupados:</strong> ${slots}</p>`;
			if (effect) {
				content += `
            <div style="border-left: 3px solid #4a90e2; padding-left: 5px; margin-top: 5px; color: #444;">
               <strong>Efeito:</strong> ${effect}
            </div>`;
			}
		}

		// Exibir consumível
		else if (item.type === "consumable") {
			const slots = itemData.attributes.slots?.value || 0;
			const effect = itemData.attributes.effect?.value || "";
			const qtd = itemData.attributes.quantity?.value || 1;

			content += `<p><strong>Quantidade:</strong> ${qtd} | <strong>Espaços ocupados:</strong> ${slots}</p>`;
			if (effect) {
				content += `
            <div style="border-left: 3px solid #e24a4a; padding-left: 5px; margin-top: 5px; color: #444;">
               <strong>Efeito:</strong> ${effect}
            </div>`;
			}
		}

		content += `</div>`;

		// If there's no roll data, send a chat message.
		ChatMessage.create({
			speaker: speaker,
			rollMode: rollMode,
			flavor: label,
			content: content
		});
	}
}
