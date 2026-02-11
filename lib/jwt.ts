/**
 * JWT: access token (short-lived), refresh token (long-lived).
 * Access: default 15m, signed with JWT_SECRET.
 * Refresh: default 7d (or 30d if remember me), signed with JWT_REFRESH_SECRET.
 */

import * as jose from 'jose'

const ACCESS_TOKEN_DEFAULT_MS = 15 * 60 * 1000 // 15 minutes
const REFRESH_TOKEN_DAYS = 7
const REFRESH_TOKEN_DAYS_REMEMBER = 30

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set and at least 16 characters')
  }
  return new TextEncoder().encode(secret)
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('JWT_REFRESH_SECRET must be set and at least 16 characters')
  }
  return new TextEncoder().encode(secret)
}

export interface AccessPayload {
  sub: string // userId
  username: string
  role: string
  iat?: number
  exp?: number
}

export interface RefreshPayload {
  sub: string // userId
  iat?: number
  exp?: number
}

/** Create access token (default 15m). */
export async function createAccessToken(payload: {
  userId: string
  username: string
  role: string
}): Promise<string> {
  const secret = getAccessSecret()
  return new jose.SignJWT({
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_TOKEN_DEFAULT_MS / 1000)
    .sign(secret)
}

/** Create refresh token (7d or 30d if rememberMe). */
export async function createRefreshToken(
  userId: string,
  rememberMe: boolean = false
): Promise<string> {
  const days = rememberMe ? REFRESH_TOKEN_DAYS_REMEMBER : REFRESH_TOKEN_DAYS
  const secret = getRefreshSecret()
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret)
}

/** Verify access token; returns payload or throws. */
export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  const secret = getAccessSecret()
  const { payload } = await jose.jwtVerify(token, secret)
  return {
    sub: payload.sub as string,
    username: (payload.username as string) ?? '',
    role: (payload.role as string) ?? 'admin',
    iat: payload.iat as number,
    exp: payload.exp as number,
  }
}

/** Verify refresh token; returns payload or throws. */
export async function verifyRefreshToken(token: string): Promise<RefreshPayload> {
  const secret = getRefreshSecret()
  const { payload } = await jose.jwtVerify(token, secret)
  return {
    sub: payload.sub as string,
    iat: payload.iat as number,
    exp: payload.exp as number,
  }
}
