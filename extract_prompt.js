const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\saury\\.gemini\\antigravity\\brain\\d7ac27f3-9955-4ee0-a74e-96129e04f105\\.system_generated\\logs\\transcript.jsonl', 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('=== FLOWDESK — MASTER PROMPT')) {
      console.log('--- START PROMPT ---');
      console.log(obj.content);
      console.log('--- END PROMPT ---');
    }
  } catch(e){}
}
