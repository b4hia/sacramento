export class SacramentoRPGCombat extends Combat {
	/**
	 * Override the default rollInitiative to use Cards
	 * @override
	 */
	async rollInitiative(ids, { updateTurn = true, messageOptions = {} } = {}) {
		const deckName = "Iniciativa";
		const deck = game.cards.getName(deckName);

		if (!deck) {
			ui.notifications.error(
				`O baralho "${deckName}" não foi encontrado. Por favor, crie um "Deck" de cartas tradicionais com este exato nome para a Iniciativa.`
			);
			return super.rollInitiative(ids, { formula: "1d20", updateTurn, messageOptions });
		}

		const updates = [];
		const messages = [];

		// Map card suits to decimal tie breakers (Spades > Hearts > Diamonds > Clubs)
		const suitDecimals = {
			spades: 0.4,
			hearts: 0.3,
			diamonds: 0.2,
			clubs: 0.1
		};

		for (const id of ids) {
			const combatant = this.combatants.get(id);
			if (!combatant) continue;

			// Get available cards
			let availableCards = deck.cards.filter((c) => !c.drawn);
			if (availableCards.length === 0) {
				ui.notifications.info(`Baralho "${deckName}" está vazio. Embaralhando automaticamente...`);
				await deck.recall();
				availableCards = deck.cards.filter((c) => !c.drawn);
			}

			// Draw a random card
			const randomIndex = Math.floor(Math.random() * availableCards.length);
			const card = availableCards[randomIndex];

			// Mark as drawn so we don't draw it again until shuffled
			await card.update({ drawn: true });

			// Determine numeric value
			let value = card.value || 0;
			const face = card.faces && card.faces.length > 0 ? card.faces[0].name?.toLowerCase() : card.name.toLowerCase();

			if (face && face.includes("ace")) value = 14;
			else if (face && face.includes("jack")) value = 11;
			else if (face && face.includes("queen")) value = 12;
			else if (face && face.includes("king")) value = 13;
			else if (value === 1) value = 14; // Fallback se 'value' for 1 (As)

			// Determine suit for tie breakers
			let suitName = card.suit || "";
			if (!suitName && card.name) {
				if (card.name.toLowerCase().includes("spades")) suitName = "spades";
				if (card.name.toLowerCase().includes("hearts")) suitName = "hearts";
				if (card.name.toLowerCase().includes("diamonds")) suitName = "diamonds";
				if (card.name.toLowerCase().includes("clubs")) suitName = "clubs";
			}

			const suitDecimal = suitDecimals[suitName] || 0.0;
			const initiativeScore = value + suitDecimal;

			updates.push({ _id: id, initiative: initiativeScore });

			// Build chat message
			const cardImg = card.faces && card.faces.length > 0 ? card.faces[0].img : card.img;

			messages.push({
				speaker: { alias: combatant.name },
				content: `
          <div class="sacramento-chat-card" style="background-color: #e8dcc4; padding: 10px; border: 3px solid #2c1a11; border-radius: 5px;">
            <h3 style="font-family: 'Rye', cursive; border-bottom: 2px solid #5c3a21; text-align: center; color: #2c1a11; margin-top: 0;">Iniciativa</h3>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 10px;">
              <img src="${cardImg}" width="80" style="border: 2px solid #5c3a21; border-radius: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.5);"/>
              <p style="margin-top: 10px; font-weight: bold; font-family: 'Playfair Display', serif; color: #2c1a11; text-align: center;">${card.name}</p>
              <div style="font-size: 24px; font-family: 'Rye', cursive; color: #8b0000; background: rgba(255,255,255,0.5); padding: 5px 15px; border-radius: 3px; border: 1px dashed #8b0000;">
                Valor: ${initiativeScore.toFixed(1)}
              </div>
            </div>
          </div>
        `
			});
		}

		if (updates.length) {
			await this.updateEmbeddedDocuments("Combatant", updates);
		}

		if (messages.length) {
			await ChatMessage.create(messages);
		}

		if (updateTurn) {
			await this.update({ turn: 0 });
		}

		return this;
	}
}
