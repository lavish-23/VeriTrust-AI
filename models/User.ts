import mongoose, { Schema, Model } from 'mongoose'

export type AuthProvider = 'credentials' | 'google'

export interface IUser {
  firstName: string
  lastName: string
  organization: string
  email: string
  password?: string
  provider: AuthProvider
  googleId?: string
  isPremium: boolean
  premiumSince?: Date
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    organization: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
      required: true,
    },

    googleId: {
      type: String,
      sparse: true,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    premiumSince: {
      type: Date,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User