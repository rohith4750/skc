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
let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace order.eventDate || order.createdAt
  content = content.replace(/([a-zA-Z0-9_\.]+)\.?eventDate\s*\|\|\s*\1\.?createdAt/g, (match, prefix) => {
      const obj = prefix.endsWith('.') ? prefix.slice(0, -1) : prefix;
      return `getOrderDate(${obj})`;
  });
  
  content = content.replace(/([a-zA-Z0-9_\.]+)\?\.?eventDate\s*\|\|\s*\1\?\.?createdAt/g, (match, prefix) => {
      const obj = prefix.replace(/\?\.?$/, '');
      return `getOrderDate(${obj})`;
  });

  // Regex 3: order.eventDate ? new Date(order.eventDate) : new Date(order.createdAt)
  content = content.replace(/([a-zA-Z0-9_\.]+)\.?eventDate\s*\?\s*new Date\(\1\.?eventDate\)\s*:\s*new Date\(\1\.?createdAt\)/g, (match, prefix) => {
    const obj = prefix.endsWith('.') ? prefix.slice(0, -1) : prefix;
    return `new Date(getOrderDate(${obj}))`;
  });
  
  // Custom specific ones like expenses/create/page.tsx line 262
  content = content.replace(/([a-zA-Z0-9_\.]+)\.?eventDate\s*\?\s*new Date\(\1\.?eventDate\)\.toLocaleDateString\(\)\s*:\s*new Date\(\1\.?createdAt\)\.toLocaleDateString\(\)/g, (match, prefix) => {
    const obj = prefix.endsWith('.') ? prefix.slice(0, -1) : prefix;
    return `new Date(getOrderDate(${obj})).toLocaleDateString()`;
  });

  if (content !== originalContent) {
    if (!content.match(/import\s+({[^}]*getOrderDate[^}]*}|getOrderDate)\s+from\s+['"]@\/lib\/utils['"]/)) {
        if (content.includes('@/lib/utils')) {
            content = content.replace(/(import\s+{[^}]*)(\s*}\s+from\s+['"]@\/lib\/utils['"])/, '$1, getOrderDate$2');
        } else {
            content = `import { getOrderDate } from '@/lib/utils';\n` + content;
        }
    }

    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Total files updated: ${modifiedCount}`);
