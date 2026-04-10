import { NextRequest, NextResponse } from 'next/server'
import { userDb, tokenDb } from '@/lib/db'
import { generateVerificationToken, generateId } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await userDb.getByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create new user
    const newUser = await userDb.create({
      id: generateId('patient'),
      email: email.toLowerCase(),
      name,
      password, // In production, hash this with bcrypt
      role: 'patient',
      isVerified: false,
      verificationToken,
    })

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    await tokenDb.create(verificationToken, newUser.id)

    // In production, send verification email via Nodemailer
    // For demo, we'll auto-verify after a delay
    console.log(`Verification link: /verify?token=${verificationToken}`)

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      verificationToken, // Only for demo - remove in production
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
