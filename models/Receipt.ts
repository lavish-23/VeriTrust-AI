import mongoose, { Schema, Document } from 'mongoose'

export interface IReceipt extends Document {
  userId: mongoose.Types.ObjectId
  amount: number
  imageData: string
  createdAt: Date
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    imageData: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema)
