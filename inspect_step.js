const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\af9fb412-e523-443b-8979-3ed08a6988a7\\.system_generated\\logs\\transcript.jsonl";
const targetStep = parseInt(process.argv[2] || "2025");

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.step_index === targetStep) {
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    }
  } catch (err) {
  }
});
