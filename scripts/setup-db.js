import fs from 'fs'
import path from 'path'
import os from 'os'

// Use a writable location for the database
const DATA_DIR = path.join(os.homedir(), '.v0-healthcare-data')
const DB_FILE = path.join(DATA_DIR, 'healthcare.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      console.log(`Created data directory at ${DATA_DIR}`)
    } catch (err) {
      console.error(`Failed to create directory: ${err.message}`)
      process.exit(1)
    }
  }
}

async function setupDatabase() {
  console.log('Initializing database...')
  ensureDataDir()

  const now = new Date().toISOString()
  const issuedDate = new Date()
  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 1)

  const dbData = {
    users: [
      {
        id: 'pat_001',
        email: 'john@patient.com',
        name: 'John Doe',
        password: 'password123',
        role: 'patient',
        isVerified: true,
        verificationToken: null,
        createdAt: now,
      },
      {
        id: 'pat_002',
        email: 'sarah@patient.com',
        name: 'Sarah Smith',
        password: 'password123',
        role: 'patient',
        isVerified: true,
        verificationToken: null,
        createdAt: now,
      },
      {
        id: 'pat_003',
        email: 'mike@patient.com',
        name: 'Mike Johnson',
        password: 'password123',
        role: 'patient',
        isVerified: true,
        verificationToken: null,
        createdAt: now,
      },
      {
        id: 'admin_001',
        email: 'admin@hospital.com',
        name: 'Hospital Admin',
        password: 'admin123',
        role: 'admin',
        isVerified: true,
        verificationToken: null,
        createdAt: now,
      },
    ],
    certificates: [
      {
        id: 'cert_001',
        patientId: 'pat_001',
        patientName: 'John Doe',
        patientEmail: 'john@patient.com',
        certificateType: 'vaccination',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'COVID-19 Vaccination Certificate',
        fileUrl: null,
        blockchainHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
        transactionId: '0x5a4b3c2d1e0f9g8h7i6j5k4l3m2n1o0p',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cert_002',
        patientId: 'pat_001',
        patientName: 'John Doe',
        patientEmail: 'john@patient.com',
        certificateType: 'health_report',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'Health Checkup Report',
        fileUrl: null,
        blockchainHash: '0x7h6i5j4k3l2m1n0o9p8q7r6s5t4u3v2w',
        transactionId: '0x2w1v0u3t4s5r6q7p8o9n0m1l2k3j4i5h',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cert_003',
        patientId: 'pat_002',
        patientName: 'Sarah Smith',
        patientEmail: 'sarah@patient.com',
        certificateType: 'lab_test',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'Blood Test Results',
        fileUrl: null,
        blockchainHash: '0x9a8b7c6d5e4f3g2h1i0j9k8l7m6n5o4p',
        transactionId: '0x4p5o6n7m8l9k0j1i2h3g4f5e6d7c8b9a',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cert_004',
        patientId: 'pat_002',
        patientName: 'Sarah Smith',
        patientEmail: 'sarah@patient.com',
        certificateType: 'vaccination',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'Flu Vaccination Certificate',
        fileUrl: null,
        blockchainHash: '0x2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m',
        transactionId: '0x7m8l9k0j1i2h3g4f5e6d7c8b9a0x1y2z',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cert_005',
        patientId: 'pat_003',
        patientName: 'Mike Johnson',
        patientEmail: 'mike@patient.com',
        certificateType: 'imaging',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'X-Ray Report',
        fileUrl: null,
        blockchainHash: '0x8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c',
        transactionId: '0x3c4b5a0z9y8x7w6v5u4t3s2r1q0p9o8n',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cert_006',
        patientId: 'pat_003',
        patientName: 'Mike Johnson',
        patientEmail: 'mike@patient.com',
        certificateType: 'condition_management',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'Diabetes Management Certificate',
        fileUrl: null,
        blockchainHash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s',
        transactionId: '0x9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cert_007',
        patientId: 'pat_001',
        patientName: 'John Doe',
        patientEmail: 'john@patient.com',
        certificateType: 'annual_checkup',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'Annual Health Checkup',
        fileUrl: null,
        blockchainHash: '0x5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j',
        transactionId: '0x0j1i2h3g4f5e6d7c8b9a0z1y2x3w4v5u',
        status: 'active',
        createdAt: now,
      },
      {
        id: 'cert_008',
        patientId: 'pat_002',
        patientName: 'Sarah Smith',
        patientEmail: 'sarah@patient.com',
        certificateType: 'mental_health',
        issuedBy: 'admin@hospital.com',
        issueDate: issuedDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        description: 'Mental Health Assessment',
        fileUrl: null,
        blockchainHash: '0x6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z',
        transactionId: '0x1z0y9x8w7v6u5t4s3r2q1p0o9n8m7l6k',
        status: 'active',
        createdAt: now,
      },
    ],
    verificationTokens: [],
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2))

  console.log(`\n✓ Database initialized successfully at ${DB_FILE}`)
  console.log(`✓ Created 4 users (3 patients + 1 admin)`)
  console.log(`✓ Created 8 sample certificates with blockchain hashes and transaction IDs\n`)
  console.log(`Test Credentials:`)
  console.log(`- Patient 1: john@patient.com / password123`)
  console.log(`- Patient 2: sarah@patient.com / password123`)
  console.log(`- Patient 3: mike@patient.com / password123`)
  console.log(`- Admin: admin@hospital.com / admin123\n`)
}

setupDatabase().catch(console.error)
