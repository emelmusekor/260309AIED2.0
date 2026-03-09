const fs = require('fs');
const filePath = 'g:\\내 드라이브\\Dev\\AIED 2.0\\20250829_경인교대_AI 교육 2.0 모형 구현_2.pdf';
const buf = fs.readFileSync(filePath);
const raw = buf.toString('latin1');

// Extract UTF-16BE strings (Korean text in PDF)
const utf16Parts = [];
for (let i = 0; i < buf.length - 1; i++) {
    if (buf[i] === 0xFE && buf[i + 1] === 0xFF) {
        let str = '';
        let j = i + 2;
        while (j < buf.length - 1) {
            const code = (buf[j] << 8) | buf[j + 1];
            if (code === 0 || code === 0x003E || code === 0x0029) break;
            str += String.fromCharCode(code);
            j += 2;
        }
        if (str.length > 2) utf16Parts.push(str);
        i = j;
    }
}

// Count pages
const pages = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log('Pages:', pages);
console.log('\n=== Extracted Korean Text ===');
utf16Parts.forEach((p, i) => console.log(`[${i}] ${p}`));
