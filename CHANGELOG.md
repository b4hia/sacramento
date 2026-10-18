# Changelog

All notable changes to this project will be documented in this file.

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