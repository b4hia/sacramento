/**
 * Gerencia interações com botões de Efeitos Ativos na ficha.
 * @param {MouseEvent} event      O clique
 * @param {Actor|Item} owner      O dono do efeito
 */
export function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest('li');
  const effect = li.dataset.effectId
    ? owner.effects.get(li.dataset.effectId)
    : null;
  switch (a.dataset.action) {
    case 'create':
      return owner.createEmbeddedDocuments('ActiveEffect', [
        {
          name: game.i18n.format('DOCUMENT.New', {
            type: game.i18n.localize('DOCUMENT.ActiveEffect'),
          }),
          icon: 'icons/svg/aura.svg',
          origin: owner.uuid,
          'duration.rounds':
            li.dataset.effectType === 'temporary' ? 1 : undefined,
          disabled: li.dataset.effectType === 'inactive',
        },
      ]);
    case 'edit':
      return effect.sheet.render(true);
    case 'delete':
      return effect.delete();
    case 'toggle':
      return effect.update({ disabled: !effect.disabled });
  }
}

/**
 * Prepara as categorias para exibir na ficha (Temporário, Passivo, Inativo).
 * @param {ActiveEffect[]} effects    Lista de efeitos
 * @return {object}                   Dados organizados
 */
export function prepareActiveEffectCategories(effects) {
  // Define as categorias do cabeçalho
  const categories = {
    temporary: {
      type: 'temporary',
      label: game.i18n.localize('SACRAMENTO_RPG.Effect.Temporary'),
      effects: [],
    },
    passive: {
      type: 'passive',
      label: game.i18n.localize('SACRAMENTO_RPG.Effect.Passive'),
      effects: [],
    },
    inactive: {
      type: 'inactive',
      label: game.i18n.localize('SACRAMENTO_RPG.Effect.Inactive'),
      effects: [],
    },
  };

  // Itera sobre os efeitos e os classifica
  for (let e of effects) {
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}
