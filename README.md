# Sacramento RPG — Foundry VTT System

[![CI](https://github.com/b4hia/sacramento/actions/workflows/ci.yml/badge.svg)](https://github.com/b4hia/sacramento/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.txt)
[![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v11%2B-orange)](https://foundryvtt.com/)

> **[Leia em Português (README.pt-BR.md)](./README.pt-BR.md)**

An **unofficial**, fan-made integration that lets you play **Sacramento RPG**, published by **Jambô Editora**, on [Foundry Virtual Tabletop](https://foundryvtt.com/).

> [!IMPORTANT]
> **This project is not a rulebook.** It does not present, teach or reproduce the rules, setting or lore of Sacramento RPG. It only provides sheets and automations so a group that already knows the game can play it on Foundry VTT.
>
> To learn and understand the rules, **you need the official rulebook**, available from [Jambô Editora](https://jamboeditora.com.br/).
>
> **Sacramento RPG**, its rules, setting, texts and artwork are the intellectual property of **Jambô Editora** and its authors. This repository is not affiliated with or endorsed by Jambô Editora.

---

## What this system provides

- **Character and NPC sheets** with a Western / Cordel visual theme.
- **Automatic derived values:** the sheet fills in values the rulebook derives from other fields, so you don't have to calculate them by hand.
- **Sheet warnings** during character creation and level-up when points are missing, over-spent, or when inventory is over capacity.
- **Mount tab** on the character sheet, with a separate mount inventory.
- **Card-based initiative** using a Foundry VTT Card Stack.
- **Chat cards** for attacks, criticals, reloading and death saves.
- **Compendiums** with weapons, equipment, consumables and abilities, as quick references for use at the table.
- **Bilingual interface** (Portuguese and English), with English compendium translations through the [Babele](https://foundryvtt.com/packages/babele) module.

The system intentionally deviates from the printed rulebook in a few places. Every difference is listed in **[House Rules (`docs/HOUSE_RULES.md`)](./docs/HOUSE_RULES.md)**.

---

## Installation

### Via Foundry VTT Manifest URL (Recommended)
1. Open **Foundry VTT** and go to the **Game Systems** tab.
2. Click **Install System** at the bottom.
3. Paste the following URL into the **Manifest URL** field:
   ```text
   https://github.com/b4hia/sacramento/releases/latest/download/system.json
   ```
4. Click **Install**.

---

## Documentation

- **[Usage Guide (`docs/GUIDE.md`)](./docs/GUIDE.md):** How to set up your world and use the sheets in Foundry VTT.
- **[House Rules (`docs/HOUSE_RULES.md`)](./docs/HOUSE_RULES.md):** What this system changes compared to the printed rulebook.
- **[Contributing (`CONTRIBUTING.md`)](./CONTRIBUTING.md):** Development setup, testing and coding standards.
- **[Credits & Licenses (`CREDITS.md`)](./CREDITS.md):** Attributions and intellectual property notices.
