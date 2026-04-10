import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { User, Certificate } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'data', 'healthcare.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('foreign_keys = ON')
  }
  return db
}

// User operations
export const userStore = {
  getAll: (): User[] => {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, email, name, password, role, is_verified as isVerified, 
             verification_token as verificationToken, created_at as createdAt
      FROM users
    `)
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
    }))
  },

  getById: (id: string): User | undefined => {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, email, name, password, role, is_verified as isVerified, 
             verification_token as verificationToken, created_at as createdAt
      FROM users WHERE id = ?
    `)
    const row = stmt.get(id) as any
    if (!row) return undefined
    return {
      ...row,
      createdAt: new Date(row.createdAt),
    }
  },

  getByEmail: (email: string): User | undefined => {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, email, name, password, role, is_verified as isVerified, 
             verification_token as verificationToken, created_at as createdAt
      FROM users WHERE LOWER(email) = LOWER(?)
    `)
    const row = stmt.get(email) as any
    if (!row) return undefined
    return {
      ...row,
      createdAt: new Date(row.createdAt),
    }
  },

  create: (user: User): User => {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO users (id, email, name, password, role, is_verified, verification_token, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      user.id,
      user.email,
      user.name,
      user.password,
      user.role,
      user.isVerified ? 1 : 0,
      user.verificationToken || null,
      user.createdAt.toISOString()
    )
    return user
  },

  update: (id: string, updates: Partial<User>): User | undefined => {
    const db = getDb()
    const user = userStore.getById(id)
    if (!user) return undefined

    const updateFields = Object.entries(updates)
      .map(([key]) => {
        if (key === 'isVerified') return 'is_verified = ?'
        if (key === 'verificationToken') return 'verification_token = ?'
        if (key === 'createdAt') return 'created_at = ?'
        return `${key} = ?`
      })
      .join(', ')

    const values = Object.entries(updates).map(([key, value]) => {
      if (key === 'isVerified') return value ? 1 : 0
      if (key === 'createdAt' && value instanceof Date) return value.toISOString()
      return value
    })

    const stmt = db.prepare(`UPDATE users SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    stmt.run(...values, id)

    return userStore.getById(id)
  },

  delete: (id: string): boolean => {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return (result.changes ?? 0) > 0
  },
}

// Certificate operations
export const certificateStore = {
  getAll: (): Certificate[] => {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, patient_id as patientId, patient_name as patientName, patient_email as patientEmail,
             certificate_type as certificateType, issued_by as issuedBy, issue_date as issueDate,
             expiry_date as expiryDate, description, file_url as fileUrl, blockchain_hash as blockchainHash,
             transaction_id as transactionId, status, created_at as createdAt
      FROM certificates
    `)
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      ...row,
      issueDate: new Date(row.issueDate),
      expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
      createdAt: new Date(row.createdAt),
    }))
  },

  getById: (id: string): Certificate | undefined => {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, patient_id as patientId, patient_name as patientName, patient_email as patientEmail,
             certificate_type as certificateType, issued_by as issuedBy, issue_date as issueDate,
             expiry_date as expiryDate, description, file_url as fileUrl, blockchain_hash as blockchainHash,
             transaction_id as transactionId, status, created_at as createdAt
      FROM certificates WHERE id = ?
    `)
    const row = stmt.get(id) as any
    if (!row) return undefined
    return {
      ...row,
      issueDate: new Date(row.issueDate),
      expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
      createdAt: new Date(row.createdAt),
    }
  },

  getByPatientId: (patientId: string): Certificate[] => {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, patient_id as patientId, patient_name as patientName, patient_email as patientEmail,
             certificate_type as certificateType, issued_by as issuedBy, issue_date as issueDate,
             expiry_date as expiryDate, description, file_url as fileUrl, blockchain_hash as blockchainHash,
             transaction_id as transactionId, status, created_at as createdAt
      FROM certificates WHERE patient_id = ?
      ORDER BY created_at DESC
    `)
    const rows = stmt.all(patientId) as any[]
    return rows.map(row => ({
      ...row,
      issueDate: new Date(row.issueDate),
      expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
      createdAt: new Date(row.createdAt),
    }))
  },

  getByHash: (hash: string): Certificate | undefined => {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT id, patient_id as patientId, patient_name as patientName, patient_email as patientEmail,
             certificate_type as certificateType, issued_by as issuedBy, issue_date as issueDate,
             expiry_date as expiryDate, description, file_url as fileUrl, blockchain_hash as blockchainHash,
             transaction_id as transactionId, status, created_at as createdAt
      FROM certificates WHERE blockchain_hash = ?
    `)
    const row = stmt.get(hash) as any
    if (!row) return undefined
    return {
      ...row,
      issueDate: new Date(row.issueDate),
      expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
      createdAt: new Date(row.createdAt),
    }
  },

  create: (certificate: Certificate): Certificate => {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO certificates (
        id, patient_id, patient_name, patient_email, certificate_type,
        issued_by, issue_date, expiry_date, description, file_url,
        blockchain_hash, transaction_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      certificate.id,
      certificate.patientId,
      certificate.patientName,
      certificate.patientEmail,
      certificate.certificateType,
      certificate.issuedBy,
      certificate.issueDate.toISOString().split('T')[0],
      certificate.expiryDate ? certificate.expiryDate.toISOString().split('T')[0] : null,
      certificate.description,
      certificate.fileUrl || null,
      certificate.blockchainHash || null,
      certificate.transactionId || null,
      certificate.status,
      certificate.createdAt.toISOString()
    )
    return certificate
  },

  update: (id: string, updates: Partial<Certificate>): Certificate | undefined => {
    const db = getDb()
    const cert = certificateStore.getById(id)
    if (!cert) return undefined

    const updateFields = Object.entries(updates)
      .map(([key]) => {
        if (key === 'patientId') return 'patient_id = ?'
        if (key === 'patientName') return 'patient_name = ?'
        if (key === 'patientEmail') return 'patient_email = ?'
        if (key === 'certificateType') return 'certificate_type = ?'
        if (key === 'issuedBy') return 'issued_by = ?'
        if (key === 'issueDate') return 'issue_date = ?'
        if (key === 'expiryDate') return 'expiry_date = ?'
        if (key === 'fileUrl') return 'file_url = ?'
        if (key === 'blockchainHash') return 'blockchain_hash = ?'
        if (key === 'transactionId') return 'transaction_id = ?'
        if (key === 'createdAt') return 'created_at = ?'
        return `${key} = ?`
      })
      .join(', ')

    const values = Object.entries(updates).map(([key, value]) => {
      if (key === 'issueDate' && value instanceof Date) return value.toISOString().split('T')[0]
      if (key === 'expiryDate') {
        if (value === null || value === undefined) return null
        if (value instanceof Date) return value.toISOString().split('T')[0]
      }
      if (key === 'createdAt' && value instanceof Date) return value.toISOString()
      return value ?? null
    })

    const stmt = db.prepare(`UPDATE certificates SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    stmt.run(...values, id)

    return certificateStore.getById(id)
  },

  delete: (id: string): boolean => {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM certificates WHERE id = ?')
    const result = stmt.run(id)
    return (result.changes ?? 0) > 0
  },
}

// Verification token operations
export const tokenStore = {
  create: (token: string, userId: string): void => {
    const db = getDb()
    const stmt = db.prepare('INSERT INTO verification_tokens (token, user_id) VALUES (?, ?)')
    stmt.run(token, userId)
  },

  get: (token: string): string | undefined => {
    const db = getDb()
    const stmt = db.prepare('SELECT user_id as userId FROM verification_tokens WHERE token = ?')
    const row = stmt.get(token) as any
    return row?.userId
  },

  delete: (token: string): boolean => {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM verification_tokens WHERE token = ?')
    const result = stmt.run(token)
    return (result.changes ?? 0) > 0
  },
}
