import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isNonEmptyString } from '@/lib/validation'
import { publishNotification } from '@/lib/notifications'
import { createAccessToken, createRefreshToken } from '@/lib/jwt'

const REFRESH_COOKIE_NAME = 'refreshToken'
const REFRESH_DAYS = 7
const REFRESH_DAYS_REMEMBER = 30

// Parse user agent to get device info
function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' }
  
  // Detect device type
  let device = 'Desktop'
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/iPad|Tablet/i.test(userAgent)) {
      device = 'Tablet'
    } else {
      device = 'Mobile'
    }
  }
  
  // Detect browser
  let browser = 'Unknown'
  if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Edg')) browser = 'Edge'
  else if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera'
  else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer'
  
  // Detect OS
  let os = 'Unknown'
  if (userAgent.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac OS X')) os = 'macOS'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  
  return { device, browser, os }
}

export async function POST(request: NextRequest) {
  // Get client info
  const userAgent = request.headers.get('user-agent')
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0] || realIp || 'Unknown'
  
  const { device, browser, os } = parseUserAgent(userAgent)
  
  try {
    const { username, password, rememberMe } = await request.json()

    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      }
    })

    if (!user) {
      // Log failed login attempt (user not found)
      try {
        await (prisma as any).loginAuditLog.create({
          data: {
            userId: 'unknown',
            username: username,
            ipAddress,
            userAgent,
            device,
            browser,
            os,
            success: false,
            failReason: 'User not found or inactive',
          }
        })
      } catch (e) {
        // Ignore if table doesn't exist yet
      }
      
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      // Log failed login attempt (wrong password)
      try {
        await (prisma as any).loginAuditLog.create({
          data: {
            userId: user.id,
            username: user.username,
            ipAddress,
            userAgent,
            device,
            browser,
            os,
            success: false,
            failReason: 'Invalid password',
          }
        })
      } catch (e) {
        // Ignore if table doesn't exist yet
      }
      
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Log successful login
    try {
      await (prisma as any).loginAuditLog.create({
        data: {
          userId: user.id,
          username: user.username,
          ipAddress,
          userAgent,
          device,
          browser,
          os,
          success: true,
        }
      })
    } catch (e) {
      // Ignore if table doesn't exist yet
      console.log('Login audit log not available:', e)
    }

    publishNotification({
      type: 'auth',
      title: 'User login',
      message: `${user.username} logged in from ${device} (${browser} on ${os})`,
      entityId: user.id,
      severity: 'info',
    })

    const role = (user.role || 'admin') as string
    const accessToken = await createAccessToken({
      userId: user.id,
      username: user.username,
      role,
    })
    const refreshToken = await createRefreshToken(user.id, !!rememberMe)
    const maxAgeDays = rememberMe ? REFRESH_DAYS_REMEMBER : REFRESH_DAYS
    const maxAgeSeconds = maxAgeDays * 24 * 60 * 60

    // Return user data (NOT tokens - they're in httpOnly cookies)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role,
      },
    })

    // Set access token in httpOnly cookie (15 minutes)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    // Set refresh token in httpOnly cookie (7 or 30 days)
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAgeSeconds,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
