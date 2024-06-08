import { Model, ObjectId } from 'mongoose'

export interface IUser {
  id: ObjectId
  email: string
  password: string
  firstName?: string
  lastName?: string
  verified: boolean
  verifications?: ObjectId[]
  resetPasswords?: ObjectId[]
}

export type UserModel = Model<IUser, unknown>

export type UpdateProfilePayload = Required<
  Pick<IUser, 'firstName' | 'lastName'>
>
