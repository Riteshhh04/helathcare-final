import { createClient } from '@/lib/supabase/server'

// Database types matching our Supabase schema
export interface DbUser {
  id: string
  email: string
  name: string
  password: string
  role: 'patient' | 'admin'
  is_verified: boolean
  verification_token: string | null
  created_at: string
}

export interface DbCertificate {
  id: string
  patient_id: string
  patient_name: string
  patient_email: string
  certificate_type: string
  issued_by: string
  issue_date: string
  expiry_date: string | null
  description: string
  file_url: string | null
  blockchain_hash: string | null
  transaction_id: string | null
  cok_number: string | null
  status: 'pending' | 'verified' | 'revoked'
  created_at: string
}

export interface DbVerificationToken {
  id: string
  token: string
  user_id: string
  expires_at: string
  created_at: string
}

// User operations
export const userDb = {
  async getAll(): Promise<DbUser[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<DbUser | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByEmail(email: string): Promise<DbUser | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(user: Omit<DbUser, 'created_at' | 'updated_at'>): Promise<DbUser> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<DbUser>): Promise<DbUser | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },
}

// Certificate operations
export const certificateDb = {
  async getAll(): Promise<DbCertificate[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<DbCertificate | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByPatientId(patientId: string): Promise<DbCertificate[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByHash(hash: string): Promise<DbCertificate | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('blockchain_hash', hash)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(certificate: Omit<DbCertificate, 'created_at' | 'updated_at'>): Promise<DbCertificate> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .insert(certificate)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<DbCertificate>): Promise<DbCertificate | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('certificates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },
}

// Verification token operations
export const tokenDb = {
  async create(token: string, userId: string, expiresInHours: number = 24): Promise<DbVerificationToken> {
    const supabase = await createClient()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresInHours)
    
    const { data, error } = await supabase
      .from('verification_tokens')
      .insert({
        token,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async get(token: string): Promise<DbVerificationToken | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async delete(token: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('verification_tokens')
      .delete()
      .eq('token', token)
    
    if (error) throw error
    return true
  },

  async deleteExpired(): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('verification_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
    
    if (error) throw error
    return true
  },
}

// Helper function to generate COK number
export function generateCokNumber(): string {
  const prefix = 'COK'
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${year}-${random}`
}
