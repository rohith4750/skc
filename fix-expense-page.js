const fs = require('fs');
const filePath = 'd:/WORKKKKK/skc/skc/app/expenses/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const target = `
      expenseDetails: {
        category: expense.category,
        recipient: expense.recipient || '',
        description: expense.description || '',
        amount: expense.amount,
        paidAmount: expense.paidAmount,
        paymentStatus: expense.paymentStatus as 'pending' | 'partial' | 'paid' || 'pending',
        paymentDate: expense.paymentDate,
        eventDate: expense.eventDate || undefined,
        notes: expense.notes || undefined,
        calculationDetails: expense.calculationDetails || undefined,
      },
`.trim();

const replacement = `
      expenseDetails: {
        category: expense.category,
        recipient: expense.recipient || '',
        description: expense.description || '',
        amount: expense.amount,
        paidAmount: expense.paidAmount,
        paymentStatus: expense.paymentStatus as 'pending' | 'partial' | 'paid' || 'pending',
        paymentDate: expense.paymentDate,
        eventDate: expense.eventDate || undefined,
        eventName: expense.order?.eventName || undefined,
        notes: expense.notes || undefined,
        calculationDetails: expense.calculationDetails || undefined,
      },
`.trim();

// Find and replace
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Successfully updated expenses/page.tsx');
} else {
    console.log('Target string not found!');
}
