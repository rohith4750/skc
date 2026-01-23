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
