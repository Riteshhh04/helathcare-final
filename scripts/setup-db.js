const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Create database directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'healthcare.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Create tables
console.log('Creating database tables...')

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('patient', 'admin')),
    is_verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Certificates table
db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    certificate_type TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    description TEXT,
    file_url TEXT,
    blockchain_hash TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'revoked')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

// Verification tokens table
db.exec(`
  CREATE TABLE IF NOT EXISTS verification_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

console.log('Database tables created successfully')

// Insert sample data
console.log('Inserting sample data...')

const adminStmt = db.prepare(`
  INSERT OR IGNORE INTO users (id, email, name, password, role, is_verified, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

adminStmt.run('admin-001', 'admin@healthcare.com', 'System Administrator', 'admin123', 'admin', 1, new Date().toISOString())

const samplePatients = [
  { id: 'patient-001', email: 'john.doe@email.com', name: 'John Doe', created_at: '2024-01-15T00:00:00Z' },
  { id: 'patient-002', email: 'jane.smith@email.com', name: 'Jane Smith', created_at: '2024-02-20T00:00:00Z' },
  { id: 'patient-003', email: 'mike.johnson@email.com', name: 'Mike Johnson', created_at: '2024-03-10T00:00:00Z' },
]

samplePatients.forEach((patient) => {
  adminStmt.run(patient.id, patient.email, patient.name, 'password123', 'patient', 1, patient.created_at)
})

// Insert sample certificates
const certStmt = db.prepare(`
  INSERT OR IGNORE INTO certificates (
    id, patient_id, patient_name, patient_email, certificate_type, issued_by,
    issue_date, expiry_date, description, blockchain_hash, transaction_id, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const sampleCerts = [
  {
    id: 'cert-001',
    patient_id: 'patient-001',
    patient_name: 'John Doe',
    patient_email: 'john.doe@email.com',
    certificate_type: 'COVID-19 Vaccination',
    issued_by: 'City General Hospital',
    issue_date: '2024-01-20',
    expiry_date: null,
    description: 'Full vaccination course completed - Pfizer-BioNTech. Two doses administered as per WHO guidelines.',
    blockchain_hash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    transaction_id: '0xabc123def456789abc123def456789abc123def456789',
    status: 'verified',
    created_at: '2024-01-20T00:00:00Z',
  },
  {
    id: 'cert-002',
    patient_id: 'patient-001',
    patient_name: 'John Doe',
    patient_email: 'john.doe@email.com',
    certificate_type: 'Medical Fitness Certificate',
    issued_by: 'HealthCare Plus Clinic',
    issue_date: '2024-02-15',
    expiry_date: '2025-02-15',
    description: 'Annual medical fitness examination - All parameters normal. Fit for employment and travel purposes.',
    blockchain_hash: '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    transaction_id: '0xdef789ghi012345def789ghi012345def789ghi012345',
    status: 'verified',
    created_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'cert-003',
    patient_id: 'patient-002',
    patient_name: 'Jane Smith',
    patient_email: 'jane.smith@email.com',
    certificate_type: 'Blood Donation Certificate',
    issued_by: 'Red Cross Blood Bank',
    issue_date: '2024-03-01',
    expiry_date: null,
    description: 'Voluntary blood donation - Type O+. 450ml whole blood collected successfully.',
    blockchain_hash: '0x3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278',
    transaction_id: '0xghi345jkl678901ghi345jkl678901ghi345jkl678901',
    status: 'verified',
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'cert-004',
    patient_id: 'patient-001',
    patient_name: 'John Doe',
    patient_email: 'john.doe@email.com',
    certificate_type: 'Hepatitis B Vaccination',
    issued_by: 'Metro Health Center',
    issue_date: '2024-04-10',
    expiry_date: null,
    description: 'Hepatitis B vaccination series completed. Three-dose regimen administered over 6 months.',
    blockchain_hash: '0x4a5c6d7e8f90a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    transaction_id: '0xjkl901mno234567jkl901mno234567jkl901mno234567',
    status: 'verified',
    created_at: '2024-04-10T00:00:00Z',
  },
  {
    id: 'cert-005',
    patient_id: 'patient-002',
    patient_name: 'Jane Smith',
    patient_email: 'jane.smith@email.com',
    certificate_type: 'Allergy Test Report',
    issued_by: 'Allergy & Immunology Specialists',
    issue_date: '2024-05-22',
    expiry_date: '2026-05-22',
    description: 'Comprehensive allergy panel test completed. Identified allergies: Peanuts, Dust Mites. No drug allergies detected.',
    blockchain_hash: '0x5b6c7d8e9f01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7',
    transaction_id: '0xmno567pqr890123mno567pqr890123mno567pqr890123',
    status: 'verified',
    created_at: '2024-05-22T00:00:00Z',
  },
  {
    id: 'cert-006',
    patient_id: 'patient-003',
    patient_name: 'Mike Johnson',
    patient_email: 'mike.johnson@email.com',
    certificate_type: 'Eye Examination Certificate',
    issued_by: 'Vision Care Eye Hospital',
    issue_date: '2024-06-15',
    expiry_date: '2025-06-15',
    description: 'Complete eye examination performed. Visual acuity: 20/20 both eyes. No signs of glaucoma or cataracts.',
    blockchain_hash: '0x6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    transaction_id: '0xpqr123stu456789pqr123stu456789pqr123stu456789',
    status: 'verified',
    created_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'cert-007',
    patient_id: 'patient-001',
    patient_name: 'John Doe',
    patient_email: 'john.doe@email.com',
    certificate_type: 'Mental Health Assessment',
    issued_by: 'MindCare Psychiatric Center',
    issue_date: '2024-07-08',
    expiry_date: null,
    description: 'Psychological evaluation completed. No signs of depression or anxiety disorders. Mentally fit for work.',
    blockchain_hash: '0x7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
    transaction_id: '0xstu789vwx012345stu789vwx012345stu789vwx012345',
    status: 'verified',
    created_at: '2024-07-08T00:00:00Z',
  },
  {
    id: 'cert-008',
    patient_id: 'patient-002',
    patient_name: 'Jane Smith',
    patient_email: 'jane.smith@email.com',
    certificate_type: 'Dental Clearance Certificate',
    issued_by: 'SmileCare Dental Clinic',
    issue_date: '2024-08-20',
    expiry_date: null,
    description: 'Complete dental examination and cleaning performed. No cavities or gum disease detected. Oral hygiene: Excellent.',
    blockchain_hash: '0x8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
    transaction_id: '0xvwx345yza678901vwx345yza678901vwx345yza678901',
    status: 'verified',
    created_at: '2024-08-20T00:00:00Z',
  },
]

sampleCerts.forEach((cert) => {
  certStmt.run(
    cert.id,
    cert.patient_id,
    cert.patient_name,
    cert.patient_email,
    cert.certificate_type,
    cert.issued_by,
    cert.issue_date,
    cert.expiry_date,
    cert.description,
    cert.blockchain_hash,
    cert.transaction_id,
    cert.status,
    cert.created_at
  )
})

console.log('Sample data inserted successfully')

// Close database connection
db.close()

console.log(`Database initialized at: ${dbPath}`)
