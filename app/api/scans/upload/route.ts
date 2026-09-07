import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import { verifySession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { FREE_SCAN_LIMIT } from '@/lib/plan'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000'
const DB_NAME = process.env.MONGODB_DB_NAME || 'VeriTrust-AI'
const MAX_PDF_PREVIEW_BYTES = 5 * 1024 * 1024

let cachedClient: MongoClient | null = null

async function getClient() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI)
    await cachedClient.connect()
  }
  return cachedClient
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now()
  try {
    const token = req.cookies.get('veritrust_session')?.value
    const session = token ? await verifySession(token) : null

    const client = await getClient()
    const scansCollection = client.db(DB_NAME).collection('scans')

    if (session) {
      await connectDB()
      const user = await User.findById(session.userId).select('isPremium').lean<{ isPremium?: boolean }>()

      if (user && !user.isPremium) {
        const scanCount = await scansCollection.countDocuments({ userId: session.userId })
        if (scanCount >= FREE_SCAN_LIMIT) {
          return NextResponse.json(
            {
              success: false,
              error: `Free plan limit reached (${FREE_SCAN_LIMIT} verifications). Upgrade to Premium for unlimited verifications.`,
            },
            { status: 403 }
          )
        }
      }
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const caseId = (formData.get('caseId') as string | null) || null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

    const aiFormData = new FormData()
    aiFormData.append('file', file)

    let aiResult: any = null
    try {
      const aiResponse = await fetch(`${AI_ENGINE_URL}/analyze-file`, {
        method: 'POST',
        body: aiFormData,
      })

      if (!aiResponse.ok) {
        throw new Error(`AI Engine status ${aiResponse.status}`)
      }
      aiResult = await aiResponse.json()
    } catch (engineErr: any) {
      console.error('AI Service error:', engineErr.message)
      return NextResponse.json(
        { success: false, error: 'AI Service offline (verify uvicorn is running on :8000)' },
        { status: 502 }
      )
    }

    const scanId = `SCN-${Math.floor(1000 + Math.random() * 9000)}`
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    const isDoc = file.type.includes('pdf')
    const fileType = isVideo ? 'video' : isAudio ? 'audio' : isDoc ? 'document' : 'image'

    // File preview generation is real-content-derived: images/PDFs store the actual
    // uploaded bytes, video reuses the AI service's already-decoded first-frame
    // thumbnail, and audio gets a byte-derived amplitude waveform (both computed
    // server-side in ai-service where the decode capability actually lives).
    let filePreview: string | null = null
    let audioWaveform: number[] | null = null

    if (fileType === 'image') {
      filePreview = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`
    } else if (fileType === 'document' && buffer.length <= MAX_PDF_PREVIEW_BYTES) {
      filePreview = `data:application/pdf;base64,${buffer.toString('base64')}`
    } else if (fileType === 'video') {
      filePreview = aiResult.videoThumbnail || null
    } else if (fileType === 'audio') {
      audioWaveform = aiResult.waveformPreview || null
    }

    const scanRecord = {
      scanId,
      userId: session?.userId ?? null,
      caseId,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      mimeType: file.type || null,
      status: 'completed',
      score: aiResult.score ?? 75,
      verdict: aiResult.verdict ?? 'authentic',
      threat: aiResult.threat ?? 'None Detected',
      action: aiResult.action ?? 'Content Appears Safe',
      analysisCards: aiResult.analysisCards || [],
      visualArtifacts: aiResult.visualArtifacts || {},
      analysisDurationMs: aiResult.analysisDurationMs ?? Date.now() - requestStart,
      evidence: aiResult.evidence ?? null,
      breakdown: aiResult.breakdown ?? null,
      explanation: aiResult.explanation ?? [],
      riskAssessment: aiResult.riskAssessment ?? [],
      overallRisk: aiResult.overallRisk ?? null,
      fileMeta: aiResult.fileMeta ?? null,
      sha256,
      filePreview,
      audioWaveform,
      createdAt: new Date().toISOString(),
    }

    await scansCollection.insertOne(scanRecord)

    if (caseId && session) {
      await client
        .db(DB_NAME)
        .collection('cases')
        .updateOne(
          { caseId },
          {
            $addToSet: { scanIds: scanId },
            $setOnInsert: { caseId, userId: session.userId, createdAt: new Date().toISOString() },
          },
          { upsert: true }
        )
    }

    return NextResponse.json({
      success: true,
      scanId,
      scan: scanRecord,
    })
  } catch (err: any) {
    console.error('Upload route error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
