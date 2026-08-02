const fs = require('fs');
const path = require('path');

// 1. Read environment variables from .env or .env.production
function loadEnv() {
  const envFiles = ['.env.production', '.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?([^"'\r\n]+)["']?/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2];
        }
      });
    }
  }
}

loadEnv();

const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Target test phone number passed via command line or default test number
const testPhone = process.argv[2] || '917396531079'; 

console.log('==================================================');
console.log('📱 TESTING META WHATSAPP CLOUD API SENDING');
console.log('==================================================');
console.log(`• Phone Number ID: ${phoneNumberId}`);
console.log(`• Token (starts with): ${token ? token.substring(0, 15) + '...' : 'MISSING'}`);
console.log(`• Target Phone Number: ${testPhone}`);
console.log('--------------------------------------------------');

if (!token || !phoneNumberId || phoneNumberId === 'your_phone_id_here') {
  console.error('❌ ERROR: Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID in environment files.');
  process.exit(1);
}

function formatWhatsAppPhone(phone) {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10 && !clean.startsWith('91')) {
    clean = '91' + clean;
  }
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  return clean;
}

async function testWhatsAppSend() {
  const cleanPhone = formatWhatsAppPhone(testPhone);
  const messageBody = `*SRIVATSASA & KOWNDINYA CATERERS* 🍽️\nThis is a test notification from SKC Management System.\n\nTime: ${new Date().toLocaleString()}\nStatus: WhatsApp API is Active! ✅`;

  console.log('Sending message to Meta Graph API...');

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: messageBody
        }
      })
    });

    const data = await response.json();

    console.log('--------------------------------------------------');
    console.log(`HTTP Response Code: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('🎉 SUCCESS! Meta WhatsApp API sent the message!');
      console.log('Message Details:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ ERROR sending WhatsApp message:');
      console.error(JSON.stringify(data, null, 2));
      console.log('\n💡 Tip: If using Meta Sandbox Test Number, the recipient phone number must be added to "To" list in Meta Developers Dashboard under Step 1.');
    }
  } catch (error) {
    console.error('❌ Network / Exception Error:', error);
  }
  console.log('==================================================\n');
}

testWhatsAppSend();
