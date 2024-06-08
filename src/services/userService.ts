import { ClientSession, ObjectId } from 'mongoose'

import { User } from '@/models'

export const userService = {
  create: (
    {
      phoneNumber,
      userName,
      userId
    }: {
      phoneNumber: string
      userName: string
      userId: ObjectId
    },
    session?: ClientSession
  ) =>
    new User({
      userId,
      phoneNumber,
      name: userName
    }).save({ session }),

  getById: (userId: ObjectId) => User.findById(userId),

  updateProfileByUserId: (
    userId: ObjectId,
    { firstName, lastName }: { firstName: string; lastName: string },
    session?: ClientSession
  ) => {
    const data = [{ _id: userId }, { firstName, lastName }]

    let params = null

    if (session) {
      params = [...data, { session }]
    } else {
      params = data
    }

    return User.updateOne(...params)
  },

  deleteById: (userId: ObjectId, session?: ClientSession) =>
    User.deleteOne({ user: userId }, { session })
}
