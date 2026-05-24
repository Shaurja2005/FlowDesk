const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\saury\\.gemini\\antigravity\\brain\\d7ac27f3-9955-4ee0-a74e-96129e04f105\\.system_generated\\logs\\transcript.jsonl', 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('FEATURE 7 — README UPDATE')) {
      const parts = obj.content.split('══════════════════════════════════════════════\nFEATURE 7 — README UPDATE\n══════════════════════════════════════════════');
      if (parts.length > 1) {
        const readmeContent = parts[1].split('══════════════════════════════════════════════\nVERIFICATION PLAN\n══════════════════════════════════════════════')[0];
        
        let cleanedReadme = readmeContent.replace('[MODIFY] README.md\nReplace the entire content with:', '').trim();
        fs.writeFileSync('e:\\projects\\FlowDesk\\README.md', cleanedReadme, 'utf8');
        console.log('README.md written successfully.');
        break;
      }
    }
  } catch(e){}
}
