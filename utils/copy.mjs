import fs from "fs-extra";
import path from "path";

const DEST = "dist";

const staticFiles = ["assets", "icons", "lang", "templates", "LICENSE", "system.json"];

try {
	await fs.ensureDir(DEST);

	await Promise.all(staticFiles.map((file) => fs.copy(file, path.join(DEST, file))));
	process.exit(1);
} catch (err) {
	console.error("Error copying files:", err);
	process.exit(1);
}
