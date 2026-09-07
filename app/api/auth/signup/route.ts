import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      organization,
      email,
      password,
    } = body

    if (
      !firstName ||
      !lastName ||
      !organization ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'All fields are required',
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 8 characters',
        },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    await connectDB()

    const existingUser = await User.findOne({
      email: normalizedEmail,
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'An account with this email already exists',
        },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      organization: organization.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      provider: 'credentials',
    })

    const token = await createSession({
      userId: user._id.toString(),
      email: user.email,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          organization: user.organization,
          email: user.email,
        },
      },
      { status: 201 }
    )

    response.cookies.set('veritrust_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong while creating the account',
      },
      { status: 500 }
    )
  }
}