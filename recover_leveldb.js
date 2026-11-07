const fs = require('fs');
const path = require('path');

const levelDbPath = 'd:/CalendarApp/out/calendarapp-win32-x64/calendar_data/Local Storage/leveldb';
const files = fs.readdirSync(levelDbPath);

let extractedJsons = [];

function extractJsonStrings(buffer) {
    const str = buffer.toString('utf8');
    // We are looking for strings that look like a serialized appData
    // e.g., {"images":..., "events":...}
    
    // A simple regex to find JSON-like objects that have "images" or "events"
    // Since JSON can be large, we'll try to find the start and balance the braces
    let results = [];
    let searchStr = '{"images":';
    let idx = str.indexOf(searchStr);
    
    while (idx !== -1) {
        let openBraces = 0;
        let inString = false;
        let escapeNext = false;
        let endIdx = -1;
        
        for (let i = idx; i < str.length; i++) {
            const char = str[i];
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            if (char === '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (char === '{') openBraces++;
                else if (char === '}') {
                    openBraces--;
                    if (openBraces === 0) {
                        endIdx = i;
                        break;
                    }
                }
            }
        }
        
        if (endIdx !== -1) {
            try {
                let jsonStr = str.substring(idx, endIdx + 1);
                let parsed = JSON.parse(jsonStr);
                results.push(parsed);
            } catch (e) {
                // Ignore parsing errors, might be cut off
            }
        }
        idx = str.indexOf(searchStr, idx + 1);
    }
    
    return results;
}

for (const file of files) {
    if (file.endsWith('.ldb') || file.endsWith('.log')) {
        const fullPath = path.join(levelDbPath, file);
        const buffer = fs.readFileSync(fullPath);
        const jsons = extractJsonStrings(buffer);
        extractedJsons.push(...jsons);
    }
}

// Sort by number of events or a specific heuristic, or just save them all
extractedJsons.sort((a, b) => {
    // maybe sort by total number of events
    const countEvents = (obj) => Object.keys(obj.events || {}).length + Object.keys(obj.timeEvents || {}).length + (obj.todos || []).length;
    return countEvents(b) - countEvents(a);
});

fs.writeFileSync('d:/CalendarApp/recovered_data.json', JSON.stringify(extractedJsons, null, 2));
console.log(`Recovered ${extractedJsons.length} JSON objects.`);
