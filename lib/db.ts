import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { User, Certificate } from './types'

const DB_PATH = path.join(process.cwd(), 'data', 'healthcare.db')

let db: any = null
let SQL: any = null
let initialized = false

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Initialize database
export async function initDb() {
  if (initialized && db) return db

  try {
    SQL = await initSqlJs()
    ensureDataDir()

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
      createTables()
    }

    initialized = true
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Create tables
function createTables() {
  if (!db) return

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'patient',
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      patient_email TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      issued_by TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      description TEXT,
      file_url TEXT,
      blockchain_hash TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (patient_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  saveDb()
}

// Save database to file
function saveDb() {
  if (!db) return
  try {
    ensureDataDir()
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  } catch (error) {
    console.error('Failed to save database:', error)
  }
}

// User operations
export const userStore = {
  getAll: async (): Promise<User[]> => {
    await initDb()
    try {
      const result = db.exec('SELECT * FROM users')
      if (result.length === 0) return []
      return result[0].values.map((row: any) => ({
        id: row[0],
        email: row[1],
        name: row[2],
        password: row[3],
        role: row[4],
        isVerified: Boolean(row[5]),
        verificationToken: row[6],
        createdAt: new Date(row[7]),
      }))
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  },

  getById: async (id: string): Promise<User | undefined> => {
    await initDb()
    try {
      const result = db.exec('SELECT * FROM users WHERE id = ?', [id])
      if (result.length === 0) return undefined
      const row = result[0].values[0]
      return {
        id: row[0],
        email: row[1],
        name: row[2],
        password: row[3],
        role: row[4],
        isVerified: Boolean(row[5]),
        verificationToken: row[6],
        createdAt: new Date(row[7]),
      }
    } catch (error) {
      console.error('Error getting user by id:', error)
      return undefined
    }
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    await initDb()
    try {
      const result = db.exec('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email])
      if (result.length === 0) return undefined
      const row = result[0].values[0]
      return {
        id: row[0],
        email: row[1],
        name: row[2],
        password: row[3],
        role: row[4],
        isVerified: Boolean(row[5]),
        verificationToken: row[6],
        createdAt: new Date(row[7]),
      }
    } catch (error) {
      console.error('Error getting user by email:', error)
      return undefined
    }
  },

  create: async (user: User): Promise<User> => {
    await initDb()
    try {
      db.run(
        'INSERT INTO users (id, email, name, password, role, is_verified, verification_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.name, user.password, user.role, user.isVerified ? 1 : 0, user.verificationToken || null, user.createdAt.toISOString()]
      )
      saveDb()
      return user
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  update: async (id: string, updates: Partial<User>): Promise<User | undefined> => {
    await initDb()
    try {
      const user = await userStore.getById(id)
      if (!user) return undefined

      const fields: string[] = []
      const values: any[] = []

      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'isVerified') {
          fields.push('is_verified = ?')
          values.push(value ? 1 : 0)
        } else if (key === 'verificationToken') {
          fields.push('verification_token = ?')
          values.push(value)
        } else if (key === 'createdAt') {
          fields.push('created_at = ?')
          values.push(value instanceof Date ? value.toISOString() : value)
        } else if (key !== 'id') {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      })

      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id)

      db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
      saveDb()

      return await userStore.getById(id)
    } catch (error) {
      console.error('Error updating user:', error)
      return undefined
    }
  },

  delete: async (id: string): Promise<boolean> => {
    await initDb()
    try {
      db.run('DELETE FROM users WHERE id = ?', [id])
      saveDb()
      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  },
}

// Certificate operations
export const certificateStore = {
  getAll: async (): Promise<Certificate[]> => {
    await initDb()
    try {
      const result = db.exec('SELECT * FROM certificates')
      if (result.length === 0) return []
      return result[0].values.map((row: any) => ({
        id: row[0],
        patientId: row[1],
        patientName: row[2],
        patientEmail: row[3],
        certificateType: row[4],
        issuedBy: row[5],
        issueDate: new Date(row[6]),
        expiryDate: row[7] ? new Date(row[7]) : undefined,
        description: row[8],
        fileUrl: row[9],
        blockchainHash: row[10],
        transactionId: row[11],
        status: row[12],
        createdAt: new Date(row[13]),
      }))
    } catch (error) {
      console.error('Error getting all certificates:', error)
      return []
    }
  },

  getById: async (id: string): Promise<Certificate | undefined> => {
    await initDb()
    try {
      const result = db.exec('SELECT * FROM certificates WHERE id = ?', [id])
      if (result.length === 0) return undefined
      const row = result[0].values[0]
      return {
        id: row[0],
        patientId: row[1],
        patientName: row[2],
        patientEmail: row[3],
        certificateType: row[4],
        issuedBy: row[5],
        issueDate: new Date(row[6]),
        expiryDate: row[7] ? new Date(row[7]) : undefined,
        description: row[8],
        fileUrl: row[9],
        blockchainHash: row[10],
        transactionId: row[11],
        status: row[12],
        createdAt: new Date(row[13]),
      }
    } catch (error) {
      console.error('Error getting certificate by id:', error)
      return undefined
    }
  },

  getByPatientId: async (patientId: string): Promise<Certificate[]> => {
    await initDb()
    try {
      const result = db.exec('SELECT * FROM certificates WHERE patient_id = ? ORDER BY created_at DESC', [patientId])
      if (result.length === 0) return []
      return result[0].values.map((row: any) => ({
        id: row[0],
        patientId: row[1],
        patientName: row[2],
        patientEmail: row[3],
        certificateType: row[4],
        issuedBy: row[5],
        issueDate: new Date(row[6]),
        expiryDate: row[7] ? new Date(row[7]) : undefined,
        description: row[8],
        fileUrl: row[9],
        blockchainHash: row[10],
        transactionId: row[11],
        status: row[12],
        createdAt: new Date(row[13]),
      }))
    } catch (error) {
      console.error('Error getting certificates by patient id:', error)
      return []
    }
  },

  getByHash: async (hash: string): Promise<Certificate | undefined> => {
    await initDb()
    try {
      const result = db.exec('SELECT * FROM certificates WHERE blockchain_hash = ?', [hash])
      if (result.length === 0) return undefined
      const row = result[0].values[0]
      return {
        id: row[0],
        patientId: row[1],
        patientName: row[2],
        patientEmail: row[3],
        certificateType: row[4],
        issuedBy: row[5],
        issueDate: new Date(row[6]),
        expiryDate: row[7] ? new Date(row[7]) : undefined,
        description: row[8],
        fileUrl: row[9],
        blockchainHash: row[10],
        transactionId: row[11],
        status: row[12],
        createdAt: new Date(row[13]),
      }
    } catch (error) {
      console.error('Error getting certificate by hash:', error)
      return undefined
    }
  },

  create: async (certificate: Certificate): Promise<Certificate> => {
    await initDb()
    try {
      db.run(
        'INSERT INTO certificates (id, patient_id, patient_name, patient_email, certificate_type, issued_by, issue_date, expiry_date, description, file_url, blockchain_hash, transaction_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
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
          certificate.blockchainHash,
          certificate.transactionId,
          certificate.status,
          certificate.createdAt.toISOString(),
        ]
      )
      saveDb()
      return certificate
    } catch (error) {
      console.error('Error creating certificate:', error)
      throw error
    }
  },

  update: async (id: string, updates: Partial<Certificate>): Promise<Certificate | undefined> => {
    await initDb()
    try {
      const cert = await certificateStore.getById(id)
      if (!cert) return undefined

      const fields: string[] = []
      const values: any[] = []

      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'patientId') {
          fields.push('patient_id = ?')
          values.push(value)
        } else if (key === 'patientName') {
          fields.push('patient_name = ?')
          values.push(value)
        } else if (key === 'patientEmail') {
          fields.push('patient_email = ?')
          values.push(value)
        } else if (key === 'certificateType') {
          fields.push('certificate_type = ?')
          values.push(value)
        } else if (key === 'issuedBy') {
          fields.push('issued_by = ?')
          values.push(value)
        } else if (key === 'issueDate' || key === 'expiryDate') {
          const column = key === 'issueDate' ? 'issue_date' : 'expiry_date'
          fields.push(`${column} = ?`)
          values.push(value instanceof Date ? value.toISOString().split('T')[0] : value)
        } else if (key === 'blockchainHash') {
          fields.push('blockchain_hash = ?')
          values.push(value)
        } else if (key === 'transactionId') {
          fields.push('transaction_id = ?')
          values.push(value)
        } else if (key !== 'id' && key !== 'createdAt') {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      })

      fields.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id)

      db.run(`UPDATE certificates SET ${fields.join(', ')} WHERE id = ?`, values)
      saveDb()

      return await certificateStore.getById(id)
    } catch (error) {
      console.error('Error updating certificate:', error)
      return undefined
    }
  },

  delete: async (id: string): Promise<boolean> => {
    await initDb()
    try {
      db.run('DELETE FROM certificates WHERE id = ?', [id])
      saveDb()
      return true
    } catch (error) {
      console.error('Error deleting certificate:', error)
      return false
    }
  },
}

// Token operations
export const tokenStore = {
  create: async (token: string, userId: string): Promise<void> => {
    await initDb()
    try {
      db.run('INSERT INTO verification_tokens (token, user_id, created_at) VALUES (?, ?, ?)', [token, userId, new Date().toISOString()])
      saveDb()
    } catch (error) {
      console.error('Error creating token:', error)
    }
  },

  get: async (token: string): Promise<string | undefined> => {
    await initDb()
    try {
      const result = db.exec('SELECT user_id FROM verification_tokens WHERE token = ?', [token])
      if (result.length === 0) return undefined
      return result[0].values[0][0]
    } catch (error) {
      console.error('Error getting token:', error)
      return undefined
    }
  },

  delete: async (token: string): Promise<boolean> => {
    await initDb()
    try {
      db.run('DELETE FROM verification_tokens WHERE token = ?', [token])
      saveDb()
      return true
    } catch (error) {
      console.error('Error deleting token:', error)
      return false
    }
  },
}

