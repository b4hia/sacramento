import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import { isValidCommitMessage } from "../utils/verify-commit-msg.mjs";
import { migrateActorData } from "../module/helpers/migration.mjs";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const templateJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "template.json"), "utf8"));
const systemJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "system.json"), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"));

function buildMergedSchema(entityGroup, subType) {
	const group = templateJson[entityGroup];
	const typeDef = group[subType] || {};
	const merged = {};

	if (Array.isArray(typeDef.templates)) {
		for (const tplName of typeDef.templates) {
			Object.assign(merged, structuredClone(group.templates[tplName] || {}));
		}
	}

	const copy = structuredClone(typeDef);
	delete copy.templates;
	return deepMerge(merged, copy);
}

function deepMerge(target, source) {
	const out = { ...target };
	for (const [key, val] of Object.entries(source)) {
		if (
			val
			&& typeof val === "object"
			&& !Array.isArray(val)
			&& typeof out[key] === "object"
			&& out[key] !== null
		) {
			out[key] = deepMerge(out[key], val);
		} else {
			out[key] = val;
		}
	}
	return out;
}

function hasPathInObject(obj, dotPath) {
	const parts = dotPath.split(".");
	let current = obj;
	for (const part of parts) {
		if (current === null || typeof current !== "object" || !(part in current)) {
			return false;
		}
		current = current[part];
	}
	return true;
}

function listFilesRecursively(dir, ext) {
	const results = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...listFilesRecursively(fullPath, ext));
		} else if (entry.name.endsWith(ext)) {
			results.push(fullPath);
		}
	}
	return results;
}

describe("Sacramento RPG — Data & Schema Validation", () => {
	it("validates that every Handlebars system.* binding maps to template.json or derived runtime data", () => {
		const actorSchemas = [buildMergedSchema("Actor", "character"), buildMergedSchema("Actor", "npc")];
		const itemSchemas = [
			buildMergedSchema("Item", "weapon"),
			buildMergedSchema("Item", "ability"),
			buildMergedSchema("Item", "equipment"),
			buildMergedSchema("Item", "consumable")
		];
		const allSchemas = [...actorSchemas, ...itemSchemas];

		const derivedPaths = new Set(["attributes.movement.total", "mount.hasSaddlebag.max", "combat.actions"]);

		const hbsFiles = listFilesRecursively(path.join(ROOT_DIR, "templates"), ".hbs");
		const bindingRegex = /(?:name|target)="system\.([a-zA-Z0-9_.]+)"/g;

		for (const file of hbsFiles) {
			const content = fs.readFileSync(file, "utf8");
			const cleanContent = content.replace(/\{\{!--[\s\S]*?--\}\}/g, "");
			let match;
			while ((match = bindingRegex.exec(cleanContent)) !== null) {
				const dotPath = match[1];
				if (dotPath.includes("{{")) continue;
				const existsInSchema = allSchemas.some((schema) => hasPathInObject(schema, dotPath));
				const isDerived = derivedPaths.has(dotPath);
				assert.ok(
					existsInSchema || isDerived,
					`Unmapped binding "system.${dotPath}" in ${path.relative(ROOT_DIR, file)}`
				);
			}
		}
	});

	it("validates all packs-src/*.json entries against template.json item schemas and local icons", () => {
		const packsSrcDir = path.join(ROOT_DIR, "packs-src");
		const jsonFiles = fs.readdirSync(packsSrcDir).filter((f) => f.endsWith(".json"));
		assert.ok(jsonFiles.length > 0, "packs-src should contain JSON files");

		const itemSchemasByType = {
			weapon: buildMergedSchema("Item", "weapon"),
			ability: buildMergedSchema("Item", "ability"),
			equipment: buildMergedSchema("Item", "equipment"),
			consumable: buildMergedSchema("Item", "consumable")
		};

		for (const fileName of jsonFiles) {
			const fullPath = path.join(packsSrcDir, fileName);
			const entries = JSON.parse(fs.readFileSync(fullPath, "utf8"));
			assert.ok(Array.isArray(entries), `${fileName} must be a JSON array`);

			for (const entry of entries) {
				assert.ok(entry.name && typeof entry.name === "string", `Missing name in ${fileName}`);
				assert.ok(
					entry.type in itemSchemasByType,
					`Invalid item type "${entry.type}" in ${fileName} (${entry.name})`
				);
				assert.ok(entry.img && typeof entry.img === "string", `Missing img in ${fileName} (${entry.name})`);

				if (entry.img.startsWith("systems/sacramento-rpg/")) {
					const relIconPath = entry.img.replace("systems/sacramento-rpg/", "");
					const diskIconPath = path.join(ROOT_DIR, relIconPath);
					assert.ok(
						fs.existsSync(diskIconPath),
						`Missing icon file "${relIconPath}" referenced by "${entry.name}" in ${fileName}`
					);
				}

				const schema = itemSchemasByType[entry.type];
				for (const key of Object.keys(entry.system || {})) {
					assert.ok(
						key in schema,
						`Unknown system field "${key}" on "${entry.name}" (${entry.type}) in ${fileName}`
					);
				}
			}
		}
	});

	it("validates system.json metadata, version sync, and referenced files", () => {
		assert.equal(systemJson.id, "sacramento-rpg");
		assert.equal(systemJson.version, packageJson.version);
		assert.ok(systemJson.bugs.startsWith("https://github.com/"));
		assert.ok(systemJson.manifest.endsWith("/system.json"));
		assert.ok(systemJson.download.endsWith("/sacramento-rpg.zip"));
		assert.ok(Array.isArray(systemJson.esmodules) && systemJson.esmodules.length > 0);
		assert.ok(Array.isArray(systemJson.styles) && systemJson.styles.length > 0);
		assert.ok(Array.isArray(systemJson.languages) && systemJson.languages.length > 0);
		assert.ok(Array.isArray(systemJson.packs) && systemJson.packs.length === 5);

		for (const modPath of systemJson.esmodules) {
			assert.ok(fs.existsSync(path.join(ROOT_DIR, modPath)), `Missing esmodule: ${modPath}`);
		}
		for (const stylePath of systemJson.styles) {
			assert.ok(fs.existsSync(path.join(ROOT_DIR, stylePath)), `Missing style: ${stylePath}`);
		}
		for (const lang of systemJson.languages) {
			assert.ok(fs.existsSync(path.join(ROOT_DIR, lang.path)), `Missing language file: ${lang.path}`);
		}
		assert.ok(
			systemJson.languages.some((l) => l.lang === "pt-BR"),
			"system.json must declare 'pt-BR' for Brazilian Portuguese"
		);
		assert.equal(systemJson.compatibility?.verified, "12");
		assert.ok(
			systemJson.relationships?.recommends?.some((r) => r.id === "babele"),
			"system.json should recommend babele in relationships.recommends"
		);
	});

	it("validates YAML syntax for all GitHub workflows and configurations", () => {
		const ymlFiles = listFilesRecursively(path.join(ROOT_DIR, ".github"), ".yml");
		assert.ok(ymlFiles.length >= 4, "Expected GitHub workflow and config YAML files");
		for (const file of ymlFiles) {
			const relPath = path.relative(ROOT_DIR, file);
			const content = fs.readFileSync(file, "utf8");
			assert.doesNotThrow(() => yaml.load(content), `Invalid YAML in ${relPath}`);
		}
	});

	it("enforces zero inline style attributes across templates and module scripts", () => {
		const hbsFiles = listFilesRecursively(path.join(ROOT_DIR, "templates"), ".hbs");
		const mjsFiles = listFilesRecursively(path.join(ROOT_DIR, "module"), ".mjs");
		for (const file of [...hbsFiles, ...mjsFiles]) {
			const content = fs.readFileSync(file, "utf8");
			assert.equal(
				/\bstyle=/.test(content),
				false,
				`Inline style attribute found in ${path.relative(ROOT_DIR, file)}`
			);
		}
	});

	it("migrates legacy Portuguese Actor schema keys to English keys", () => {
		const legacyActor = {
			system: {
				attributes: {
					moviment: { value: 2 }
				},
				mount: {
					sexo: "Fêmea",
					caracteristicas: "Pelagem negra",
					bolsaDeCarga: true,
					comCarroca: true,
					potencia: { value: 2 },
					resistencia: { value: 1 },
					fidelidade: { value: 3, max: 5 },
					interacoes: {
						alimentou: true,
						conversou: false,
						brincou: true,
						escovou: false
					}
				}
			}
		};

		const updateData = migrateActorData(legacyActor);
		assert.equal(updateData["system.attributes.movement.value"], 2);
		assert.equal(updateData["system.attributes.-=moviment"], null);
		assert.equal(updateData["system.mount.sex"], "Fêmea");
		assert.equal(updateData["system.mount.traits"], "Pelagem negra");
		assert.equal(updateData["system.mount.hasSaddlebag"], true);
		assert.equal(updateData["system.mount.hasWagon"], true);
		assert.equal(updateData["system.mount.potency.value"], 2);
		assert.equal(updateData["system.mount.endurance.value"], 1);
		assert.equal(updateData["system.mount.loyalty.value"], 3);
		assert.equal(updateData["system.mount.loyalty.max"], 5);
		assert.equal(updateData["system.mount.interactions.fed"], true);
		assert.equal(updateData["system.mount.interactions.talked"], false);
		assert.equal(updateData["system.mount.interactions.played"], true);
		assert.equal(updateData["system.mount.interactions.brushed"], false);
		assert.equal(updateData["system.mount.-=interacoes"], null);
	});

	it("enforces Conventional Commits format", () => {
		assert.equal(isValidCommitMessage("feat(combat): add best-of-3 death save"), true);
		assert.equal(isValidCommitMessage("fix: resolve missing death schema"), true);
		assert.equal(isValidCommitMessage("refactor(rules)!: extract pure rules"), true);
		assert.equal(isValidCommitMessage("feature: invalid conventional type"), false);
		assert.equal(isValidCommitMessage("random commit message"), false);
	});
});
