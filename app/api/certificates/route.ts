import { NextRequest, NextResponse } from 'next/server'
import { certificateDb, userDb, DbCertificate } from '@/lib/db'
import { blockchainService } from '@/lib/blockchain'
import { decodeSession, generateId } from '@/lib/session'

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  
  if (!session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  try {
    let certificates: DbCertificate[]

    if (session.role === 'admin') {
      certificates = await certificateDb.getAll()
    } else {
      certificates = await certificateDb.getByPatientId(session.userId)
    }

    // Map to frontend format
    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      patientId: cert.patient_id,
      patientName: cert.patient_name,
      patientEmail: cert.patient_email,
      certificateType: cert.certificate_type,
      issuedBy: cert.issued_by,
      issueDate: cert.issue_date,
      expiryDate: cert.expiry_date,
      description: cert.description,
      fileUrl: cert.file_url,
      blockchainHash: cert.blockchain_hash,
      transactionId: cert.transaction_id,
      status: cert.status,
      createdAt: cert.created_at,
    }))

    return NextResponse.json({ certificates: formattedCertificates })
  } catch (error) {
    console.error('Failed to fetch certificates:', error)
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { patientId, certificateType, issuedBy, issueDate, expiryDate, description } = body

    if (!patientId || !certificateType || !issuedBy || !issueDate || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get patient details from database
    const patient = await userDb.getById(patientId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const certId = generateId('cert')

    // Store on blockchain
    const blockchainResult = await blockchainService.storeCertificate({
      certificateId: certId,
      patientId,
      certificateType,
      issuedBy,
      issueDate: new Date(issueDate),
    })

    // Create certificate in database
    const certificate = await certificateDb.create({
      id: certId,
      patient_id: patientId,
      patient_name: patient.name,
      patient_email: patient.email,
      certificate_type: certificateType,
      issued_by: issuedBy,
      issue_date: new Date(issueDate).toISOString(),
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      description,
      file_url: null,
      blockchain_hash: blockchainResult.hash,
      transaction_id: blockchainResult.transactionId,
      status: 'verified',
    })

    // Map to frontend format
    const formattedCertificate = {
      id: certificate.id,
      patientId: certificate.patient_id,
      patientName: certificate.patient_name,
      patientEmail: certificate.patient_email,
      certificateType: certificate.certificate_type,
      issuedBy: certificate.issued_by,
      issueDate: certificate.issue_date,
      expiryDate: certificate.expiry_date,
      description: certificate.description,
      blockchainHash: certificate.blockchain_hash,
      transactionId: certificate.transaction_id,
      status: certificate.status,
      createdAt: certificate.created_at,
    }

    return NextResponse.json({
      message: 'Certificate created and stored on blockchain',
      certificate: formattedCertificate,
      blockchain: blockchainResult,
    })
  } catch (error) {
    console.error('Failed to create certificate:', error)
    return NextResponse.json(
      { error: 'Failed to create certificate' },
      { status: 500 }
    )
  }
}
