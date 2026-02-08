# Central Enquiry Management Document

## Project Title

Centralized Enquiry Integration between **skconline.in** and **skccaterers.in**

---

## 1. Overview

This document explains how enquiries submitted on **skconline.in** are centrally managed by the **skccaterers.in** website, which uses a **Next.js backend**. The objective is to ensure that all enquiries from multiple domains are collected, stored, and managed in a single system.

---

## 2. Objective

- Connect enquiry forms from **skconline.in** to the backend of **skccaterers.in**
- Store all enquiries in one database
- Enable email and WhatsApp notifications (optional)
- Track enquiries based on source domain
- Create a scalable, professional enquiry management system

---

## 3. System Architecture

User submits enquiry on skconline.in ->
API request sent to skccaterers.in ->
Next.js API route processes request ->
Enquiry saved in database ->
Notification sent (Email / WhatsApp)

---

## 4. Technology Stack

### Frontend (skconline.in)

- HTML / React
- Fetch or Axios for API calls

### Backend (skccaterers.in)

- Next.js (App Router or Pages Router)
- Node.js runtime
- Prisma ORM (recommended)
- PostgreSQL / Neon Database

### Notifications (Optional)

- Nodemailer (Email)
- Meta WhatsApp Cloud API

---

## 5. API Design

### API Endpoint

```
POST https://www.skccaterers.in/api/enquiry
```

### Request Payload

```
{
  "name": "Customer Name",
  "phone": "9876543210",
  "email": "customer@email.com",
  "subject": "Wedding Catering",
  "message": "Need catering for 300 people",
  "source": "skconline.in"
}
```

### API Responsibilities

- Validate request data
- Identify enquiry source domain
- Store enquiry in database
- Trigger notifications

---

## 6. Next.js Backend Implementation

### App Router Path

```
/app/api/enquiry/route.ts
```

### Key Logic

- Accept POST requests only
- Parse JSON body
- Save enquiry
- Return success / failure response

---

## 7. CORS Configuration

Since the request originates from another domain, CORS must allow:

- Origin: https://www.skconline.in
- Method: POST
- Headers: Content-Type

This ensures secure cross-domain communication.

---

## 8. Database Design (Recommended)

### Enquiry Table Fields

- id (Primary Key)
- name
- phone
- email
- subject
- message
- source (skconline.in / skccaterers.in)
- createdAt

This structure helps track enquiries domain-wise.

---

## 9. Frontend Integration (skconline.in)

- Enquiry form collects user details
- On submit, sends POST request to skccaterers.in API
- Displays success or error message to user

### ReactJS Integration (skconline.in repo)

Follow these steps in your React app (Vite/CRA/Next.js client component) to avoid frontend issues.

#### 1) Define the API URL (recommended)

Set a single source of truth so you can change it later without editing code.

```
VITE_ENQUIRY_API_URL=https://www.skccaterers.in/api/enquiry
```

If you are not using Vite, define a similar env variable (e.g. `REACT_APP_ENQUIRY_API_URL`).

#### 2) Create a small API helper

```jsx
export const submitEnquiry = async payload => {
  const response = await fetch(import.meta.env.VITE_ENQUIRY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Enquiry submission failed')
  }
  return data
}
```

#### 3) Use it in the form

```jsx
import { useState } from 'react'
import { submitEnquiry } from './api/enquiry'

const EnquiryForm = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', message: '' })

    try {
      await submitEnquiry({ ...form, source: 'skconline.in' })
      setStatus({ type: 'success', message: 'Enquiry submitted successfully.' })
      setForm({ name: '', phone: '', email: '', subject: '', message: '' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" required />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
      <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" required />
      <textarea name="message" value={form.message} onChange={handleChange} placeholder="Message" required />

      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Enquiry'}
      </button>

      {status.message && (
        <p style={{ color: status.type === 'success' ? 'green' : 'red' }}>
          {status.message}
        </p>
      )}
    </form>
  )
}

export default EnquiryForm
```

#### 4) Frontend safety checklist

- Always send all fields: `name`, `phone`, `email`, `subject`, `message`.
- Keep values as **non-empty strings**; the API validates them.
- Use HTTPS only and set `Content-Type: application/json`.
- Do not block the UI; show a loading state to prevent double submission.
- The backend already allows CORS for `https://www.skconline.in`.

---

## 10. Notifications (Optional Enhancements)

### Email

- Notify admin on every enquiry
- Include enquiry details and source domain

### WhatsApp

- Auto message to business number
- Confirmation message to customer

---

## 11. Security Considerations

- Input validation
- Rate limiting
- reCAPTCHA (optional)
- HTTPS only

---

## 12. Benefits of This Setup

- Single managing backend
- Supports multiple domains
- Centralized enquiry tracking
- Easy to scale and maintain
- Professional, corporate-level architecture

---

## 13. Future Enhancements

- Admin dashboard to view enquiries
- Status tracking (New / Contacted / Closed)
- Analytics by domain
- CRM integration

---

## 14. Conclusion

By using **skccaterers.in** as the central Next.js backend, all enquiries from **skconline.in** and other future domains can be efficiently managed in one place. This approach ensures scalability, professionalism, and ease of operations for the catering business.

---

**Prepared for:** Srivatsasa & Koundinya Caterers
