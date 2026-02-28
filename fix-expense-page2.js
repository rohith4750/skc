const fs = require('fs');
const filePath = 'd:/WORKKKKK/skc/skc/app/expenses/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /expenseDetails: \{[\s\S]*?calculationDetails: expense\.calculationDetails \|\| undefined,\s*\}/;

const match = content.match(regex);

if (match) {
    let replaced = match[0].replace(
        'eventDate: expense.eventDate || undefined,',
        'eventDate: expense.eventDate || undefined,\n        eventName: expense.order?.eventName || undefined,'
    );
    content = content.replace(regex, replaced);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Successfully updated expenses/page.tsx');
} else {
    console.log('Target string not found!');
}
