import { Response } from 'express'
import { ObjectId, startSession } from 'mongoose'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import winston from 'winston'

import { SignInPayload, SignUpPayload } from '@/contracts/auth'
import { authService, userService } from '@/services'
import { jwtSign, jwtVerifyOfFirebase } from '@/utils/jwt'
import {
  IAuthRequest,
  IBodyRequest,
  IContextRequest
} from '@/contracts/request'
import { redis } from '@/dataSources'

export const authController = {
  signIn: async (
    { body: { phoneNumber, authToken } }: IBodyRequest<SignInPayload>,
    res: Response
  ) => {
    try {
      const { phoneNumber: phoneNumberAuth } = jwtVerifyOfFirebase({
        authToken
      })
      if (phoneNumberAuth !== phoneNumber) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }
      const user = await authService.getByPhoneNumber(phoneNumber)
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND
        })
      }

      const { accessToken } = jwtSign(user.id)

      return res.status(StatusCodes.OK).json({
        data: { accessToken },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    } catch (error) {
      winston.error(error)

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }
  },

  signUp: async (
    { body: { phoneNumber, authToken } }: IBodyRequest<SignUpPayload>,
    res: Response
  ) => {
    const session = await startSession()
    try {
      const { phoneNumber: phoneNumberAuth, userName } = jwtVerifyOfFirebase({
        authToken
      })
      console.log(' phoneNumberAuth, userName', phoneNumberAuth, userName)
      const isUserExist = await authService.isExistByPhoneNumber(phoneNumber)
      if (phoneNumberAuth !== phoneNumber) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: ReasonPhrases.BAD_REQUEST,
          status: StatusCodes.BAD_REQUEST
        })
      }

      if (isUserExist) {
        return res.status(StatusCodes.CONFLICT).json({
          message: ReasonPhrases.CONFLICT,
          status: StatusCodes.CONFLICT
        })
      }

      session.startTransaction()

      const user = await authService.create(
        {
          phoneNumber,
          userName
        },
        session
      )
      await userService.create({ phoneNumber, userName, userId: user.id })
      // const updatedUser = await userService.create({
      //   phoneNumber,
      //   userName,
      //   userId: user._id.toString()
      // })
      const { accessToken } = jwtSign(user.id)

      await session.commitTransaction()
      session.endSession()

      return res.status(StatusCodes.OK).json({
        data: { accessToken },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    } catch (error) {
      console.log('error', error)
      winston.error(error)

      if (session.inTransaction()) {
        await session.abortTransaction()
        session.endSession()
      }

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }
  },

  signOut: async (
    { context: { auth, accessToken } }: IContextRequest<IAuthRequest>,
    res: Response
  ) => {
    try {
      await redis.client.set(`expiredToken:${accessToken}`, `${auth.id}`, {
        EX: process.env.REDIS_TOKEN_EXPIRATION,
        NX: true
      })

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: ReasonPhrases.BAD_REQUEST,
        status: StatusCodes.BAD_REQUEST
      })
    }
  }
}
