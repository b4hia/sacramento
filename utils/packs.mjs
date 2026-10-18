import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import logger from "fancy-log";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const PACK_DEST = "./packs";
const PACK_SRC = "./packs-src";

const argv = yargs(hideBin(process.argv)).command(packageCommand()).help().alias("help", "h").argv; // eslint-disable-line no-unused-vars

function packageCommand() {
	return {
		command: "package [action] [pack] [entry]",
		describe: "Manage compendium packs",
		builder: (yargsInstance) => {
			yargsInstance.positional("action", {
				describe: "The action to perform.",
				type: "string",
				choices: ["unpack", "pack", "clean"]
			});
			yargsInstance.positional("pack", {
				describe: "Name of the specific pack (optional).",
				type: "string"
			});
			yargsInstance.positional("entry", {
				describe: "Name of a specific entry (optional).",
				type: "string"
			});
		},
		handler: async (args) => {
			const { action, pack, entry } = args;
			switch (action) {
				case "clean":
					return await cleanPacks(pack, entry);
				case "pack":
					return await compilePacks(pack);
				case "unpack":
					return await extractPacks(pack, entry);
			}
		}
	};
}

function generateDeterministicId(seed) {
	return crypto.createHash("md5").update(seed).digest("hex").slice(0, 16);
}

function cleanPackEntry(data, { clearSourceId = true, ownership = 0 } = {}) {
	if (data.ownership) data.ownership = { default: ownership };
	if (clearSourceId) {
		delete data._stats?.compendiumSource;
		delete data.flags?.core?.sourceId;
	}
	delete data.flags?.importSource;
	delete data.flags?.exportSource;

	if (data._stats?.lastModifiedBy) data._stats.lastModifiedBy = "sacramentobuilder";

	if (!data.flags) data.flags = {};
	Object.entries(data.flags).forEach(([key, contents]) => {
		if (contents === null || Object.keys(contents).length === 0) delete data.flags[key];
	});

	if (data.effects) data.effects.forEach((i) => cleanPackEntry(i, { clearSourceId: false }));
	if (data.items) data.items.forEach((i) => cleanPackEntry(i, { clearSourceId: false }));
	if (data.pages) data.pages.forEach((i) => cleanPackEntry(i, { ownership: -1 }));

	if (data.system?.description?.value) data.system.description.value = cleanString(data.system.description.value);
	if (data.label) data.label = cleanString(data.label);
	if (data.name) data.name = cleanString(data.name);
}

function cleanString(str) {
	return str
		.replace(/\u2060/gu, "")
		.replace(/[‘’]/gu, "'")
		.replace(/[“”]/gu, '"');
}

async function cleanPacks() {
	logger.info("Cleaning pack sources...");
}

async function compilePacks(packName) {
	if (!fs.existsSync(PACK_SRC)) {
		logger.error(`Source directory ${PACK_SRC} does not exist.`);
		process.exitCode = 1;
		return;
	}

	const system = JSON.parse(fs.readFileSync("./system.json", { encoding: "utf8" }));
	const packs = system.packs.filter((p) => !packName || p.name === packName);
	const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sacramento-packs-"));

	try {
		for (const packInfo of packs) {
			const jsonFile = path.join(PACK_SRC, `${packInfo.name}.json`);
			if (!fs.existsSync(jsonFile)) {
				logger.warn(`Source file ${jsonFile} not found, skipping ${packInfo.name}.`);
				continue;
			}

			const rawEntries = JSON.parse(fs.readFileSync(jsonFile, { encoding: "utf8" }));
			const packTmpDir = path.join(tmpRoot, packInfo.name);
			fs.mkdirSync(packTmpDir, { recursive: true });

			const docCollection = packInfo.type === "Actor" ? "actors" : "items";

			rawEntries.forEach((entry, idx) => {
				const id = entry._id || generateDeterministicId(`${packInfo.name}:${entry.name}:${idx}`);
				const prepared = {
					...entry,
					_id: id,
					_key: entry._key || `!${docCollection}!${id}`
				};
				cleanPackEntry(prepared);
				const fileName = `${slugify(entry.name || `entry-${idx}`)}-${id}.json`;
				fs.writeFileSync(path.join(packTmpDir, fileName), JSON.stringify(prepared, null, 2), "utf8");
			});

			const dest = path.join(PACK_DEST, packInfo.name);
			logger.info(`Compiling pack ${packInfo.name} (${rawEntries.length} entries) -> ${dest}`);
			await compilePack(packTmpDir, dest, { recursive: false, log: false, yaml: false });
		}
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true });
	}
}

async function extractPacks(packName, entryName) {
	entryName = entryName?.toLowerCase();
	const system = JSON.parse(fs.readFileSync("./system.json", { encoding: "utf8" }));
	const packs = system.packs.filter((p) => !packName || p.name === packName);

	for (const packInfo of packs) {
		const dest = path.join(PACK_SRC, packInfo.name);
		const distPath = packInfo.path;

		if (!fs.existsSync(distPath)) continue;
		logger.info(`Extracting pack ${packInfo.name} from ${distPath} to ${dest}`);

		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true });
		}

		await extractPack(distPath, dest, {
			log: true,
			transformEntry: (entry) => {
				if (entryName && entryName !== entry.name.toLowerCase()) return false;
				cleanPackEntry(entry);
			},
			yaml: false
		});
	}
}

function slugify(name) {
	return name
		.toLowerCase()
		.replace("'", "")
		.replace(/[^a-z0-9áâãàäéêèëíìïóôõòöúùüçñ]+/gi, " ")
		.trim()
		.replace(/\s+|-{2,}/g, "-");
}
