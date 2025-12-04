import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";
import logger from "fancy-log";
import fs from "fs";
import YAML from "js-yaml";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

/**
 * Pasta onde os compêndios compilados (LevelDB/JSON) serão salvos.
 */
const PACK_DEST = "./packs";

/**
 * Pasta onde os arquivos fonte (YAML) ficarão para você editar.
 */
const PACK_SRC = "./packs/_source";

// eslint-disable-next-line
const argv = yargs(hideBin(process.argv)).command(packageCommand()).help().alias("help", "h").argv;

function packageCommand() {
	return {
		command: "package [action] [pack] [entry]",
		describe: "Gerenciar pacotes (compêndios)",
		builder: (yargs) => {
			yargs.positional("action", {
				describe: "A ação a ser realizada.",
				type: "string",
				choices: ["unpack", "pack", "clean"]
			});
			yargs.positional("pack", {
				describe: "Nome do pacote (pack) específico (opcional).",
				type: "string"
			});
			yargs.positional("entry", {
				describe: "Nome de uma entrada específica (opcional).",
				type: "string"
			});
		},
		handler: async (argv) => {
			const { action, pack, entry } = argv;
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

/* ----------------------------------------- */
/* Limpeza (Clean)                          */
/* ----------------------------------------- */

/**
 * Remove flags e dados desnecessários antes de extrair ou compilar.
 */
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
	
    // Limpa caracteres invisíveis
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

async function cleanPacks(packName, entryName) {
    logger.info("Limpando arquivos fonte...");
}

/* ----------------------------------------- */
/* Compilar (Pack) - YAML -> LevelDB        */
/* ----------------------------------------- */

async function compilePacks(packName) {
	// Determina quais pastas processar
    if (!fs.existsSync(PACK_SRC)) {
        logger.error(`A pasta de fontes ${PACK_SRC} não existe.`);
        return;
    }

	const folders = fs
		.readdirSync(PACK_SRC, { withFileTypes: true })
		.filter((file) => file.isDirectory() && (!packName || packName === file.name));

	for (const folder of folders) {
		const src = path.join(PACK_SRC, folder.name);
		const dest = path.join(PACK_DEST, folder.name);
		logger.info(`Compilando pack ${folder.name}`);
        // transformEntry: cleanPackEntry garante que o que vai pro jogo está limpo
		await compilePack(src, dest, { recursive: true, log: true, transformEntry: cleanPackEntry, yaml: true });
	}
}

/* ----------------------------------------- */
/* Extrair (Unpack) - LevelDB -> YAML       */
/* ----------------------------------------- */

async function extractPacks(packName, entryName) {
	entryName = entryName?.toLowerCase();

	// Carrega o system.json para saber onde estão os packs
	const system = JSON.parse(fs.readFileSync("./system.json", { encoding: "utf8" }));

	// Filtra os packs
	const packs = system.packs.filter((p) => !packName || p.name === packName);

	for (const packInfo of packs) {
        // Define onde salvar o YAML (_source/nome-do-pack)
		const dest = path.join(PACK_SRC, packInfo.name);
        
        // Define onde está o arquivo do Foundry (./packs/nome-do-pack)
		const distPath = packInfo.path; 

		logger.info(`Extraindo pack ${packInfo.name} de ${distPath} para ${dest}`);

        // Cria a pasta de destino se não existir
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        // 1. Mapeia pastas e containers para organizar os arquivos
		const folders = {};
		const containers = {};
		await extractPack(distPath, dest, {
			log: false,
			transformEntry: (e) => {
				if (e._key.startsWith("!folders")) folders[e._id] = { name: slugify(e.name), folder: e.folder };
				else if (e.type === "container")
					containers[e._id] = {
						name: slugify(e.name),
						container: e.system?.container,
						folder: e.folder
					};
				return false;
			}
		});
        
        // 2. Constrói a árvore de diretórios baseada nas pastas do Foundry
		const buildPath = (collection, entry, parentKey) => {
			let parent = collection[entry[parentKey]];
			entry.path = entry.name;
			while (parent) {
				entry.path = path.join(parent.name, entry.path);
				parent = collection[parent[parentKey]];
			}
		};
		Object.values(folders).forEach((f) => buildPath(folders, f, "folder"));
		Object.values(containers).forEach((c) => {
			buildPath(containers, c, "container");
			const folder = folders[c.folder];
			if (folder) c.path = path.join(folder.path, c.path);
		});

        // 3. Faz a extração real gerando YAML
		await extractPack(distPath, dest, {
			log: true,
			transformEntry: (entry) => {
				if (entryName && entryName !== entry.name.toLowerCase()) return false;
				cleanPackEntry(entry);
			},
			transformName: (entry) => {
				if (entry._id in folders) return path.join(folders[entry._id].path, "_folder.yml");
				if (entry._id in containers) return path.join(containers[entry._id].path, "_container.yml");
				const outputName = slugify(entry.name);
				const parent = containers[entry.system?.container] ?? folders[entry.folder];
				return path.join(parent?.path ?? "", `${outputName}.yml`);
			},
			yaml: true
		});
	}
}

/**
 * Normaliza nomes de arquivos (remove acentos, espaços, etc)
 */
function slugify(name) {
	return name
		.toLowerCase()
		.replace("'", "")
		.replace(/[^a-z0-9áâãàäéêèëíìïóôõòöúùüçñ]+/gi, " ")
		.trim()
		.replace(/\s+|-{2,}/g, "-");
}