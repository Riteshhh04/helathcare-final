import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '..', 'data', 'healthcare.db')

async function setupDatabase() {
  console.log('Initializing database...')

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log(`Created data directory at ${dataDir}`)
  }

  const SQL = await initSqlJs()
  const db = new SQL.Database()

  // Create tables
  console.log('Creating tables...')
  db.run(`
    CREATE TABLE users (
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
    CREATE TABLE certificates (
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
    CREATE TABLE verification_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // Insert sample users
  console.log('Inserting sample data...')

  const now = new Date().toISOString()

  // Insert patients
  const patients = [
    { id: 'pat_001', email: 'john@patient.com', name: 'John Doe' },
    { id: 'pat_002', email: 'sarah@patient.com', name: 'Sarah Smith' },
    { id: 'pat_003', email: 'mike@patient.com', name: 'Mike Johnson' },
  ]

  patients.forEach(patient => {
    db.run(
      'INSERT INTO users (id, email, name, password, role, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patient.id, patient.email, patient.name, 'password123', 'patient', 1, now]
    )
  })

  // Insert admin user
  db.run('INSERT INTO users (id, email, name, password, role, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [
    'admin_001',
    'admin@hospital.com',
    'Hospital Admin',
    'admin123',
    'admin',
    1,
    now,
  ])

  // Insert sample certificates
  const certificates = [
    {
      id: 'cert_001',
      patientId: 'pat_001',
      name: 'COVID-19 Vaccination Certificate',
      type: 'vaccination',
      hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
      blockchain: 'ethereum',
      transactionId: '0x5a4b3c2d1e0f9g8h7i6j5k4l3m2n1o0p',
    },
    {
      id: 'cert_002',
      patientId: 'pat_001',
      name: 'Health Checkup Report',
      type: 'health_report',
      hash: '0x7h6i5j4k3l2m1n0o9p8q7r6s5t4u3v2w',
      blockchain: 'ethereum',
      transactionId: '0x2w1v0u3t4s5r6q7p8o9n0m1l2k3j4i5h',
    },
    {
      id: 'cert_003',
      patientId: 'pat_002',
      name: 'Blood Test Results',
      type: 'lab_test',
      hash: '0x9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p',
      blockchain: 'ethereum',
      transactionId: '0x4p5o6n7m8l9k0j1i2h3g4f5e6d7c8b9a',
    },
    {
      id: 'cert_004',
      patientId: 'pat_002',
      name: 'Flu Vaccination Certificate',
      type: 'vaccination',
      hash: '0x2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m',
      blockchain: 'ethereum',
      transactionId: '0x7m8l9k0j1i2h3g4f5e6d7c8b9a0x1y2z',
    },
    {
      id: 'cert_005',
      patientId: 'pat_003',
      name: 'X-Ray Report',
      type: 'imaging',
      hash: '0x8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c',
      blockchain: 'ethereum',
      transactionId: '0x3c4b5a0z9y8x7w6v5u4t3s2r1q0p9o8n',
    },
    {
      id: 'cert_006',
      patientId: 'pat_003',
      name: 'Diabetes Management Certificate',
      type: 'condition_management',
      hash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s',
      blockchain: 'ethereum',
      transactionId: '0x9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d',
    },
    {
      id: 'cert_007',
      patientId: 'pat_001',
      name: 'Annual Health Checkup',
      type: 'annual_checkup',
      hash: '0x5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j',
      blockchain: 'ethereum',
      transactionId: '0x0j1i2h3g4f5e6d7c8b9a0z1y2x3w4v5u',
    },
    {
      id: 'cert_008',
      patientId: 'pat_002',
      name: 'Mental Health Assessment',
      type: 'mental_health',
      hash: '0x6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z',
      blockchain: 'ethereum',
      transactionId: '0x1z0y9x8w7v6u5t4s3r2q1p0o9n8m7l6k',
    },
  ]

  const issuedDate = new Date()
  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)

  certificates.forEach(cert => {
    db.run(
      'INSERT INTO certificates (id, patient_id, patient_name, patient_email, certificate_type, issued_by, issue_date, expiry_date, description, blockchain_hash, transaction_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        cert.id,
        cert.patientId,
        patients.find(p => p.id === cert.patientId)?.name || 'Unknown',
        patients.find(p => p.id === cert.patientId)?.email || '',
        cert.type,
        'admin@hospital.com',
        issuedDate.toISOString().split('T')[0],
        expiryDate.toISOString().split('T')[0],
        `Sample ${cert.name} - Issued by Healthcare System`,
        cert.hash,
        cert.transactionId,
        'active',
        now,
      ]
    )
  })

  // Save database to file
  console.log('Saving database to file...')
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)

  console.log(`✓ Database initialized successfully at ${DB_PATH}`)
  console.log(`✓ Created 4 users (3 patients + 1 admin)`)
  console.log(`✓ Created 8 sample certificates`)
  console.log(`
Test Credentials:
- Patient 1: john@patient.com / password123
- Patient 2: sarah@patient.com / password123
- Patient 3: mike@patient.com / password123
- Admin: admin@hospital.com / admin123
  `)
}

setupDatabase().catch(console.error)
