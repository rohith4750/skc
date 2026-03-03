const fs = require('fs');

const targetFile = 'd:/WORKKKKK/skc/skc/app/orders/page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `                  <FaUser className="text-gray-400" /> Customer Details\r\n                </a>`;
const fallbackTargetStr = `                  <FaUser className="text-gray-400" /> Customer Details\n                </a>`;

const replacement = `                  <FaUser className="text-gray-400" /> Customer Details
                </a>
                {selectedCustomer && (
                  <div className="mx-3 px-3 py-2 mb-2 bg-primary-50/50 rounded-lg border border-primary-100 text-xs text-gray-600 space-y-0.5">
                    <p className="font-bold text-gray-800 text-[13px] border-b border-primary-100/50 pb-1 mb-1">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && <div className="flex items-center gap-2"><span>{selectedCustomer.phone}</span></div>}
                    {selectedCustomer.email && <div className="flex items-center gap-2 truncate" title={selectedCustomer.email}><span className="truncate">{selectedCustomer.email}</span></div>}
                    {selectedCustomer.address && <div className="flex flex-col mt-0.5 pt-0.5 border-t border-primary-100/50"><span className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">Address</span><span className="line-clamp-2" title={selectedCustomer.address}>{selectedCustomer.address}</span></div>}
                  </div>
                )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(targetFile, content);
  console.log('Patched with CRLF');
} else if (content.includes(fallbackTargetStr)) {
  content = content.replace(fallbackTargetStr, replacement);
  fs.writeFileSync(targetFile, content);
  console.log('Patched with LF');
} else {
  console.log('Target string not found');
}
