import { Schema, model } from 'mongoose'
import { IAuth } from '../contracts/auth'

const schema = new Schema<IAuth>(
  {
    phoneNumber: String,
    userName: String
  },
  { timestamps: true }
)
export const User = model<IAuth>('User', schema)
