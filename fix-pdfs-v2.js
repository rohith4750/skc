const fs = require('fs');

// 1. Fix lib/pdf-template.tsx
const pdfPath = 'd:/WORKKKKK/skc/skc/lib/pdf-template.tsx';
let pdfContent = fs.readFileSync(pdfPath, 'utf-8');

const oldPdfChunk = `        \${expense.calculationDetails ? \`
        <div class="form-row">
          <span class="form-label">Calculation Method:</span>
          <span class="form-value">\${expense.calculationDetails.method || 'N/A'}</span>
        </div>
        \` : ''}`;

const newPdfChunk = `        \${expense.calculationDetails && expense.category === 'boys' ? \`
        <div class="form-row">
          <span class="form-label">Dressed Boys:</span>
          <span class="form-value">\${expense.calculationDetails.dressedBoys || 0} @ \${formatCurrency(expense.calculationDetails.dressedBoyAmount || 0)}</span>
        </div>
        <div class="form-row">
          <span class="form-label">Non-Dressed Boys:</span>
          <span class="form-value">\${expense.calculationDetails.nonDressedBoys || 0} @ \${formatCurrency(expense.calculationDetails.nonDressedBoyAmount || 0)}</span>
        </div>
        \` : expense.calculationDetails ? \`
        <div class="form-row">
          <span class="form-label">Calculation Method:</span>
          <span class="form-value">\${expense.calculationDetails.method || 'N/A'}</span>
        </div>
        \` : ''}`;

pdfContent = pdfContent.replace(oldPdfChunk, newPdfChunk);
fs.writeFileSync(pdfPath, pdfContent, 'utf-8');

// 2. Fix app/workforce/page.tsx
const wfPath = 'd:/WORKKKKK/skc/skc/app/workforce/page.tsx';
let wfContent = fs.readFileSync(wfPath, 'utf-8');

const oldWfChunk = `    const expenseItems = (member.expenses || []).map((exp: any) => ({
      date: exp.paymentDate || exp.createdAt,
      amount: exp.amount || 0,
      description: exp.description || '',
      status: exp.paymentStatus || 'pending',
    }))`;

const newWfChunk = `    const expenseItems = (member.expenses || []).map((exp: any) => {
      let desc = exp.description || '';
      if (exp.category === 'boys' && exp.calculationDetails) {
        const dBoys = exp.calculationDetails.dressedBoys || 0;
        const dAmt = exp.calculationDetails.dressedBoyAmount || 0;
        const ndBoys = exp.calculationDetails.nonDressedBoys || 0;
        const ndAmt = exp.calculationDetails.nonDressedBoyAmount || 0;
        const boyDetails = \`Dressed: \${dBoys} @ \${dAmt}, Non-Dressed: \${ndBoys} @ \${ndAmt}\`;
        desc = desc ? \`\${boyDetails} (\${desc})\` : boyDetails;
      }
      return {
        date: exp.paymentDate || exp.createdAt,
        amount: exp.amount || 0,
        description: desc,
        status: exp.paymentStatus || 'pending',
      };
    })`;

wfContent = wfContent.replace(oldWfChunk, newWfChunk);
fs.writeFileSync(wfPath, wfContent, 'utf-8');

console.log('Successfully updated PDF files with literal string replacement');
