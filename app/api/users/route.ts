import { NextRequest, NextResponse } from 'next/server'
import { userDb } from '@/lib/db'
import { decodeSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
  
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const allUsers = await userDb.getAll()
    const users = allUsers
      .filter(u => u.role === 'patient')
      .map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        isVerified: u.is_verified,
        cokNumber: u.cok_number,
        phone: u.phone,
        createdAt: u.created_at,
      }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
