import { ClientSession, ObjectId } from 'mongoose'

import { Auth } from '@/models'

export const authService = {
  create: (
    {
      phoneNumber,
      userName
    }: {
      phoneNumber: string
      userName: string
    },
    session?: ClientSession
  ) =>
    new Auth({
      phoneNumber,
      userName
    }).save({ session }),

  getById: (userId: ObjectId) => Auth.findById(userId),

  getByPhoneNumber: (phoneNumber: string) => Auth.findOne({ phoneNumber }),

  isExistByPhoneNumber: (phoneNumber: string) => Auth.exists({ phoneNumber }),

  deleteById: (userId: ObjectId, session?: ClientSession) =>
    Auth.deleteOne({ user: userId }, { session })
}
