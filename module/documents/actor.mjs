/**
 * Estende a classe base Actor para definir lógica específica do Sacramento RPG.
 * @extends {Actor}
 */
export class SacramentoRPGActor extends Actor {
	/** @override */
	prepareData() {
		// Prepara os dados do ator. O super.prepareData() executa a ordem padrão:
		// data reset -> prepareBaseData() -> prepareEmbeddedDocuments() -> prepareDerivedData().
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {
		// Modificações aqui ocorrem ANTES de processar itens ou dados derivados.
		// Útil para garantir valores iniciais.
	}

	/**
	 * @override
	 * Use esta etapa para calcular dados baseados
	 * em outros dados (ex: HP = Físico + 6).
	 * Dados calculados aqui NÃO devem existir no template.json/DataModel como campos salvos,
	 * pois eles são recalculados toda vez que a ficha abre.
	 */
	prepareDerivedData() {
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.sacramentorpg || {}; // eslint-disable-line no-unused-vars

		// Separa métodos para Personagens e NPCs
		this._prepareCharacterData(actorData);
		this._prepareNpcData(actorData);

		// Calculate backpack slots
		let currentSlots = 0;
		for (const item of this.items) {
			if (item.type === "weapon" || item.type === "equipment" || item.type === "consumable") {
				const isEquipped = item.system.attributes?.isEquipped?.value;
				if (!isEquipped) {
					currentSlots += item.system.attributes?.slots?.value || 0;
				}
			}
		}
		systemData.slots = {
			value: currentSlots,
			max: 10
		};
	}

	/**
	 * Prepara dados específicos de Personagens (Jogadores)
	 */
	_prepareCharacterData(actorData) {
		if (actorData.type !== "character") return;

		const systemData = actorData.system;
		const abilities = systemData.abilities;
		const attributes = systemData.attributes;

		const fisVal = abilities.fis?.value || 0;
		const velVal = abilities.vel?.value || 0;
		// const intVal = abilities.int?.value || 0;
		const corVal = abilities.cor?.value || 0;
		const level = attributes.level?.value || 1;

		/** Definição de atributos do PJ */
		if (systemData.health) {
			let maxHP = 6 + fisVal; // Level 1 base
			if (level >= 2) maxHP += Math.max(1, fisVal);
			if (level >= 4) maxHP += Math.max(1, fisVal);
			if (level >= 5) maxHP += Math.max(1, fisVal);
			if (level >= 6) maxHP += 3;

			systemData.health.max = maxHP;
		}
		if (attributes.moviment) {
			attributes.moviment.value = Math.max(1, velVal);
		}
		if (attributes.actions) {
			attributes.actions.value = Math.max(1, corVal);
		}
		if (systemData.mount) {
			const res = systemData.mount.resistencia?.value || 0;
			systemData.mount.health.max = 6 + res;
		}
		// Calculo de Modificadores
		for (const ability of Object.values(systemData.abilities)) {
			ability.mod = ability.value;
		}
	}

	/**
	 * Prepara dados específicos de NPCs
	 */
	_prepareNpcData(actorData) {
		if (actorData.type !== "npc") return;

		const systemData = actorData.system;

		const ndc = systemData.attributes.cr?.value || 1;
		const isSpecial = systemData.attributes.isSpecial?.value || false;

		// REGRAS COMUNS (Valem para os dois)

		if (systemData.pain) systemData.pain.max = 6;
		if (systemData.attributes.defense) systemData.attributes.defense.value = 5;

		//  REGRAS ESPECÍFICAS

		if (isSpecial) {
			systemData.health.max = ndc * 6;
			if (systemData.attributes.actions) {
				systemData.attributes.actions.value = ndc + 3;
			}
		} else {
			// NPC COMUM
			systemData.health.max = ndc * 3;
			if (systemData.attributes.actions) {
				systemData.attributes.actions.value = ndc + 1;
			}
		}
	}

	/**
	 * Dor e Vida
	 * @override
	 */
	async _preUpdate(changed, options, user) {
		await super._preUpdate(changed, options, user);

		const newPain = foundry.utils.getProperty(changed, "system.pain.value");

		if (newPain !== undefined) {
			// Se a dor chegou a 0 ou menos
			if (newPain <= 0) {
				const currentLife = this.system.health.value;
				const maxPain = this.system.pain.max || 6;

				// 1. Reduz 1 ponto de Vida
				if (currentLife > 0) {
					changed["system.health.value"] = currentLife - 1;
				}

				// 2. Reseta a Dor para o máximo original
				changed["system.pain.value"] = maxPain;
			}
		}

		const newMountPain = foundry.utils.getProperty(changed, "system.mount.pain.value");
		if (newMountPain !== undefined) {
			if (newMountPain <= 0) {
				const currentMountLife = this.system.mount?.health?.value || 0;
				const maxMountPain = this.system.mount?.pain?.max || 6;

				if (currentMountLife > 0) {
					changed["system.mount.health.value"] = currentMountLife - 1;
				}

				changed["system.mount.pain.value"] = maxMountPain;
			}
		}
	}

	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		// Começa copiando tudo que está em system (abilities, attributes, etc)
		const data = { ...this.system };

		// Prepara atalhos específicos para Personagem e NPC
		this._getCharacterRollData(data);
		this._getNpcRollData(data);

		return data;
	}

	/**
	 * Prepara dados de rolagem para Personagens.
	 */
	_getCharacterRollData(data) {
		if (this.type !== "character") return;

		// Copia os atributos (fis, vel, int, cor) para o nível superior.
		// Isso permite usar fórmulas como "1d6 + @fis" ao invés de "1d6 + @abilities.fis.value"
		if (data.abilities) {
			for (const [k, v] of Object.entries(data.abilities)) {
				// k será 'fis', 'vel', etc.
				// v será o objeto { value: 3, label: "Físico", mod: 3 }
				data[k] = foundry.utils.deepClone(v);
			}
		}

		// Adiciona atalho para Nível (@lvl)
		if (data.attributes.level) {
			data.lvl = data.attributes.level.value ?? 0;
		}
	}

	/**
	 * Prepara dados de rolagem para NPCs.
	 */
	_getNpcRollData(data) {
		if (this.type !== "npc") return;

		// Cria o atalho @ndc para usar nas fórmulas de ataque dos monstros
		// A regra é "1d6 + NdC", então precisamos facilitar esse acesso.
		if (data.attributes.cr) {
			data.ndc = data.attributes.cr.value ?? 0;
		}
	}
}
