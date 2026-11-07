import fs from 'fs';
import path from 'path';

const ldbDir = 'd:\\CalendarApp\\node_modules\\electron\\dist\\calendar_data\\Local Storage\\leveldb';
const files = fs.readdirSync(ldbDir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));

const searchStr = '"timeEvents"';
const searchBuffer = Buffer.from(searchStr, 'utf16le');
let foundCount = 0;
let bestJsonBuffer = null;
let allJsonBuffers = [];

for (const file of files) {
    const filePath = path.join(ldbDir, file);
    try {
        const buf = fs.readFileSync(filePath);
        let idx = buf.indexOf(searchBuffer);
        while (idx !== -1) {
            foundCount++;
            
            // Let's just find the very first '{' before it
            let actualStart = -1;
            for(let i = idx; i >= 0; i -= 2) {
                // '{' is 0x7b 0x00 in little endian utf16
                if (buf[i] === 0x7b && buf[i+1] === 0x00) {
                    actualStart = i;
                }
            }
            
            if (actualStart !== -1) {
                // find the matching '}'
                let depth = 0;
                let actualEnd = -1;
                let inString = false;
                let escapeNext = false;
                
                for(let i = actualStart; i < buf.length; i += 2) {
                    const ch = buf[i];
                    const next = buf[i+1];
                    
                    if (next !== 0x00) continue; // simplistic ascii in utf16le check
                    
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (ch === 0x5c) { // backslash '\'
                        escapeNext = true;
                        continue;
                    }
                    if (ch === 0x22) { // quote '"'
                        inString = !inString;
                        continue;
                    }
                    
                    if (!inString) {
                        if (ch === 0x7b) depth++;
                        if (ch === 0x7d) {
                            depth--;
                            if (depth === 0) {
                                actualEnd = i + 2;
                                break;
                            }
                        }
                    }
                }
                
                if (actualEnd !== -1) {
                    let jsonChunk = buf.slice(actualStart, actualEnd);
                    allJsonBuffers.push(jsonChunk);
                    if (!bestJsonBuffer || jsonChunk.length > bestJsonBuffer.length) {
                         bestJsonBuffer = jsonChunk;
                    }
                }
            }
            
            idx = buf.indexOf(searchBuffer, idx + 1);
        }
    } catch (e) { }
}

if (bestJsonBuffer) {
    // Write out as a proper utf8 string
    const jsonString = bestJsonBuffer.toString('utf16le');
    fs.writeFileSync('d:\\CalendarApp\\RecoveredData.json', jsonString, 'utf8');
    console.log('\n======================================================');
    console.log('🎉 SUCCESS! Recovered your data in UTF-16 format!');
    console.log('Saved to: d:\\CalendarApp\\RecoveredData.json');
    console.log('Size:', jsonString.length, 'characters');
    console.log('======================================================\n');
} else {
    console.log('Not found in UTF-16 either.');
}
