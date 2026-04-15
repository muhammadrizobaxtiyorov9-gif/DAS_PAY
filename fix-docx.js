const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const filePath = path.join(__dirname, 'templates', 'договор.docx');
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath);
const zip = new PizZip(content);

let documentXml = zip.file("word/document.xml").asText();

// The user sees (USD)0). The template likely has {bank_num}0) or something similar.
if (documentXml.includes('0)')) {
    console.log('Found 0) in document.xml');
    documentXml = documentXml.replace(/\{bank_num\}0\)/g, '{bank_num}');
    documentXml = documentXml.replace(/}0\)/g, '}'); // Just in case it's inside some tags
}

zip.file("word/document.xml", documentXml);

const buf = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(filePath, buf);
console.log('Fixed docx template.');
