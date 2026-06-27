const fs = require('fs');
const s = fs.readFileSync('src/App.jsx','utf8');
let stack = [];
for (let i = 0; i < s.length; i++) {
  if (s[i] === '{') stack.push(i);
  if (s[i] === '}') stack.pop();
}
if (stack.length === 0) { console.log('No unmatched { found'); process.exit(0); }
const last = stack[stack.length - 1];
let line = 1;
for (let i = 0; i < last; i++) if (s[i] === '\n') line++;
const lines = s.split(/\r?\n/);
const start = Math.max(1, line - 8);
const end = Math.min(lines.length, line + 12);
console.log('last unmatched at line', line);
for (let L = start; L <= end; L++) console.log(L + ': ' + lines[L - 1]);
process.exit(0);
