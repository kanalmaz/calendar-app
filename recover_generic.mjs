import fs from 'fs';
import path from 'path';

const ldbDir = 'd:\\CalendarApp\\out\\calendarapp-win32-x64\\calendar_data\\Local Storage\\leveldb';
const files = fs.readdirSync(ldbDir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));

let foundJsons = new Set();

for (const file of files) {
    const filePath = path.join(ldbDir, file);
    try {
        const buf = fs.readFileSync(filePath);
        const strUtf8 = buf.toString('utf8');
        const strUtf16 = buf.toString('utf16le');
        
        const extract = (str) => {
            let startIdx = 0;
            while ((startIdx = str.indexOf('{"images"', startIdx)) !== -1) {
                let openBraces = 0;
                let end = -1;
                let inString = false;
                let escape = false;
                for (let i = startIdx; i < str.length; i++) {
                    let char = str[i];
                    if (escape) { escape = false; continue; }
                    if (char === '\\') { escape = true; continue; }
                    if (char === '"') { inString = !inString; continue; }
                    if (!inString) {
                        if (char === '{') openBraces++;
                        if (char === '}') {
                            openBraces--;
                            if (openBraces === 0) {
                                end = i;
                                break;
                            }
                        }
                    }
                }
                if (end !== -1) {
                    foundJsons.add(str.substring(startIdx, end + 1));
                }
                startIdx++;
            }
        };

        extract(strUtf8);
        extract(strUtf16);
    } catch (e) {}
}

const arr = Array.from(foundJsons);
console.log("Found JSON strings:", arr.length);
if (arr.length > 0) {
    fs.writeFileSync('d:\\CalendarApp\\RecoveredData.json', `[${arr.join(',')}]`, 'utf8');
}
