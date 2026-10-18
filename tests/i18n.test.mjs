import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const ptBr = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "lang/pt_br.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "lang/en.json"), "utf8"));
const templateJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "template.json"), "utf8"));

function flattenKeys(obj, prefix = "") {
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		const nextKey = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(result, flattenKeys(value, nextKey));
		} else {
			result[nextKey] = value;
		}
	}
	return result;
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

// Strips repeatedly so tags rebuilt by a single pass (e.g. "<scr<b>ipt>") are also removed.
function stripHtmlTags(html) {
	let previous;
	let current = html;
	do {
		previous = current;
		current = current.replace(/<[^>]*>/g, "");
	} while (current !== previous);
	return current.replace(/[<>]/g, "");
}

describe("Sacramento RPG — Internationalization (i18n) & Babele Validation", () => {
	const flatPt = flattenKeys(ptBr);
	const flatEn = flattenKeys(en);

	it("has 100% key parity between lang/pt_br.json and lang/en.json with non-empty values", () => {
		const ptKeys = Object.keys(flatPt).sort();
		const enKeys = Object.keys(flatEn).sort();

		const missingInEn = ptKeys.filter((k) => !(k in flatEn));
		const missingInPt = enKeys.filter((k) => !(k in flatPt));

		assert.deepEqual(missingInEn, [], `Keys missing in lang/en.json: ${missingInEn.join(", ")}`);
		assert.deepEqual(missingInPt, [], `Keys missing in lang/pt_br.json: ${missingInPt.join(", ")}`);

		for (const [key, val] of Object.entries(flatPt)) {
			assert.ok(typeof val === "string" && val.trim().length > 0, `Empty value in pt_br.json for ${key}`);
		}
		for (const [key, val] of Object.entries(flatEn)) {
			assert.ok(typeof val === "string" && val.trim().length > 0, `Empty value in en.json for ${key}`);
		}
	});

	it("verifies that all {{localize '...'}} keys in .hbs templates exist in both language files", () => {
		const hbsFiles = listFilesRecursively(path.join(ROOT_DIR, "templates"), ".hbs");
		const localizeRegex = /\{\{localize\s+["']([^"']+)["']/g;

		for (const file of hbsFiles) {
			const content = fs.readFileSync(file, "utf8");
			let match;
			while ((match = localizeRegex.exec(content)) !== null) {
				const key = match[1];
				if (key.startsWith("DOCUMENT.") || key.startsWith("EFFECT.")) continue;
				assert.ok(
					key in flatPt,
					`Missing i18n key "${key}" (from ${path.relative(ROOT_DIR, file)}) in lang/pt_br.json`
				);
				assert.ok(
					key in flatEn,
					`Missing i18n key "${key}" (from ${path.relative(ROOT_DIR, file)}) in lang/en.json`
				);
			}
		}
	});

	it("ensures .hbs templates do not contain hardcoded text in labels, headers, options, or placeholders", () => {
		const hbsFiles = listFilesRecursively(path.join(ROOT_DIR, "templates"), ".hbs");
		const attrRegex = /(?:placeholder|title)="([^"]+)"/g;
		const tagRegex = /<(?:label|h1|h2|h3|h4|option)[^>]*>([\s\S]*?)<\/(?:label|h1|h2|h3|h4|option)>/g;

		for (const file of hbsFiles) {
			const relPath = path.relative(ROOT_DIR, file);
			const content = fs.readFileSync(file, "utf8").replace(/\{\{!--[\s\S]*?--\}\}/g, "");

			let attrMatch;
			while ((attrMatch = attrRegex.exec(content)) !== null) {
				const val = attrMatch[1].trim();
				assert.ok(
					val.includes("{{") && val.includes("}}"),
					`Hardcoded placeholder/title "${val}" found in ${relPath}`
				);
			}

			let tagMatch;
			while ((tagMatch = tagRegex.exec(content)) !== null) {
				const inner = stripHtmlTags(tagMatch[1])
					.replace(/\{\{[\s\S]*?\}\}/g, "")
					.replace(/[():/$\-0-9\s]/g, "")
					.trim();

				assert.equal(inner, "", `Hardcoded text "${inner}" inside label/heading/option in ${relPath}`);
			}
		}
	});

	it("validates English Babele compendium translations match packs-src and preserve proper ability names", () => {
		const packs = ["armas", "armas-especiais", "habilidades", "itens", "consumiveis"];

		for (const packName of packs) {
			const srcEntries = JSON.parse(
				fs.readFileSync(path.join(ROOT_DIR, "packs-src", `${packName}.json`), "utf8")
			);
			const babeleData = JSON.parse(
				fs.readFileSync(path.join(ROOT_DIR, "lang/babele/en", `sacramento-rpg.${packName}.json`), "utf8")
			);

			assert.ok(babeleData.label, `Missing label in Babele file for ${packName}`);
			assert.ok(babeleData.entries, `Missing entries in Babele file for ${packName}`);

			for (const entry of srcEntries) {
				const translated = babeleData.entries[entry.name];
				assert.ok(
					translated,
					`Missing Babele translation for "${entry.name}" in sacramento-rpg.${packName}.json`
				);

				if (packName === "habilidades") {
					assert.equal(
						translated.name,
						entry.name,
						`Proper ability name "${entry.name}" must be preserved in English Babele pack`
					);
				}
			}
		}
	});

	it("verifies template.json has no hardcoded label properties", () => {
		const flatSchema = flattenKeys(templateJson);
		const labelKeys = Object.keys(flatSchema).filter((k) => k.endsWith(".label"));
		assert.deepEqual(labelKeys, [], `Hardcoded labels found in template.json: ${labelKeys.join(", ")}`);
	});

	it("verifies all SACRAMENTO_RPG.* keys in module/**/*.mjs exist in both language files and no hardcoded notifications exist", () => {
		const mjsFiles = listFilesRecursively(path.join(ROOT_DIR, "module"), ".mjs");
		const keyRegex = /["'](SACRAMENTO_RPG\.[A-Za-z0-9_.]+)["']/g;
		const hardcodedNotifyRegex = /ui\.notifications\.(?:warn|info|error)\(\s*["'`]/;

		for (const file of mjsFiles) {
			const relPath = path.relative(ROOT_DIR, file);
			const content = fs.readFileSync(file, "utf8");

			assert.equal(
				hardcodedNotifyRegex.test(content),
				false,
				`Hardcoded string inside ui.notifications in ${relPath}`
			);

			let match;
			while ((match = keyRegex.exec(content)) !== null) {
				const key = match[1];
				const isDirect = key in flatPt;
				const isNestedObject = `${key}.long` in flatPt;
				assert.ok(isDirect || isNestedObject, `Missing JS i18n key "${key}" (from ${relPath}) in pt_br.json`);
				assert.ok(
					key in flatEn || `${key}.long` in flatEn,
					`Missing JS i18n key "${key}" (from ${relPath}) in en.json`
				);
			}
		}
	});
});
