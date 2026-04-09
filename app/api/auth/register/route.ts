import { NextRequest, NextResponse } from 'next/server'
import { userDb, tokenDb, generateCokNumber } from '@/lib/db'
import { generateVerificationToken, generateId } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, address, dateOfBirth } = body

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

    // Hash password securely
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Generate verification token and COK number
    const verificationToken = generateVerificationToken()
    const cokNumber = generateCokNumber()
    const userId = generateId('patient')

    // Create new user in database
    const newUser = await userDb.create({
      id: userId,
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      role: 'patient',
      is_verified: false,
      cok_number: cokNumber,
      phone: phone || null,
      address: address || null,
      date_of_birth: dateOfBirth || null,
    })

    // Create verification token in database
    await tokenDb.create(verificationToken, newUser.id)

    // In production, send verification email via Nodemailer
    // For demo, we'll log the verification link
    console.log(`Verification link: /verify?token=${verificationToken}`)

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        cokNumber: newUser.cok_number,
      },
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
