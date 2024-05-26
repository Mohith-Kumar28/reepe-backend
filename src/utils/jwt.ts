import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongoose'

import { IAccessToken, IJwtFirebaseUser, IJwtUser } from '@/contracts/jwt'

export const jwtSign = (id: ObjectId): IAccessToken => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION
  })

  return { accessToken }
}

export const jwtVerify = ({ accessToken }: { accessToken: string }) => {
  return jwt.verify(accessToken, process.env.JWT_SECRET) as IJwtUser
}

export const jwtVerifyOfFirebase = ({ authToken }: { authToken: string }) => {
  return jwt.verify(
    authToken,
    process.env.JWT_SECRET_FIREBASE
  ) as unknown as IJwtFirebaseUser
}
