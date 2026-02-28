const fs = require('fs');

// 1. Fix lib/pdf-template.tsx
const pdfPath = 'd:/WORKKKKK/skc/skc/lib/pdf-template.tsx';
let pdfContent = fs.readFileSync(pdfPath, 'utf-8');

const calcDetailsRegex = /\\$\\{expense\\.calculationDetails \\? \`\\s*<div class="form-row">\\s*<span class="form-label">Calculation Method:<\\/span>\\s*<span class="form-value">\\$\\{expense\\.calculationDetails\\.method \\|\\| 'N\\/A'\\}<\\/span>\\s*<\\/div>\\s*\` : ''\\}/g;

const newCalcDetails = "\\${expense.calculationDetails && expense.category === 'boys' ? `\\n" +
"        <div class=\\"form-row\\">\\n" +
"          <span class=\\"form-label\\">Dressed Boys:</span>\\n" +
"          <span class=\\"form-value\\">${expense.calculationDetails.dressedBoys || 0} @ ${formatCurrency(expense.calculationDetails.dressedBoyAmount || 0)}</span>\\n" +
"        </div>\\n" +
"        <div class=\\"form-row\\">\\n" +
"          <span class=\\"form-label\\">Non-Dressed Boys:</span>\\n" +
"          <span class=\\"form-value\\">${expense.calculationDetails.nonDressedBoys || 0} @ ${formatCurrency(expense.calculationDetails.nonDressedBoyAmount || 0)}</span>\\n" +
"        </div>\\n" +
"        ` : expense.calculationDetails ? `\\n" +
"        <div class=\\"form-row\\">\\n" +
"          <span class=\\"form-label\\">Calculation Method:</span>\\n" +
"          <span class=\\"form-value\\">${expense.calculationDetails.method || 'N/A'}</span>\\n" +
"        </div>\\n" +
"        ` : ''}";

pdfContent = pdfContent.replace(calcDetailsRegex, newCalcDetails);
fs.writeFileSync(pdfPath, pdfContent, 'utf-8');

// 2. Fix app/workforce/page.tsx
const wfPath = 'd:/WORKKKKK/skc/skc/app/workforce/page.tsx';
let wfContent = fs.readFileSync(wfPath, 'utf-8');

const wfExpenseMapRegex = /const expenseItems = \\(member\\.expenses \\|\\| \\[\\]\\)\\.map\\(\\(exp: any\\) => \\(\\{\\s*date: exp\\.paymentDate \\|\\| exp\\.createdAt,\\s*amount: exp\\.amount \\|\\| 0,\\s*description: exp\\.description \\|\\| '',\\s*status: exp\\.paymentStatus \\|\\| 'pending',\\s*\\}\\)\\)/g;

const newWfExpenseMap = "const expenseItems = (member.expenses || []).map((exp: any) => {\\n" +
"      let desc = exp.description || '';\\n" +
"      if (exp.category === 'boys' && exp.calculationDetails) {\\n" +
"        const dBoys = exp.calculationDetails.dressedBoys || 0;\\n" +
"        const dAmt = exp.calculationDetails.dressedBoyAmount || 0;\\n" +
"        const ndBoys = exp.calculationDetails.nonDressedBoys || 0;\\n" +
"        const ndAmt = exp.calculationDetails.nonDressedBoyAmount || 0;\\n" +
"        const boyDetails = `Dressed: ${dBoys} @ ${dAmt}, Non-Dressed: ${ndBoys} @ ${ndAmt}`;\\n" +
"        desc = desc ? `${boyDetails} (${desc})` : boyDetails;\\n" +
"      }\\n" +
"      return {\\n" +
"        date: exp.paymentDate || exp.createdAt,\\n" +
"        amount: exp.amount || 0,\\n" +
"        description: desc,\\n" +
"        status: exp.paymentStatus || 'pending',\\n" +
"      };\\n" +
"    })";

wfContent = wfContent.replace(wfExpenseMapRegex, newWfExpenseMap);
fs.writeFileSync(wfPath, wfContent, 'utf-8');

console.log('Successfully updated PDF files');
