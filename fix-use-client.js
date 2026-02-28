const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, 'app');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(APP_DIR);
let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Check if file has "use client" or 'use client'
  const match = content.match(/['"]use client['"];?/);
  
  if (match) {
    // Remove all occurrences of "use client" anywhere in the file
    content = content.replace(/['"]use client['"];?\s*/g, '');
    
    // Prepend it to the absolute top of the file
    content = '"use client";\n' + content;
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      console.log(`Fixed "use client" position in ${file}`);
    }
  }
}

console.log(`Total files fixed: ${fixedCount}`);
