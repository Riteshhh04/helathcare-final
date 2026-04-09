import { NextRequest, NextResponse } from 'next/server'
import { certificateDb } from '@/lib/db'
import { blockchainService } from '@/lib/blockchain'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hash, certificateId } = body

    if (!hash && !certificateId) {
      return NextResponse.json(
        { error: 'Certificate hash or ID is required' },
        { status: 400 }
      )
    }

    let certificate = null
    let searchHash = hash

    if (certificateId) {
      certificate = await certificateDb.getById(certificateId)
      if (certificate) {
        searchHash = certificate.blockchain_hash
      }
    } else if (hash) {
      certificate = await certificateDb.getByHash(hash)
    }

    if (!searchHash) {
      return NextResponse.json({
        isValid: false,
        message: 'Certificate not found in database',
      })
    }

    // Verify on blockchain
    const blockchainResult = await blockchainService.verifyCertificate(searchHash)

    if (blockchainResult.isValid && certificate) {
      return NextResponse.json({
        isValid: true,
        certificate: {
          id: certificate.id,
          patientName: certificate.patient_name,
          certificateType: certificate.certificate_type,
          issuedBy: certificate.issued_by,
          issueDate: certificate.issue_date,
          expiryDate: certificate.expiry_date,
          description: certificate.description,
          status: certificate.status,
        },
        blockchain: {
          hash: searchHash,
          transactionId: blockchainResult.transaction?.transactionId,
          blockNumber: blockchainResult.transaction?.blockNumber,
          timestamp: blockchainResult.transaction?.timestamp,
        },
        message: 'Certificate is valid and verified on blockchain',
      })
    }

    return NextResponse.json({
      isValid: false,
      message: blockchainResult.message || 'Certificate verification failed',
    })
  } catch (error) {
    console.error('Certificate verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
