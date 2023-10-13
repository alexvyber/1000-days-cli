import { intro, outro } from "@clack/prompts";
import * as p from "@clack/prompts";
import util from "node:util";
import { exec as _exec } from "node:child_process";

const exec = util.promisify(_exec);

intro("Today I learned");

const START_DATE = "2022-06-01";
const DAYS_REPO_PATH = "/home/alexs/personal/1000days";

const dirs = [
	"1_99",
	"100_199",
	"200_299",
	"300_399",
	"400_499",
	"500_599",
	"600_699",
	"700_799",
	"800_899",
	"900_1000",
];

const mapped = dirs.map((dir) => {
	const item = dir.split("_").map((item) => parseInt(item));
	return [...item, dir] as [number, number, string];
});

const start = new Date(START_DATE).getTime();
const now = new Date().getTime();

const today = Math.ceil((now - start) / 24 / 60 / 60 / 1000);

const todayPath = mapped.find((item) => today >= item[0] && today < item[1]);
if (!todayPath) throw new Error("can't find path to today's md file");
const filePath = `${DAYS_REPO_PATH}/${todayPath[2]}`;

const group = await p.group(
	{
		subject: () =>
			p.text({
				message: "What did you learn?",
				validate: (value) => {
					if (!value) return "Required";
				},
			}),
		duration: () =>
			p.text({
				message: "How long in hours?",
				validate: (value) => {
					if (!value) return "Required";
				},
			}),
		commitMessage: () =>
			p.text({
				message: "Commit Message",
				validate: (value) => {
					if (!value) return "Required";
				},
			}),
		progess: () =>
			p.text({
				message: "Progress",
				validate: (value) => {
					if (!value) return "Required";
				},
			}),
		workingWith: () => p.text({ message: "Working with" }),
		linkToworkingWith: () =>
			p.text({ message: "Linkt to what you're working with?" }),
		repo: () => {
			return p.select({
				message: "Source code",
				options: [
					{ value: "current", label: "Current path" },
					{ value: "manual", label: "Manual input" },
				],
				initialValue: "none",
			});
		},
	},
	{
		onCancel: () => {
			p.cancel("Operation cancelled.");
			process.exit(0);
		},
	},
);

async function getRepo() {
	try {
		const { stdout } = await exec("git remote -v");
		const repo = stdout
			.split("\n")[0]
			.replace(/\s+/g, " ")
			.trim()
			.split(" ")[1];

		return repo;
	} catch (error) {
		if (error instanceof Error)
			console.error("getRepo ~ error:", error.message);
		return "";
	}
}

const repo = group.repo === "current" ? await getRepo() : "";

const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;
const day = new Date().getDate();

const fileName = `${today}[${day}.${month}.${year}].md`;

const commit = `Day ${today} (${group.subject} | ${group.duration} ${getHours(
	group.duration,
)}): ${group.commitMessage}`;
const fileContent = `## ${commit}

working with: ${
	group.linkToworkingWith
		? `[${group.workingWith}](${group.linkToworkingWith})`
		: group.workingWith
}

progress: ${group.progess}

code: [repo](${repo})`;

function getHours(hours: string) {
	if (Math.floor(parseFloat(hours)) === 1) return "hour";
	return "hours";
}

try {
	await Bun.write(`${filePath}/${fileName}`, fileContent);
	await Bun.write(`${DAYS_REPO_PATH}/.today_commit`, commit);

	console.log("🚀 ~ commit:", commit);
	console.log("🚀 ~ fileContent:", fileContent);

	outro("Completed successfully");
} catch (e) {
	console.error("Error during writing files");
}
