import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    await connectDB()

    const user = await User.findOne({
      email: normalizedEmail,
    }).select('+password')

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    user.lastLogin = new Date()
    await user.save()

    const token = await createSession({
      userId: user._id.toString(),
      email: user.email,
    })

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        email: user.email,
      },
    })

    response.cookies.set('veritrust_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong while logging in',
      },
      { status: 500 }
    )
  }
}