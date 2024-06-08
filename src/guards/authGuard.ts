import { NextFunction, Response } from 'express'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'

import {
  IAuthRequest,
  IContextRequest,
  IUserRequest
} from '@/contracts/request'

export const authGuard = {
  isAuth: (
    { context: { auth } }: IContextRequest<IAuthRequest>,
    res: Response,
    next: NextFunction
  ) => {
    console.log('gghghhghghghhh')
    if (auth) {
      return next()
    }

    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: ReasonPhrases.UNAUTHORIZED,
      status: StatusCodes.UNAUTHORIZED
    })
  },

  isGuest: (
    { context: { auth } }: IContextRequest<IAuthRequest>,
    res: Response,
    next: NextFunction
  ) => {
    if (!auth) {
      return next()
    }

    return res.status(StatusCodes.FORBIDDEN).json({
      message: ReasonPhrases.FORBIDDEN,
      status: StatusCodes.FORBIDDEN
    })
  },

  isVerified: (
    {
      context: {
        user: { verified }
      }
    }: IContextRequest<IUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    if (verified) {
      return next()
    }

    return res.status(StatusCodes.FORBIDDEN).json({
      message: ReasonPhrases.FORBIDDEN,
      status: StatusCodes.FORBIDDEN
    })
  },

  isUnverfied: (
    {
      context: {
        user: { verified }
      }
    }: IContextRequest<IUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    if (!verified) {
      return next()
    }

    return res.status(StatusCodes.FORBIDDEN).json({
      message: ReasonPhrases.FORBIDDEN,
      status: StatusCodes.FORBIDDEN
    })
  }
}
