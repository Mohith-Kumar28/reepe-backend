import { Schema, model } from 'mongoose'
import { IAuth } from '../contracts/auth'

const schema = new Schema<IAuth>(
  {
    phoneNumber: String,
    userName: String
  },
  { timestamps: true }
)
export const Auth = model<IAuth>('Auth', schema)
