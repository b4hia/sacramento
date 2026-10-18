# O que muda em relação ao livro (Regras da Casa & Adaptações)

> 🇺🇸 *This document details the intentional rule adaptations implemented in this Foundry VTT system compared to the printed Sacramento RPG rulebook.*

Este sistema implementa duas adaptações de design intencionais em relação ao livro básico de **Sacramento RPG**, pensadas para deixar o ritmo de combate mais dinâmico na mesa virtual e oferecer maior chance de sobrevivência dramática aos personagens, além de automações de qualidade de vida.

---

## 1. Movimentos e Ações de Combate (`Math.max(1, Atributo)`)

| Estatística | Regra do Livro Impresso | Regra Implementada no Sistema |
| :--- | :--- | :--- |
| **Movimentos por Turno** | `1 + Velocidade` | `Math.max(1, Velocidade)` |
| **Ações de Combate por Turno** | `1 + Coragem` | `Math.max(1, Coragem)` |

- **Comportamento no sistema:**
  - Um personagem com `Velocidade 0` ou `Velocidade 1` possui **1 Movimento** por turno; com `Velocidade 2`, possui **2 Movimentos**, e assim por diante.
  - Um personagem com `Coragem 0` ou `Coragem 1` possui **1 Ação de Combate** por turno; com `Coragem 2`, possui **2 Ações de Combate**, e assim por diante.
- **Motivação:** Mantém os turnos mais ágeis e táticos no VTT, evitando inflação de ações nos níveis iniciais.
- **Onde está no código:** [`calculateMovements`](../module/rules/progression.mjs) e [`calculateCombatActions`](../module/rules/progression.mjs).

---

## 2. Teste de Morte — Melhor de 3 (Par / Ímpar em `1d6`)

| Aspecto | Regra do Livro Impresso | Regra Implementada no Sistema |
| :--- | :--- | :--- |
| **Resolução** | Rolagem única de `1d6` (`1` ou `6` sobrevive com 1 de Vida; `2–5` morre) | **Melhor de 3** em `1d6`: **Par (`2, 4, 6`) = Sucesso**, **Ímpar (`1, 3, 5`) = Falha** |
| **Estabilização** | Volta com `1` Círculo de Vida | Ao acumular **3 Sucessos**, recupera **3 Círculos de Vida** e reseta as marcações |
| **Morte** | Imediata em `2, 3, 4, 5` | Ao acumular **3 Falhas** |

- **Comportamento no sistema:**
  - A ficha exibe 3 caixas de Sucesso (<i class="fas fa-check"></i>) e 3 caixas de Falha (<i class="fas fa-times"></i>) sincronizadas no banco (`system.death.success1..3` e `system.death.failure1..3`).
  - Clicar em **TESTE DE MORTE** rola `1d6`, marca automaticamente a próxima caixa correspondente e anuncia o resultado no chat.
- **Motivação:** Dá mais tensão dramática aos momentos em que um personagem cai em combate e permite que aliados tenham tempo de reagir antes de uma morte súbita.
- **Onde está no código:** [`resolveDeathSaveRoll`](../module/rules/deathSave.mjs).

---

## 3. Automações de Qualidade de Vida na Ficha

1. **Contagem Regressiva dos Círculos de Dor (`6` → `0`):**
   - Na ficha, a Dor começa em `6` (ileso) e diminui conforme o personagem sofre Dor.
   - Ao chegar em `0` (6º círculo preenchido), o sistema aplica automaticamente `-1` nos **Círculos de Vida** e restaura os **Círculos de Dor** para `6` ([`resolvePainOverflow`](../module/rules/inventory.mjs)).
2. **Desempate Decimal Automático no Baralho de Iniciativa:**
   - Para que o Combat Tracker do Foundry VTT ordene automaticamente empates de cartas pelo naipe sem intervenção manual, o sistema soma um decimal ao valor da carta (`2` a `14`):
     - **♠ Espadas (Spades):** `+0.4`
     - **♥ Copas (Hearts):** `+0.3`
     - **♦ Ouros (Diamonds):** `+0.2`
     - **♣ Paus (Clubs):** `+0.1`
3. **Prioridade de Recarga de Munição:**
   - Ao recarregar uma arma pelo botão da ficha, o sistema consome primeiro os pacotes de munição marcados como **Equipados** (Coldre/Bandoleira) antes de consumir pacotes guardados na mochila ([`calculateWeaponReload`](../module/rules/inventory.mjs)).

