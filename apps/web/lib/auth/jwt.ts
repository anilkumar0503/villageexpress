import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export type AccessTokenPayload = JWTPayload & {
  userId: string
  displayId: string
}

export type RefreshTokenPayload = JWTPayload & {
  userId: string
}

const accessSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!)
const refreshSecret = () => new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!)

export async function signAccessToken(payload: { userId: string; displayId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRY ?? '15m')
    .sign(accessSecret())
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.REFRESH_TOKEN_EXPIRY ?? '7d')
    .sign(refreshSecret())
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecret())
    return payload as AccessTokenPayload
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'JWTExpired') {
      throw new Error('TOKEN_EXPIRED')
    }
    throw err
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret())
  return payload as RefreshTokenPayload
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload as AccessTokenPayload
  } catch {
    return null
  }
}
