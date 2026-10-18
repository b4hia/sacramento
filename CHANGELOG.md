# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0](https://github.com/b4hia/sacramento/compare/v0.0.2...v0.1.0) (2026-10-18)


### Features

* **actor:** add death save roll and fix character and NPC sheets ([46a20b6](https://github.com/b4hia/sacramento/commit/46a20b6c3348a33e3d4b8356253bd1d1c4da2029))
* adicionando habilidades e estilizacao para ficha de PJ ([b75b937](https://github.com/b4hia/sacramento/commit/b75b937400a7eb3d9b7d81c2c4b9d00dc6b78ccb))
* adicionar configuracoes de montaria na ficha de pj ([17959d0](https://github.com/b4hia/sacramento/commit/17959d0de06bd3b8a1252c4b1f6c779cd5ad039f))
* **combat:** add attack chat cards and card-based initiative ([8be5604](https://github.com/b4hia/sacramento/commit/8be560429e6fbe0d9fd13be1e044a4e3a32ce642))
* **compendium:** ship prebuilt LevelDB packs with English translations ([6da906d](https://github.com/b4hia/sacramento/commit/6da906dd863a5ec51fa803c342cfdb898318f715))
* **data:** add TypeDataModels and migrate schema keys to English ([10e6f94](https://github.com/b4hia/sacramento/commit/10e6f94e686999cdf96cf75b7a2b4ed99a7f7cde))
* **i18n:** add complete Portuguese and English localization ([422d014](https://github.com/b4hia/sacramento/commit/422d014cd21c40a6915916dc7ff561c836e578cd))
* include new packs and compedium structure ([1e6ac88](https://github.com/b4hia/sacramento/commit/1e6ac883d525470fd77de2d3c6ae76086e133d2c))
* **item:** complete the item sheet with per-type detail partials ([5bc123d](https://github.com/b4hia/sacramento/commit/5bc123d5272d7a3bdcc0478e0b111afe440aa7a5))
* **rules:** extract derived values into pure rule modules ([58b62f2](https://github.com/b4hia/sacramento/commit/58b62f2446a9165165a68c44d97616ff589a3dd8))
* start developmente of sacramento core system for foundryvtt ([b250b33](https://github.com/b4hia/sacramento/commit/b250b334a5a42d6a0649a39e378a63182ed8ccea))


### Bug Fixes

* **test:** harden hardcoded-text check flagged by CodeQL ([6f96cca](https://github.com/b4hia/sacramento/commit/6f96ccad6f9e4c7956627eb86f8b656568055299))

## [0.0.2] - 2026-10-18

### Added
- Automated **Best-of-3 Death Save** roll (`1d6`: Even = Success, Odd = Failure; 3 successes restore 3 Life Circles and reset checkboxes).
- Pure business rule modules in `module/rules/` (`progression.mjs`, `npcStats.mjs`, `deathSave.mjs`, `inventory.mjs`, `initiative.mjs`, `criticals.mjs`).
- Automated unit, schema binding, compendium, and i18n validation test suites (`tests/rules.test.mjs`, `tests/validation.test.mjs`, `tests/i18n.test.mjs`).
- Full bilingual localization (`lang/pt_br.json` and `lang/en.json`) and English Babele compendium translations (`lang/babele/en/`).
- Pre-compiled LevelDB compendiums in `packs/` via `npm run build:packs`.
- GitHub Actions CI and Release workflows (`.github/workflows/ci.yml`, `.github/workflows/release.yml`).

### Fixed
- Fixed missing `system.death` schema in `template.json`.
- Fixed missing item sheet partials (`item-header.hbs`, `details-ability.hbs`) and broken icon paths in `packs-src/`.
- Fixed Level 1 Antecedents (`4 + Intellect`) and Mount initial attribute points (`3` base points) validation warnings.
