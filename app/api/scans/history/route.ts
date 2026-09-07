import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { ScanRecord } from '@/lib/mock-data'
import { verifySession } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { FREE_HISTORY_DAYS, PREMIUM_HISTORY_DAYS } from '@/lib/plan'

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

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('veritrust_session')?.value
    const session = token ? await verifySession(token) : null

    if (!session) {
      return NextResponse.json({ success: true, scans: [] })
    }

    await connectDB()
    const user = await User.findById(session.userId).select('isPremium').lean<{ isPremium?: boolean }>()
    const isPremium = !!user?.isPremium
    const historyDays = isPremium ? PREMIUM_HISTORY_DAYS : FREE_HISTORY_DAYS
    const cutoff = new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000)

    const client = await getClient()
    const db = client.db(DB_NAME)

    const dbScans = await db
      .collection('scans')
      .find(
        { userId: session.userId, createdAt: { $gte: cutoff.toISOString() } },
        { projection: { visualArtifacts: 0 } }
      )
      .sort({ createdAt: -1, _id: -1 })
      .toArray()

    const caseCounts = new Map<string, number>()
    for (const s of dbScans) {
      if (s.caseId) caseCounts.set(s.caseId, (caseCounts.get(s.caseId) || 0) + 1)
    }

    const formattedDbScans: ScanRecord[] = dbScans.map((s) => {
      const id = s.scanId || s.id || String(s._id)
      const name = s.fileName || s.name || 'Scanned Media'
      const rawType = (s.fileType || s.type || 'image').toLowerCase()
      const type = rawType === 'pdf' ? 'document' : rawType

      // Send the raw ISO timestamp (with timezone) so the client can render it
      // in the viewer's local time instead of a fixed UTC string.
      let date = ''
      if (s.createdAt) {
        try {
          date = new Date(s.createdAt).toISOString()
        } catch {
          date = String(s.createdAt)
        }
      }

      return {
        id,
        name,
        type: type as any,
        score: typeof s.score === 'number' ? s.score : 80,
        verdict: s.verdict || 'authentic',
        threat: s.threat || 'None Detected',
        date,
        caseId: s.caseId && (caseCounts.get(s.caseId) || 0) >= 2 ? s.caseId : undefined,
      }
    })

    return NextResponse.json({ success: true, scans: formattedDbScans })
  } catch (error) {
    console.error('Scan history query failed:', error)
    return NextResponse.json({ success: true, scans: [] })
  }
}
