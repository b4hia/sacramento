import chalk from "chalk";
import { readFile, writeFile } from "node:fs/promises";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const manifestPath = "system.json";
const packagePath = "package.json";

const argv = await yargs(hideBin(process.argv))
	.option("systemVersion", { type: "string" })
	.option("manifest", { type: "string" })
	.option("download", { type: "string" })
	.help()
	.parse();

const manifestRaw = await readFile(manifestPath, "utf-8");
const manifest = JSON.parse(manifestRaw);
const pkgRaw = await readFile(packagePath, "utf-8");
const pkg = JSON.parse(pkgRaw);

const newVersion = getSystemVersion(pkg.version);
const repoUrl = (manifest.url || "https://github.com/b4hia/sacramento").replace(/\/$/, "");
const defaultManifestUrl = `${repoUrl}/releases/latest/download/system.json`;
const defaultDownloadUrl = argv.systemVersion
	? `${repoUrl}/releases/download/v${newVersion.replace(/^v/, "")}/sacramento-rpg.zip`
	: `${repoUrl}/releases/latest/download/sacramento-rpg.zip`;

const newManifestData = {
	version: newVersion.replace(/^v/, ""),
	manifest: argv.manifest || manifest.manifest || defaultManifestUrl,
	download: argv.download || defaultDownloadUrl
};

console.log(chalk.blue.bold("Atualizando system.json com os seguintes dados:"));
console.table(newManifestData);

manifest.version = newManifestData.version;
manifest.manifest = newManifestData.manifest;
manifest.download = newManifestData.download;

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
	encoding: "utf-8"
});

function getSystemVersion(fallbackVersion) {
	if (argv.systemVersion) {
		return argv.systemVersion;
	}
	const commitSha = process.env.CI_COMMIT_SHORT_SHA;
	const tag = process.env.CI_COMMIT_TAG || process.env.GITHUB_REF_NAME;
	if (tag && tag.startsWith("v")) {
		return tag.replace(/^v/, "");
	}
	if (commitSha) {
		return `${fallbackVersion}-${commitSha}`;
	}
	return fallbackVersion || manifest.version;
}
