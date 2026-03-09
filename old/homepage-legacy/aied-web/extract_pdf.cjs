// Using pdf-parse to extract text from the PDF
const fs = require('fs');

async function main() {
    try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync('g:\\내 드라이브\\Dev\\AIED 2.0\\20250829_경인교대_AI 교육 2.0 모형 구현_2.pdf');
        const data = await pdfParse(dataBuffer);
        console.log('Pages:', data.numpages);
        console.log('=== TEXT ===');
        console.log(data.text);
    } catch (e) {
        console.error('Error:', e.message);
        // Fallback: search for readable ASCII/text patterns
        const buf = fs.readFileSync('g:\\내 드라이브\\Dev\\AIED 2.0\\20250829_경인교대_AI 교육 2.0 모형 구현_2.pdf');
        const raw = buf.toString('latin1');

        // Try to find metadata
        const titleMatch = raw.match(/\/Title\s*\(([^)]+)\)/);
        const authorMatch = raw.match(/\/Author\s*\(([^)]+)\)/);
        const subjectMatch = raw.match(/\/Subject\s*\(([^)]+)\)/);
        console.log('Title:', titleMatch ? titleMatch[1] : 'N/A');
        console.log('Author:', authorMatch ? authorMatch[1] : 'N/A');
        console.log('Subject:', subjectMatch ? subjectMatch[1] : 'N/A');
    }
}

main();
