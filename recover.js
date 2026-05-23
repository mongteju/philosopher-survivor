const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\af9fb412-e523-443b-8979-3ed08a6988a7\\.system_generated\\logs\\transcript.jsonl";

console.log("Scanning log...");
const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    const toolCalls = data.tool_calls || [];
    for (const tc of toolCalls) {
      const func = tc.function || {};
      const name = func.name;
      const args = func.arguments || {};
      if (["write_to_file", "replace_file_content", "multi_replace_file_content"].includes(name)) {
        const target = args.TargetFile || "";
        if (target.includes("game.js") || target.includes("index.html") || target.includes("style.css")) {
          console.log(`Step ${data.step_index}: ${name} on ${target}`);
        }
      }
    }
  } catch (err) {
  }
});
