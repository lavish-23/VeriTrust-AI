import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Receipt from '@/models/Receipt'
import { verifySession } from '@/lib/auth'

const PREMIUM_AMOUNT = 299
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('veritrust_session')?.value

    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const session = await verifySession(token)

    if (!session) {
      return NextResponse.json({ success: false, message: 'Invalid or expired session' }, { status: 401 })
    }

    let receipt: File | null = null
    try {
      const formData = await req.formData()
      receipt = formData.get('receipt') as File | null
    } catch {
      receipt = null
    }

    if (!receipt) {
      return NextResponse.json({ success: false, message: 'Please upload your payment receipt' }, { status: 400 })
    }

    if (receipt.size > MAX_RECEIPT_BYTES) {
      return NextResponse.json({ success: false, message: 'Receipt image is too large (max 5MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await receipt.arrayBuffer())
    const imageData = `data:${receipt.type || 'image/jpeg'};base64,${buffer.toString('base64')}`

    await connectDB()

    await Receipt.create({
      userId: session.userId,
      amount: PREMIUM_AMOUNT,
      imageData,
    })

    const user = await User.findByIdAndUpdate(
      session.userId,
      { isPremium: true, premiumSince: new Date() },
      { returnDocument: 'after' }
    ).select('-password')

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Upgraded to Premium',
      user: {
        id: user._id.toString(),
        isPremium: user.isPremium,
        premiumSince: user.premiumSince,
      },
    })
  } catch (error) {
    console.error('Billing upgrade error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 })
  }
}
