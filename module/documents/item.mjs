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
    const rollMode = game.settings.get('core', 'rollMode');
    let label = `<b>${item.name}</b>`;

    // Logica de munição
    if (item.type === 'weapon') {
        let ammoVal = itemData.attributes.ammo?.value || 0;
        // Se a arma usa munição (Max > 0)
        if (ammoVal){
          if (ammoVal <= 0) {
            ui.notifications.warn(`A arma ${item.name} está sem munição!`);
            return; // Cancela a ação
          }
          // Gasta a munição
          ammoVal--; 
          // Atualiza o item
          await item.update({"system.attributes.ammo.value": ammoVal});
          label += ` <span style="font-size: 0.8em; color: #555;">(Bala gasta: ${ammoVal}/${ammoMax})</span>`;
        }
    }

    // Card
    let content = `
    <div class="sacramento-chat-card">
        <div class="card-description" style="font-style: italic; margin-bottom: 5px;">${itemData.description ?? ''}</div>
        <hr>
    `;

    // Exibir armas
    if (item.type === 'weapon') {
        const painDmg = itemData.attributes.painDamage?.value || 0;
        const lifeDmg = itemData.attributes.lifeDamage?.value || 0;
        const dmgDist = itemData.attributes.damageDist?.value || 0;
        const reload = itemData.attributes.reload?.value || 0;
        const range = itemData.attributes.range?.value || 9;
        const specialEffect = itemData.attributes.special?.value || "";
        const slots = itemData.attributes.slots?.value || 0;

        if (painDmg > 0) content +=`<p>strong> Círculos de Dor:${painDmg}</strong></p>`;
        if (lifeDmg > 0) content +=`<p>strong> Círculos de Vida:${lifeDmg}</strong></p>`;
        if (dmgDist > 0) content += `<p>strong> Dano (Perto):${dmgDist}</strong</p>`;
        if (reload > 0)  content += `<p>strong> Ação(ões) para Recarregar:${reload}</strong></p>`;
        if (range > 0) content += `<p>Alcance: ${range}m</p>`
        if (specialEffect) {
             content += `<div style="background-color: #333; color: #fff; padding: 3px; margin-top: 5px; border-radius: 3px; font-size: 0.9em;"><strong>Efeito:</strong> ${specialEffect}</div>`;
        }
        if (slots > 0){
          content +=`<p>Espaços ocupados: ${slots}</p>`
        }
    }

    // Exibir equipamento
    else if (item.type === 'equipament') {
        const slots = itemData.attributes.slots?.value || 0;
        const price = itemData.attributes.price?.value || 0;
        const modifiers = itemData.attributes.modifiers?.value || "";

        content += `<p><strong>Espaços ocupados:</strong> ${slots} | <strong>Preço:</strong> $${price}</p>`;
        if (modifiers) {
            content += `
            <div style="border-left: 3px solid #4a90e2; padding-left: 5px; margin-top: 5px; color: #444;">
               <strong>Modificadores:</strong> ${modifiers}
            </div>`;
        }
    }

    content += `</div>`;

    // If there's no roll data, send a chat message.
    ChatMessage.create({
      speaker: speaker,
      rollMode: rollMode,
      flavor: label,
      content: item.system.description ?? '',
    });
  }
}
