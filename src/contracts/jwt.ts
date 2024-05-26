import { ObjectId } from 'mongoose'

export interface IJwtUser {
  id: ObjectId
}
export interface IJwtFirebaseUser {
  phoneNumber: string
  userName: string
}

export interface IAccessToken {
  accessToken: string
}
