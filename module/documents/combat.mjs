import { format, localize } from "../helpers/i18n.mjs";
import { calculateCardInitiative } from "../rules/initiative.mjs";

export class SacramentoRPGCombat extends Combat {
	/** @override */
	async rollInitiative(ids, { updateTurn = true, messageOptions = {} } = {}) {
		const deckName = localize("SACRAMENTO_RPG.Combat.DeckName");
		const deck = game.cards.getName(deckName);

		if (!deck) {
			ui.notifications.error(format("SACRAMENTO_RPG.Combat.DeckNotFound", { deckName }));
			return super.rollInitiative(ids, { formula: "1d20", updateTurn, messageOptions });
		}

		const updates = [];
		const messages = [];

		for (const id of ids) {
			const combatant = this.combatants.get(id);
			if (!combatant) continue;

			let availableCards = deck.cards.filter((c) => !c.drawn);
			if (availableCards.length === 0) {
				ui.notifications.info(format("SACRAMENTO_RPG.Combat.DeckEmptyShuffling", { deckName }));
				await deck.recall();
				availableCards = deck.cards.filter((c) => !c.drawn);
			}

			const randomIndex = Math.floor(Math.random() * availableCards.length);
			const card = availableCards[randomIndex];

			await card.update({ drawn: true });

			const initiativeScore = calculateCardInitiative(card);
			updates.push({ _id: id, initiative: initiativeScore });

			const cardImg = card.faces && card.faces.length > 0 ? card.faces[0].img : card.img;
			const initTitle = localize("SACRAMENTO_RPG.Combat.InitiativeTitle");
			const initScoreText = format("SACRAMENTO_RPG.Combat.InitiativeScore", {
				score: initiativeScore.toFixed(1)
			});

			messages.push({
				speaker: { alias: combatant.name },
				content: `
          <div class="sacramento-chat-card initiative-card">
            <h3 class="initiative-title">${initTitle}</h3>
            <div class="initiative-body">
              <img src="${cardImg}" width="80" class="initiative-card-img"/>
              <p class="initiative-card-name">${card.name}</p>
              <div class="initiative-score-badge">
                ${initScoreText}
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
