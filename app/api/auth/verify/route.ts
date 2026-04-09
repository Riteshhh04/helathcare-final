import { NextRequest, NextResponse } from 'next/server'
import { userDb, tokenDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find token in database
    const tokenRecord = await tokenDb.get(token)
    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update user to verified
    const user = await userDb.update(tokenRecord.user_id, { is_verified: true })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete used token
    await tokenDb.delete(token)

    return NextResponse.json({
      message: 'Email verified successfully. You can now log in.',
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
