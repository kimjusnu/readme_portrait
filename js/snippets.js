// Text the user copies into their README or hands to an AI agent.
export const SITE = "https://kimjusnu.github.io/readme_portrait/";

export function readmeSnippet(width, credit) {
  const img = `<img src="assets/portrait.svg" alt="ASCII portrait" width="${width}">`;
  return credit ? `${img}\n<sub>made with <a href="${SITE}">readme_portrait</a></sub>` : img;
}

export function aiPrompt(id, snippet) {
  const repo = id ? `${id}/${id}` : "<username>/<username>";
  return [
    `In my GitHub profile repository ${repo}:`,
    "1. Save the attached portrait.svg as assets/portrait.svg.",
    "2. Add this at the very top of README.md:",
    snippet,
    '3. Commit with the message "docs: add ASCII portrait" and push.',
  ].join("\n");
}
