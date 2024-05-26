import { Response } from 'express'
import { startSession } from 'mongoose'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import winston from 'winston'

import { ExpiresInDays } from '@/constants'
import {
  NewPasswordPayload,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload
} from '@/contracts/auth'
import {
  resetPasswordService,
  verificationService,
  userService,
  authService
} from '@/services'
import { jwtSign, jwtVerifyOfFirebase } from '@/utils/jwt'
import {
  IAuthRequest,
  IBodyRequest,
  ICombinedRequest,
  IContextRequest,
  IUserRequest
} from '@/contracts/request'
import { createCryptoString } from '@/utils/cryptoString'
import { createDateAddDaysFromNow } from '@/utils/dates'
import { UserMail } from '@/mailer'
import { createHash } from '@/utils/hash'
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
      const { accessToken } = jwtSign(user.id)

      await session.commitTransaction()
      session.endSession()

      return res.status(StatusCodes.OK).json({
        data: { accessToken },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    } catch (error) {
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
  },

  resetPassword: async (
    { body: { email } }: IBodyRequest<ResetPasswordPayload>,
    res: Response
  ) => {
    const session = await startSession()

    try {
      const user = await userService.getByEmail(email)

      if (!user) {
        return res.status(StatusCodes.OK).json({
          message: ReasonPhrases.OK,
          status: StatusCodes.OK
        })
      }

      session.startTransaction()

      const cryptoString = createCryptoString()

      const dateFromNow = createDateAddDaysFromNow(ExpiresInDays.ResetPassword)

      const resetPassword = await resetPasswordService.create(
        {
          userId: user.id,
          accessToken: cryptoString,
          expiresIn: dateFromNow
        },
        session
      )

      await userService.addResetPasswordToUser(
        {
          userId: user.id,
          resetPasswordId: resetPassword.id
        },
        session
      )

      const userMail = new UserMail()

      userMail.resetPassword({
        email: user.email,
        accessToken: cryptoString
      })

      await session.commitTransaction()
      session.endSession()

      return res.status(StatusCodes.OK).json({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    } catch (error) {
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

  newPassword: async (
    {
      body: { password },
      params
    }: ICombinedRequest<null, NewPasswordPayload, { accessToken: string }>,
    res: Response
  ) => {
    const session = await startSession()
    try {
      const resetPassword = await resetPasswordService.getByValidAccessToken(
        params.accessToken
      )

      if (!resetPassword) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: ReasonPhrases.FORBIDDEN,
          status: StatusCodes.FORBIDDEN
        })
      }

      const user = await userService.getById(resetPassword.user)

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: ReasonPhrases.NOT_FOUND,
          status: StatusCodes.NOT_FOUND
        })
      }

      session.startTransaction()
      const hashedPassword = await createHash(password)

      await userService.updatePasswordByUserId(
        resetPassword.user,
        hashedPassword,
        session
      )

      await resetPasswordService.deleteManyByUserId(user.id, session)

      const { accessToken } = jwtSign(user.id)

      const userMail = new UserMail()

      userMail.successfullyUpdatedPassword({
        email: user.email
      })

      await session.commitTransaction()
      session.endSession()

      return res.status(StatusCodes.OK).json({
        data: { accessToken },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    } catch (error) {
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
  }
}
