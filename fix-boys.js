const fs = require('fs');

const filePath = 'd:/WORKKKKK/skc/skc/app/expenses/create/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Initial State
content = content.replace(
  /numberOfBoys: '',\s+boyAmount: '',\s+description: '',/g,
  `dressedBoys: '',\n    dressedBoyAmount: '',\n    nonDressedBoys: '',\n    nonDressedBoyAmount: '',\n    description: '',`
);

// 2. Fetch Data Assignment
content = content.replace(
  /numberOfBoys: details.numberOfBoys \? details.numberOfBoys.toString\(\) : '',\s+boyAmount: details.perUnitAmount && expenseData.category === 'boys' \? details.perUnitAmount.toString\(\) : '',\s+description: expenseData.description \|\| '',/g,
  `dressedBoys: details.dressedBoys ? details.dressedBoys.toString() : '',\n            dressedBoyAmount: details.dressedBoyAmount ? details.dressedBoyAmount.toString() : '',\n            nonDressedBoys: details.nonDressedBoys ? details.nonDressedBoys.toString() : '',\n            nonDressedBoyAmount: details.nonDressedBoyAmount ? details.nonDressedBoyAmount.toString() : '',\n            description: expenseData.description || '',`
);

// 3. Calculated Amount Hook
content = content.replace(
  /} else if \(formData.category === 'boys'\) {\s+const numberOfBoys = parseFloat\(formData.numberOfBoys\) \|\| 0\s+const boyAmount = parseFloat\(formData.boyAmount\) \|\| 0\s+return numberOfBoys \* boyAmount\s+} else {/g,
  `} else if (formData.category === 'boys') {\n      const dressedBoys = parseFloat(formData.dressedBoys) || 0\n      const dressedBoyAmount = parseFloat(formData.dressedBoyAmount) || 0\n      const nonDressedBoys = parseFloat(formData.nonDressedBoys) || 0\n      const nonDressedBoyAmount = parseFloat(formData.nonDressedBoyAmount) || 0\n      return (dressedBoys * dressedBoyAmount) + (nonDressedBoys * nonDressedBoyAmount)\n    } else {`
);

// 4. handleSubmit Validation
content = content.replace(
  /if \(!formData.numberOfBoys \|\| !formData.boyAmount \|\| !formData.eventDate\) {/g,
  `if (formData.dressedBoys === '' || formData.dressedBoyAmount === '' || formData.nonDressedBoys === '' || formData.nonDressedBoyAmount === '' || !formData.eventDate) {`
);

content = content.replace(
  /toast\.error\('Please enter number of boys, amount per boy, and event date'\)/g,
  `toast.error('Please enter details for all boys (use 0 if none) and the event date')`
);

content = content.replace(
  /setFormError\('Please enter number of boys, amount per boy, and event date'\)/g,
  `setFormError('Please enter details for all boys (use 0 if none) and the event date')`
);

// 5. calculationDetails Mapping
content = content.replace(
  /} else if \(formData.category === 'boys'\) {\s+calculationDetails.numberOfBoys = parseFloat\(formData.numberOfBoys\)\s+calculationDetails.perUnitAmount = parseFloat\(formData.boyAmount\)\s+}/g,
  `} else if (formData.category === 'boys') {\n        calculationDetails.dressedBoys = parseFloat(formData.dressedBoys) || 0\n        calculationDetails.dressedBoyAmount = parseFloat(formData.dressedBoyAmount) || 0\n        calculationDetails.nonDressedBoys = parseFloat(formData.nonDressedBoys) || 0\n        calculationDetails.nonDressedBoyAmount = parseFloat(formData.nonDressedBoyAmount) || 0\n      }`
);

// 6. Category Selection Reset
content = content.replace(
  /numberOfBoys: '',\s+boyAmount: '',\s+recipient: '',\s+selectedMealTypes: \[\],/g,
  `dressedBoys: '',\n                      dressedBoyAmount: '',\n                      nonDressedBoys: '',\n                      nonDressedBoyAmount: '',\n                      recipient: '',\n                      selectedMealTypes: [],`
);

// 7. Component DOM
const boysDOMRegex = /{\/\* Boys \*\/}\s+{\s*formData.category === 'boys' && \(\s*<>\s*<div className="grid grid-cols-1 md:grid-cols-3 gap-4">([\s\S]*?)<\/div>\s*<div className="bg-primary-50 border border-primary-200 rounded-lg p-4">\s*<p className="text-sm font-semibold text-primary-900">\s*Total Amount: {formatCurrency\(calculatedAmount\)}\s*<\/p>\s*<\/div>\s*<\/>\s*\)}/;

const newBoysDOM = "{/* Boys */}\n" +
"              {formData.category === 'boys' && (\n" +
"                <>\n" +
"                  <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">\n" +
"                    <div className=\"md:col-span-2 lg:col-span-4\">\n" +
"                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n" +
"                        Event Date *\n" +
"                      </label>\n" +
"                      <input\n" +
"                        type=\"date\"\n" +
"                        required\n" +
"                        value={formData.eventDate}\n" +
"                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}\n" +
"                        className=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"\n" +
"                      />\n" +
"                    </div>\n" +
"                    <div>\n" +
"                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n" +
"                        Dressed Boys *\n" +
"                      </label>\n" +
"                      <input\n" +
"                        type=\"number\"\n" +
"                        step=\"1\"\n" +
"                        required\n" +
"                        value={formData.dressedBoys}\n" +
"                        onChange={(e) => setFormData({ ...formData, dressedBoys: e.target.value })}\n" +
"                        className=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"\n" +
"                        placeholder=\"0\"\n" +
"                      />\n" +
"                    </div>\n" +
"                    <div>\n" +
"                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n" +
"                        Dressed Rate *\n" +
"                      </label>\n" +
"                      <input\n" +
"                        type=\"number\"\n" +
"                        step=\"0.01\"\n" +
"                        required\n" +
"                        value={formData.dressedBoyAmount}\n" +
"                        onChange={(e) => setFormData({ ...formData, dressedBoyAmount: e.target.value })}\n" +
"                        className=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"\n" +
"                        placeholder=\"0.00\"\n" +
"                      />\n" +
"                    </div>\n" +
"                    <div>\n" +
"                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n" +
"                        Non-Dressed Boys *\n" +
"                      </label>\n" +
"                      <input\n" +
"                        type=\"number\"\n" +
"                        step=\"1\"\n" +
"                        required\n" +
"                        value={formData.nonDressedBoys}\n" +
"                        onChange={(e) => setFormData({ ...formData, nonDressedBoys: e.target.value })}\n" +
"                        className=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"\n" +
"                        placeholder=\"0\"\n" +
"                      />\n" +
"                    </div>\n" +
"                    <div>\n" +
"                      <label className=\"block text-sm font-medium text-gray-700 mb-2\">\n" +
"                        Non-Dressed Rate *\n" +
"                      </label>\n" +
"                      <input\n" +
"                        type=\"number\"\n" +
"                        step=\"0.01\"\n" +
"                        required\n" +
"                        value={formData.nonDressedBoyAmount}\n" +
"                        onChange={(e) => setFormData({ ...formData, nonDressedBoyAmount: e.target.value })}\n" +
"                        className=\"w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500\"\n" +
"                        placeholder=\"0.00\"\n" +
"                      />\n" +
"                    </div>\n" +
"                  </div>\n" +
"                  <div className=\"bg-primary-50 border border-primary-200 rounded-lg p-4\">\n" +
"                    <p className=\"text-sm font-semibold text-primary-900\">\n" +
"                      Total Amount: {formatCurrency(calculatedAmount)}\n" +
"                    </p>\n" +
"                  </div>\n" +
"                </>\n" +
"              )}";

content = content.replace(boysDOMRegex, newBoysDOM);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated the file components');
