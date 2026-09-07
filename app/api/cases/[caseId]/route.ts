import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { verifySession } from '@/lib/auth'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = process.env.MONGODB_DB_NAME || 'VeriTrust-AI'

let cachedClient: MongoClient | null = null

async function getClient() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI)
    await cachedClient.connect()
  }
  return cachedClient
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stddev(values: number[]): number {
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await context.params
    const token = req.cookies.get('veritrust_session')?.value
    const session = token ? await verifySession(token) : null

    if (!session) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const client = await getClient()
    const db = client.db(DB_NAME)

    const caseDoc = await db.collection('cases').findOne({ caseId, userId: session.userId })

    if (!caseDoc) {
      return NextResponse.json({ success: false, message: 'Case not found' }, { status: 404 })
    }

    const scans = await db
      .collection('scans')
      .find(
        { scanId: { $in: caseDoc.scanIds || [] }, userId: session.userId },
        { projection: { visualArtifacts: 0 } }
      )
      .sort({ createdAt: 1 })
      .toArray()

    if (scans.length === 0) {
      return NextResponse.json({ success: false, message: 'No scans found for this case' }, { status: 404 })
    }

    const scores: number[] = scans.map((s) => (typeof s.score === 'number' ? s.score : 0))
    const verdicts = new Set(scans.map((s) => s.verdict))
    const divergence = scans.length > 1 ? Math.round(stddev(scores) * 10) / 10 : 0

    let unifiedScore = Math.round(mean(scores) - Math.min(30, divergence * 0.8))
    unifiedScore = Math.max(10, Math.min(99, unifiedScore))
    const caseVerdict = unifiedScore >= 70 ? 'authentic' : unifiedScore >= 45 ? 'suspicious' : 'deepfake'
    const consistency =
      verdicts.size <= 1 ? 'Consistent' : 'Inconsistent — mixed signals across files in this case'

    // Only compare real embedded dates the AI service actually extracted (image EXIF,
    // PDF /CreationDate) — never fabricate a timestamp for types that don't carry one.
    const timestampEntries = scans
      .map((s) => {
        const raw = s.fileMeta?.capturedAt || s.fileMeta?.createdAt
        if (!raw) return null
        const parsed = new Date(raw)
        if (Number.isNaN(parsed.getTime())) return null
        return { fileName: s.fileName, scanId: s.scanId, timestamp: parsed.toISOString() }
      })
      .filter((e): e is { fileName: string; scanId: string; timestamp: string } => e !== null)

    let timestampComparison: { entries: typeof timestampEntries; spanHours: number } | null = null
    if (timestampEntries.length >= 2) {
      const times = timestampEntries.map((e) => new Date(e.timestamp).getTime())
      const spanHours = Math.round(((Math.max(...times) - Math.min(...times)) / (1000 * 60 * 60)) * 10) / 10
      timestampComparison = { entries: timestampEntries, spanHours }
    }

    return NextResponse.json({
      success: true,
      case: {
        caseId,
        createdAt: caseDoc.createdAt,
        scans,
        unifiedScore,
        caseVerdict,
        consistency,
        divergence,
        timestampComparison,
      },
    })
  } catch (error) {
    console.error('Case fetch error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
