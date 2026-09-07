import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { verifySession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('veritrust_session')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    const session = await verifySession(token)

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired session',
        },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById(session.userId)
      .select('-password')
      .lean()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        email: user.email,
        provider: user.provider,
        isPremium: !!user.isPremium,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error('GET /api/auth/me error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Authentication check failed',
      },
      { status: 500 }
    )
  }
}