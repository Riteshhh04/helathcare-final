import { NextRequest, NextResponse } from 'next/server'
import { userDb } from '@/lib/db'
import { decodeSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  console.log('[v0] Users API - Session cookie:', sessionCookie?.value ? 'present' : 'missing')
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  
  console.log('[v0] Users API - Decoded session:', session)
  
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
  
  if (session.role !== 'admin') {
    console.log('[v0] Users API - Role check failed, role:', session.role)
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const allUsers = await userDb.getAll()
  const users = allUsers
    .filter(u => u.role === 'patient')
    .map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
    }))

  return NextResponse.json({ users })
}
