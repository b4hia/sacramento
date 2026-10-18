import fs from "node:fs";

const CONVENTIONAL_COMMIT_REGEX =
	/^(?:Merge |Revert "|(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\([a-zA-Z0-9_.-]+\))?!?: .+)/;

export function isValidCommitMessage(message = "") {
	const firstLine = String(message).trim().split(/\r?\n/)[0] || "";
	return CONVENTIONAL_COMMIT_REGEX.test(firstLine);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const msgFile = process.argv[2];
	if (!msgFile) {
		console.error("Missing commit message file path.");
		process.exit(1);
	}

	const content = fs.readFileSync(msgFile, "utf8");
	if (!isValidCommitMessage(content)) {
		console.error(
			[
				"❌ Invalid commit message format.",
				"Commit messages must follow Conventional Commits:",
				"  <type>(<optional-scope>): <description>",
				"Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert",
				"Example: feat(combat): add best-of-3 death save roll"
			].join("\n")
		);
		process.exit(1);
	}
}
