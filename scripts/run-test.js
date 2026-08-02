const token = 'EAAS2ncHkfD0BSLd7vgJT7hHFlu2VVzvvk2qyk8ZBy4WDZC0h6ZBkVnwsMCoMK9lkZC0IolGUFv2n4mZB7Vt7pCzHmN0TMMjZCggsZBtn8QiSg7Az4HY6VZCRTlYxRGNAoUBvHKluwqmB7ELJi4e4Oz0joNZAk9ZATLLAPZBCIQp1IuzPXcViUY8zHJJaIamhEoqpUl7DXFH0ZCs186xeqIj1MdmVDglgRgD6ZBIuNkm5y2BDJV5NzbxTZCqoj9QGKdXq0l3U8222lehZC2AddGrCANMmpo1MjaT';
const phoneId = '989505087581896';
const targetPhone = '919866525102';

async function test() {
  console.log('Sending Meta WhatsApp Message to', targetPhone, '...');

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: targetPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: '*SRIVATSASA & KOUNDINYA CATERERS* 🍽️\n\nHello! Your Meta WhatsApp Cloud API integration for SKC Caterers Management System is 100% active and working perfectly! ✅\n\nTime: ' + new Date().toLocaleString()
      }
    })
  });

  const data = await res.json();
  console.log('HTTP Status Code:', res.status);
  console.log('API Response:', JSON.stringify(data, null, 2));
}

test();
