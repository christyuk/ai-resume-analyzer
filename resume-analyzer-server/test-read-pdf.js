const fs = require('fs');
const pdfParse = require('pdf-parse');

// Path to your PDF file
const filePath = './test/data/05-versions-space.pdf';

// Read and parse the PDF
fs.readFile(filePath, (err, pdfBuffer) => {
  if (err) {
    console.error('❌ Error reading PDF:', err);
    return;
  }

  pdfParse(pdfBuffer)
    .then(data => {
      console.log('✅ PDF Text Content:\n');
      console.log(data.text);
    })
    .catch(error => {
      console.error('❌ Error parsing PDF:', error);
    });
});
