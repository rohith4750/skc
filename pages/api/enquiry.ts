import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { isEmail, isNonEmptyString, isPhone, validateRequiredFields } from '@/lib/validation'

const allowedOrigins = new Set([
  'https://www.skconline.in',
  'https://skconline.in',
  'https://www.skccaterers.in',
  'https://skccaterers.in',
])

const allowedMethods = 'POST, OPTIONS'
const allowedHeaders = 'Content-Type'

const setCorsHeaders = (res: NextApiResponse, origin: string | null) => {
  if (!origin) return false
  if (!allowedOrigins.has(origin)) return false

  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', allowedMethods)
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders)
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Vary', 'Origin')
  return true
}

const normalizeSource = (value: string) => {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return 'unknown'

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)
    return url.hostname
  } catch {
    return trimmed
  }
}

const buildSource = (origin: string | null, fallbackHost: string | null, bodySource: unknown) => {
  if (isNonEmptyString(bodySource)) return normalizeSource(bodySource)
  if (isNonEmptyString(origin)) return normalizeSource(origin)
  if (isNonEmptyString(fallbackHost)) return normalizeSource(fallbackHost)
  return 'unknown'
}

const parseBody = (body: unknown) => {
  if (!body) return null
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return null
    }
  }
  if (typeof body === 'object') return body as Record<string, unknown>
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : null
  const corsAllowed = setCorsHeaders(res, origin)
  if (origin && !corsAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', allowedMethods)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const data = parseBody(req.body)
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const missingFields = validateRequiredFields(data, ['name', 'phone', 'email', 'subject', 'message'])
  if (missingFields) {
    return res.status(400).json({ error: 'Missing required fields', details: missingFields })
  }

  if (!isEmail(data.email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  if (!isPhone(data.phone)) {
    return res.status(400).json({ error: 'Invalid phone number' })
  }

  try {
    const source = buildSource(origin, req.headers.host ?? null, data.source)
    const enquiry = await (prisma as any).enquiry.create({
      data: {
        name: (data.name as string).trim(),
        phone: (data.phone as string).trim(),
        email: (data.email as string).trim(),
        subject: (data.subject as string).trim(),
        message: (data.message as string).trim(),
        source,
      },
      select: {
        id: true,
        createdAt: true,
        source: true,
      },
    }) as { id: string; createdAt: Date; source: string }

    return res
      .status(201)
      .json({ success: true, enquiryId: enquiry.id, createdAt: enquiry.createdAt, source: enquiry.source })
  } catch (error) {
    console.error('Error creating enquiry:', error)
    return res.status(500).json({ error: 'Failed to create enquiry' })
  }
}
