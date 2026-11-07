import fs from 'fs';
import path from 'path';

const ldbDir = 'd:\\CalendarApp\\node_modules\\electron\\dist\\calendar_data\\Local Storage\\leveldb';
const files = fs.readdirSync(ldbDir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));

let allStrings = [];

for (const file of files) {
    const filePath = path.join(ldbDir, file);
    const buf = fs.readFileSync(filePath);
    
    // Dump UTF-16LE characters that are printable
    let currentStr = "";
    for (let i = 0; i < buf.length - 1; i += 2) {
        let code = buf.readUInt16LE(i);
        if (code >= 32 && code <= 126) {
            currentStr += String.fromCharCode(code);
        } else {
            if (currentStr.length > 20) allStrings.push(currentStr);
            currentStr = "";
        }
    }
    if (currentStr.length > 20) allStrings.push(currentStr);
    
    // Dump UTF-8 characters that are printable
    currentStr = "";
    for (let i = 0; i < buf.length; i++) {
        let code = buf[i];
        if (code >= 32 && code <= 126) {
            currentStr += String.fromCharCode(code);
        } else {
            if (currentStr.length > 20) allStrings.push(currentStr);
            currentStr = "";
        }
    }
    if (currentStr.length > 20) allStrings.push(currentStr);
}

fs.writeFileSync('d:\\CalendarApp\\dumped_strings.txt', allStrings.join('\n'));
console.log("Dumped all strings. Check dumped_strings.txt");
