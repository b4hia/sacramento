// Registers Foundry VTT v11/v12+ TypeDataModel schemas when available while preserving template.json compatibility.
export function registerDataModels() {
	const TypeDataModel = globalThis.foundry?.abstract?.TypeDataModel;
	const fields = globalThis.foundry?.data?.fields;
	if (!TypeDataModel || !fields) return;

	const { SchemaField, NumberField, StringField, BooleanField, HTMLField } = fields;

	const createBaseActorSchema = () => ({
		health: new SchemaField({
			value: new NumberField({ initial: 6, integer: true, min: 0 }),
			min: new NumberField({ initial: 0, integer: true }),
			max: new NumberField({ initial: 6, integer: true, min: 0 })
		}),
		pain: new SchemaField({
			value: new NumberField({ initial: 6, integer: true, min: 0 }),
			min: new NumberField({ initial: 0, integer: true }),
			max: new NumberField({ initial: 6, integer: true, min: 0 })
		}),
		biography: new HTMLField({ initial: "" }),
		bio: new SchemaField({
			characteristics: new HTMLField({ initial: "" }),
			past: new HTMLField({ initial: "" }),
			motivation: new StringField({ initial: "" }),
			howToAchieve: new StringField({ initial: "" }),
			whyAchieve: new StringField({ initial: "" }),
			notes: new HTMLField({ initial: "" })
		})
	});

	class CharacterData extends TypeDataModel {
		static defineSchema() {
			return {
				...createBaseActorSchema(),
				attributes: new SchemaField({
					playerName: new SchemaField({ value: new StringField({ initial: "" }) }),
					level: new SchemaField({ value: new NumberField({ initial: 1, integer: true, min: 1 }) }),
					xp: new SchemaField({
						value: new NumberField({ initial: 0, integer: true, min: 0 }),
						max: new NumberField({ initial: 10, integer: true, min: 0 })
					}),
					movement: new SchemaField({ value: new NumberField({ initial: 1, integer: true, min: 0 }) }),
					actions: new SchemaField({ value: new NumberField({ initial: 1, integer: true, min: 0 }) }),
					defense: new SchemaField({ value: new NumberField({ initial: 5, integer: true, min: 0 }) })
				}),
				slots: new SchemaField({
					value: new NumberField({ initial: 0, min: 0 }),
					max: new NumberField({ initial: 10, min: 0 })
				}),
				currency: new SchemaField({ value: new NumberField({ initial: 200 }) }),
				reputation: new SchemaField({ value: new NumberField({ initial: 0 }) }),
				abilities: new SchemaField({
					fis: new SchemaField({
						value: new NumberField({ initial: 0, integer: true }),
						mod: new NumberField({ initial: 0, integer: true })
					}),
					vel: new SchemaField({
						value: new NumberField({ initial: 0, integer: true }),
						mod: new NumberField({ initial: 0, integer: true })
					}),
					int: new SchemaField({
						value: new NumberField({ initial: 0, integer: true }),
						mod: new NumberField({ initial: 0, integer: true })
					}),
					cor: new SchemaField({
						value: new NumberField({ initial: 0, integer: true }),
						mod: new NumberField({ initial: 0, integer: true })
					})
				}),
				antecedents: new SchemaField({
					atencao: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					medicina: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					montaria: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					negocios: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					roubo: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					suor: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					tradicao: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					violencia: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) })
				}),
				redemption: new SchemaField({
					step1: new SchemaField({
						text: new StringField({ initial: "" }),
						checked: new BooleanField({ initial: false })
					}),
					step2: new SchemaField({
						text: new StringField({ initial: "" }),
						checked: new BooleanField({ initial: false })
					}),
					step3: new SchemaField({
						text: new StringField({ initial: "" }),
						checked: new BooleanField({ initial: false })
					}),
					step4: new SchemaField({
						text: new StringField({ initial: "" }),
						checked: new BooleanField({ initial: false })
					}),
					step5: new SchemaField({
						text: new StringField({ initial: "" }),
						checked: new BooleanField({ initial: false })
					}),
					step6: new SchemaField({
						text: new StringField({ initial: "" }),
						checked: new BooleanField({ initial: false })
					})
				}),
				death: new SchemaField({
					success1: new BooleanField({ initial: false }),
					success2: new BooleanField({ initial: false }),
					success3: new BooleanField({ initial: false }),
					failure1: new BooleanField({ initial: false }),
					failure2: new BooleanField({ initial: false }),
					failure3: new BooleanField({ initial: false })
				}),
				mount: new SchemaField({
					name: new StringField({ initial: "" }),
					animal: new StringField({ initial: "" }),
					sex: new StringField({ initial: "" }),
					traits: new StringField({ initial: "" }),
					hasSaddlebag: new BooleanField({ initial: false }),
					interactions: new SchemaField({
						fed: new BooleanField({ initial: false }),
						talked: new BooleanField({ initial: false }),
						played: new BooleanField({ initial: false }),
						brushed: new BooleanField({ initial: false })
					}),
					potency: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					endurance: new SchemaField({ value: new NumberField({ initial: 0, integer: true }) }),
					loyalty: new SchemaField({
						value: new NumberField({ initial: 0, integer: true, min: 0, max: 5 }),
						max: new NumberField({ initial: 5, integer: true })
					}),
					health: new SchemaField({
						value: new NumberField({ initial: 6, integer: true, min: 0 }),
						max: new NumberField({ initial: 6, integer: true, min: 0 })
					}),
					pain: new SchemaField({
						value: new NumberField({ initial: 6, integer: true, min: 0 }),
						max: new NumberField({ initial: 6, integer: true, min: 0 })
					}),
					hasWagon: new BooleanField({ initial: false }),
					slots: new SchemaField({
						value: new NumberField({ initial: 0, min: 0 }),
						max: new NumberField({ initial: 15, min: 0 })
					})
				})
			};
		}
	}

	class NpcData extends TypeDataModel {
		static defineSchema() {
			return {
				...createBaseActorSchema(),
				attributes: new SchemaField({
					cr: new SchemaField({ value: new NumberField({ initial: 1, integer: true, min: 1, max: 6 }) }),
					isSpecial: new SchemaField({ value: new BooleanField({ initial: false }) }),
					defense: new SchemaField({ value: new NumberField({ initial: 5, integer: true }) }),
					actions: new SchemaField({ value: new NumberField({ initial: 1, integer: true }) })
				}),
				slots: new SchemaField({
					value: new NumberField({ initial: 0, min: 0 }),
					max: new NumberField({ initial: 10, min: 0 })
				})
			};
		}
	}

	class WeaponData extends TypeDataModel {
		static defineSchema() {
			return {
				description: new HTMLField({ initial: "" }),
				attributes: new SchemaField({
					damage: new SchemaField({ value: new StringField({ initial: "1" }) }),
					optionalDamage: new SchemaField({ value: new StringField({ initial: "" }) }),
					ammo: new SchemaField({
						value: new NumberField({ initial: 0, integer: true, min: 0 }),
						max: new NumberField({ initial: 6, integer: true, min: 0 })
					}),
					reload: new SchemaField({ value: new NumberField({ initial: 1, integer: true, min: 0 }) }),
					slots: new SchemaField({ value: new NumberField({ initial: 1, min: 0 }) }),
					isEquipped: new SchemaField({ value: new BooleanField({ initial: false }) }),
					isMountItem: new SchemaField({ value: new BooleanField({ initial: false }) }),
					weaponType: new SchemaField({ value: new StringField({ initial: "revolver" }) }),
					ammoType: new SchemaField({ value: new StringField({ initial: "" }) }),
					range: new SchemaField({ value: new StringField({ initial: "perto" }) }),
					price: new SchemaField({ value: new NumberField({ initial: 0, min: 0 }) })
				})
			};
		}
	}

	class EquipmentData extends TypeDataModel {
		static defineSchema() {
			return {
				description: new HTMLField({ initial: "" }),
				attributes: new SchemaField({
					effect: new SchemaField({ value: new StringField({ initial: "" }) }),
					slots: new SchemaField({ value: new NumberField({ initial: 1, min: 0 }) }),
					isEquipped: new SchemaField({ value: new BooleanField({ initial: false }) }),
					isMountItem: new SchemaField({ value: new BooleanField({ initial: false }) }),
					equipType: new SchemaField({ value: new StringField({ initial: "none" }) }),
					price: new SchemaField({ value: new NumberField({ initial: 0, min: 0 }) })
				})
			};
		}
	}

	class ConsumableData extends TypeDataModel {
		static defineSchema() {
			return {
				description: new HTMLField({ initial: "" }),
				attributes: new SchemaField({
					effect: new SchemaField({ value: new StringField({ initial: "" }) }),
					slots: new SchemaField({ value: new NumberField({ initial: 1, min: 0 }) }),
					quantity: new SchemaField({ value: new NumberField({ initial: 1, integer: true, min: 0 }) }),
					ammoCategory: new SchemaField({ value: new StringField({ initial: "none" }) }),
					isMountItem: new SchemaField({ value: new BooleanField({ initial: false }) }),
					isEquipped: new SchemaField({ value: new BooleanField({ initial: false }) }),
					price: new SchemaField({ value: new NumberField({ initial: 0, min: 0 }) })
				})
			};
		}
	}

	class AbilityData extends TypeDataModel {
		static defineSchema() {
			return {
				description: new HTMLField({ initial: "" }),
				attributes: new SchemaField({
					slug: new SchemaField({ value: new StringField({ initial: "" }) })
				})
			};
		}
	}

	CONFIG.Actor.dataModels = {
		character: CharacterData,
		npc: NpcData
	};

	CONFIG.Item.dataModels = {
		weapon: WeaponData,
		equipment: EquipmentData,
		consumable: ConsumableData,
		ability: AbilityData
	};
}
