const apiUrl =
  process.env.API_URL?.trim() || 'https://www.skccaterers.in/api/enquiry'

const payload = {
  name: 'Test Customer',
  phone: '9876543210',
  email: 'test.customer@example.com',
  subject: 'Test Enquiry',
  message: 'This is a test enquiry from the CLI script.',
  source: 'skconline.in',
}

const run = async () => {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  console.log('Status:', response.status)
  console.log('Body:', text)
}

run().catch(error => {
  console.error('Request failed:', error)
  process.exit(1)
})
