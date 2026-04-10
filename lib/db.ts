import { createClient } from '@/lib/supabase/server'
import { User, Certificate } from './types'

// Database types that match Supabase schema (snake_case)
interface DbUser {
  id: string
  email: string
  name: string
  password: string
  role: 'patient' | 'admin'
  is_verified: boolean
  verification_token: string | null
  created_at: string
}

interface DbCertificate {
  id: string
  patient_id: string
  patient_name: string
  patient_email: string
  certificate_type: string
  issued_by: string
  issue_date: string
  expiry_date: string | null
  description: string | null
  file_url: string | null
  blockchain_hash: string | null
  transaction_id: string | null
  status: 'pending' | 'verified' | 'revoked'
  created_at: string
}

interface DbVerificationToken {
  id: string
  token: string
  user_id: string
  created_at: string
  expires_at: string
}

// Convert database user to application user
function toUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    password: dbUser.password,
    role: dbUser.role,
    isVerified: dbUser.is_verified,
    verificationToken: dbUser.verification_token || undefined,
    createdAt: new Date(dbUser.created_at),
  }
}

// Convert database certificate to application certificate
function toCertificate(dbCert: DbCertificate): Certificate {
  return {
    id: dbCert.id,
    patientId: dbCert.patient_id,
    patientName: dbCert.patient_name,
    patientEmail: dbCert.patient_email,
    certificateType: dbCert.certificate_type,
    issuedBy: dbCert.issued_by,
    issueDate: new Date(dbCert.issue_date),
    expiryDate: dbCert.expiry_date ? new Date(dbCert.expiry_date) : undefined,
    description: dbCert.description || '',
    fileUrl: dbCert.file_url || undefined,
    blockchainHash: dbCert.blockchain_hash || undefined,
    transactionId: dbCert.transaction_id || undefined,
    status: dbCert.status,
    createdAt: new Date(dbCert.created_at),
  }
}

// User operations
export const userDb = {
  async getAll(): Promise<User[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return []
    }
    
    return (data as DbUser[]).map(toUser)
  },

  async getById(id: string): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return toUser(data as DbUser)
  },

  async getByEmail(email: string): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return toUser(data as DbUser)
  },

  async create(user: Omit<User, 'createdAt'>): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        password: user.password,
        role: user.role,
        is_verified: user.isVerified,
        verification_token: user.verificationToken || null,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', error)
      return null
    }
    
    return toUser(data as DbUser)
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const supabase = await createClient()
    
    // Convert camelCase to snake_case for update
    const dbUpdates: Partial<DbUser> = {}
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.password !== undefined) dbUpdates.password = updates.password
    if (updates.role !== undefined) dbUpdates.role = updates.role
    if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified
    if (updates.verificationToken !== undefined) dbUpdates.verification_token = updates.verificationToken || null
    
    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
      return null
    }
    
    return toUser(data as DbUser)
  },

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    return !error
  },
}

// Certificate operations
export const certificateDb = {
  async getAll(): Promise<Certificate[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching certificates:', error)
      return []
    }
    
    return (data as DbCertificate[]).map(toCertificate)
  },

  async getById(id: string): Promise<Certificate | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return toCertificate(data as DbCertificate)
  },

  async getByPatientId(patientId: string): Promise<Certificate[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching certificates:', error)
      return []
    }
    
    return (data as DbCertificate[]).map(toCertificate)
  },

  async getByHash(hash: string): Promise<Certificate | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('blockchain_hash', hash)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return toCertificate(data as DbCertificate)
  },

  async create(certificate: Omit<Certificate, 'createdAt'>): Promise<Certificate | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        id: certificate.id,
        patient_id: certificate.patientId,
        patient_name: certificate.patientName,
        patient_email: certificate.patientEmail,
        certificate_type: certificate.certificateType,
        issued_by: certificate.issuedBy,
        issue_date: certificate.issueDate.toISOString(),
        expiry_date: certificate.expiryDate?.toISOString() || null,
        description: certificate.description || null,
        file_url: certificate.fileUrl || null,
        blockchain_hash: certificate.blockchainHash || null,
        transaction_id: certificate.transactionId || null,
        status: certificate.status,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating certificate:', error)
      return null
    }
    
    return toCertificate(data as DbCertificate)
  },

  async update(id: string, updates: Partial<Certificate>): Promise<Certificate | null> {
    const supabase = await createClient()
    
    const dbUpdates: Partial<DbCertificate> = {}
    if (updates.patientId !== undefined) dbUpdates.patient_id = updates.patientId
    if (updates.patientName !== undefined) dbUpdates.patient_name = updates.patientName
    if (updates.patientEmail !== undefined) dbUpdates.patient_email = updates.patientEmail
    if (updates.certificateType !== undefined) dbUpdates.certificate_type = updates.certificateType
    if (updates.issuedBy !== undefined) dbUpdates.issued_by = updates.issuedBy
    if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate.toISOString()
    if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate?.toISOString() || null
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.fileUrl !== undefined) dbUpdates.file_url = updates.fileUrl || null
    if (updates.blockchainHash !== undefined) dbUpdates.blockchain_hash = updates.blockchainHash || null
    if (updates.transactionId !== undefined) dbUpdates.transaction_id = updates.transactionId || null
    if (updates.status !== undefined) dbUpdates.status = updates.status
    
    const { data, error } = await supabase
      .from('certificates')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating certificate:', error)
      return null
    }
    
    return toCertificate(data as DbCertificate)
  },

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id)
    
    return !error
  },
}

// Verification token operations
export const tokenDb = {
  async create(token: string, userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('verification_tokens')
      .insert({
        token,
        user_id: userId,
      })
    
    if (error) {
      console.error('Error creating token:', error)
      return false
    }
    
    return true
  },

  async get(token: string): Promise<string | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single()
    
    if (error || !data) {
      return null
    }
    
    // Check if token is expired
    const tokenData = data as DbVerificationToken
    if (new Date(tokenData.expires_at) < new Date()) {
      return null
    }
    
    return tokenData.user_id
  },

  async delete(token: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('verification_tokens')
      .delete()
      .eq('token', token)
    
    return !error
  },
}
