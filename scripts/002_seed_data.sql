-- Seed initial data for the healthcare application
-- Password for all users is 'password123' hashed with bcrypt (12 rounds)
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4WryflDBIz1l2S8G

-- Insert admin user
INSERT INTO users (id, email, name, password_hash, role, is_verified, cok_number)
VALUES (
  'admin-001',
  'admin@healthcare.com',
  'System Administrator',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4WryflDBIz1l2S8G',
  'admin',
  true,
  'COK-2024-ADMIN01'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample patients
INSERT INTO users (id, email, name, password_hash, role, is_verified, cok_number, phone, address, date_of_birth)
VALUES 
  (
    'patient-001',
    'john.doe@email.com',
    'John Doe',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4WryflDBIz1l2S8G',
    'patient',
    true,
    'COK-2024-JD0001',
    '+1-555-0101',
    '123 Main Street, New York, NY 10001',
    '1990-05-15'
  ),
  (
    'patient-002',
    'jane.smith@email.com',
    'Jane Smith',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4WryflDBIz1l2S8G',
    'patient',
    true,
    'COK-2024-JS0002',
    '+1-555-0102',
    '456 Oak Avenue, Los Angeles, CA 90001',
    '1985-08-22'
  ),
  (
    'patient-003',
    'mike.johnson@email.com',
    'Mike Johnson',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4WryflDBIz1l2S8G',
    'patient',
    false,
    'COK-2024-MJ0003',
    '+1-555-0103',
    '789 Pine Road, Chicago, IL 60601',
    '1995-12-01'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample certificates
INSERT INTO certificates (id, patient_id, patient_name, patient_email, certificate_type, issued_by, issue_date, expiry_date, description, blockchain_hash, transaction_id, status)
VALUES
  (
    'cert-001',
    'patient-001',
    'John Doe',
    'john.doe@email.com',
    'COVID-19 Vaccination',
    'City General Hospital',
    '2024-01-20',
    NULL,
    'Full vaccination course completed - Pfizer-BioNTech. Two doses administered as per WHO guidelines.',
    '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    '0xabc123def456789abc123def456789abc123def456789',
    'verified'
  ),
  (
    'cert-002',
    'patient-001',
    'John Doe',
    'john.doe@email.com',
    'Medical Fitness Certificate',
    'HealthCare Plus Clinic',
    '2024-02-15',
    '2025-02-15',
    'Annual medical fitness examination - All parameters normal. Fit for employment and travel purposes.',
    '0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    '0xdef789ghi012345def789ghi012345def789ghi012345',
    'verified'
  ),
  (
    'cert-003',
    'patient-002',
    'Jane Smith',
    'jane.smith@email.com',
    'Blood Donation Certificate',
    'Red Cross Blood Bank',
    '2024-03-01',
    NULL,
    'Voluntary blood donation - Type O+. 450ml whole blood collected successfully.',
    '0x3fdba35f04dc8c462986c992bcf875546257113072a909c162f7e470e581e278',
    '0xghi345jkl678901ghi345jkl678901ghi345jkl678901',
    'verified'
  ),
  (
    'cert-004',
    'patient-001',
    'John Doe',
    'john.doe@email.com',
    'Hepatitis B Vaccination',
    'Metro Health Center',
    '2024-04-10',
    NULL,
    'Hepatitis B vaccination series completed. Three-dose regimen administered over 6 months.',
    '0x4a5c6d7e8f90a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    '0xjkl901mno234567jkl901mno234567jkl901mno234567',
    'verified'
  ),
  (
    'cert-005',
    'patient-002',
    'Jane Smith',
    'jane.smith@email.com',
    'Allergy Test Report',
    'Allergy & Immunology Specialists',
    '2024-05-22',
    '2026-05-22',
    'Comprehensive allergy panel test completed. Identified allergies: Peanuts, Dust Mites. No drug allergies detected.',
    '0x5b6c7d8e9f01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7',
    '0xmno567pqr890123mno567pqr890123mno567pqr890123',
    'verified'
  ),
  (
    'cert-006',
    'patient-003',
    'Mike Johnson',
    'mike.johnson@email.com',
    'Eye Examination Certificate',
    'Vision Care Eye Hospital',
    '2024-06-15',
    '2025-06-15',
    'Complete eye examination performed. Visual acuity: 20/20 both eyes. No signs of glaucoma or cataracts.',
    '0x6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
    '0xpqr123stu456789pqr123stu456789pqr123stu456789',
    'verified'
  )
ON CONFLICT (id) DO NOTHING;
