import fs from 'fs'
import path from 'path'
import os from 'os'
import { User, Certificate } from './types'

const DATA_DIR = path.join(os.homedir(), '.v0-healthcare-data')
const DB_FILE = path.join(DATA_DIR, 'healthcare.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Initialize database file if it doesn't exist
function initializeDbFile() {
  ensureDataDir()
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      certificates: [],
      verificationTokens: [],
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2))
  }
}

// Read database
function readDb() {
  initializeDbFile()
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading database:', error)
    return { users: [], certificates: [], verificationTokens: [] }
  }
}

// Write database
function writeDb(data: any) {
  try {
    ensureDataDir()
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing database:', error)
  }
}

// User operations
export const userStore = {
  getAll: async (): Promise<User[]> => {
    const db = readDb()
    return db.users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
    }))
  },

  getById: async (id: string): Promise<User | undefined> => {
    const db = readDb()
    const user = db.users.find((u: any) => u.id === id)
    if (!user) return undefined
    return {
      ...user,
      createdAt: new Date(user.createdAt),
    }
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    const db = readDb()
    const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return undefined
    return {
      ...user,
      createdAt: new Date(user.createdAt),
    }
  },

  create: async (user: User): Promise<User> => {
    const db = readDb()
    db.users.push({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })
    writeDb(db)
    return user
  },

  update: async (id: string, updates: Partial<User>): Promise<User | undefined> => {
    const db = readDb()
    const userIndex = db.users.findIndex((u: any) => u.id === id)
    if (userIndex === -1) return undefined

    const updatedUser = {
      ...db.users[userIndex],
      ...updates,
      createdAt: db.users[userIndex].createdAt,
      id: db.users[userIndex].id,
    }

    db.users[userIndex] = updatedUser
    writeDb(db)

    return {
      ...updatedUser,
      createdAt: new Date(updatedUser.createdAt),
    }
  },

  delete: async (id: string): Promise<boolean> => {
    const db = readDb()
    const initialLength = db.users.length
    db.users = db.users.filter((u: any) => u.id !== id)
    if (db.users.length < initialLength) {
      writeDb(db)
      return true
    }
    return false
  },
}

// Certificate operations
export const certificateStore = {
  getAll: async (): Promise<Certificate[]> => {
    const db = readDb()
    return db.certificates.map((cert: any) => ({
      ...cert,
      issueDate: new Date(cert.issueDate),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      createdAt: new Date(cert.createdAt),
    }))
  },

  getById: async (id: string): Promise<Certificate | undefined> => {
    const db = readDb()
    const cert = db.certificates.find((c: any) => c.id === id)
    if (!cert) return undefined
    return {
      ...cert,
      issueDate: new Date(cert.issueDate),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      createdAt: new Date(cert.createdAt),
    }
  },

  getByPatientId: async (patientId: string): Promise<Certificate[]> => {
    const db = readDb()
    return db.certificates
      .filter((c: any) => c.patientId === patientId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((cert: any) => ({
        ...cert,
        issueDate: new Date(cert.issueDate),
        expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
        createdAt: new Date(cert.createdAt),
      }))
  },

  getByHash: async (hash: string): Promise<Certificate | undefined> => {
    const db = readDb()
    const cert = db.certificates.find((c: any) => c.blockchainHash === hash)
    if (!cert) return undefined
    return {
      ...cert,
      issueDate: new Date(cert.issueDate),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      createdAt: new Date(cert.createdAt),
    }
  },

  create: async (certificate: Certificate): Promise<Certificate> => {
    const db = readDb()
    db.certificates.push({
      ...certificate,
      issueDate: certificate.issueDate.toISOString(),
      expiryDate: certificate.expiryDate ? certificate.expiryDate.toISOString() : null,
      createdAt: certificate.createdAt.toISOString(),
    })
    writeDb(db)
    return certificate
  },

  update: async (id: string, updates: Partial<Certificate>): Promise<Certificate | undefined> => {
    const db = readDb()
    const certIndex = db.certificates.findIndex((c: any) => c.id === id)
    if (certIndex === -1) return undefined

    const updatedCert = {
      ...db.certificates[certIndex],
      ...updates,
      issueDate: db.certificates[certIndex].issueDate,
      createdAt: db.certificates[certIndex].createdAt,
      id: db.certificates[certIndex].id,
    }

    db.certificates[certIndex] = updatedCert
    writeDb(db)

    return {
      ...updatedCert,
      issueDate: new Date(updatedCert.issueDate),
      expiryDate: updatedCert.expiryDate ? new Date(updatedCert.expiryDate) : undefined,
      createdAt: new Date(updatedCert.createdAt),
    }
  },

  delete: async (id: string): Promise<boolean> => {
    const db = readDb()
    const initialLength = db.certificates.length
    db.certificates = db.certificates.filter((c: any) => c.id !== id)
    if (db.certificates.length < initialLength) {
      writeDb(db)
      return true
    }
    return false
  },
}

// Token operations
export const tokenStore = {
  create: async (token: string, userId: string): Promise<void> => {
    const db = readDb()
    db.verificationTokens.push({
      token,
      userId,
      createdAt: new Date().toISOString(),
    })
    writeDb(db)
  },

  get: async (token: string): Promise<string | undefined> => {
    const db = readDb()
    const tokenRecord = db.verificationTokens.find((t: any) => t.token === token)
    return tokenRecord?.userId
  },

  delete: async (token: string): Promise<boolean> => {
    const db = readDb()
    const initialLength = db.verificationTokens.length
    db.verificationTokens = db.verificationTokens.filter((t: any) => t.token !== token)
    if (db.verificationTokens.length < initialLength) {
      writeDb(db)
      return true
    }
    return false
  },
}

