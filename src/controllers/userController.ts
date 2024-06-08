import { Response } from 'express'
import { ObjectId, startSession } from 'mongoose'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import winston from 'winston'

import {
  ICombinedRequest,
  IContextRequest,
  IUserRequest
} from '@/contracts/request'
import { UpdateProfilePayload } from '@/contracts/user'
import { mediaService, userService } from '@/services'
import { MediaRefType } from '@/constants'

import { UserMail } from '@/mailer'

import { Image } from '@/infrastructure/image'

export const userController = {
  me: async (
    { context: { user } }: IContextRequest<IUserRequest>,
    res: Response
  ) => {
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: ReasonPhrases.NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      })
    }

    // const media = await mediaService.findOneByRef({
    //   refType: MediaRefType.User,
    //   refId: user.id
    // })

    // let image
    // if (media) {
    //   image = appUrl(await new Image(media).sharp({ width: 150, height: 150 }))
    // }

    return res.status(StatusCodes.OK).json({
      data: { ...user.toJSON() },
      message: ReasonPhrases.OK,
      status: StatusCodes.OK
    })
  },

  updateProfile: async (
    {
      context: { user },
      body: { firstName, lastName }
    }: ICombinedRequest<IUserRequest, UpdateProfilePayload>,
    res: Response
  ) => {
    try {
      await userService.updateProfileByUserId(user.id, { firstName, lastName })

      const userMail = new UserMail()

      userMail.successfullyUpdatedProfile({
        email: user.email
      })

      return res.status(StatusCodes.OK).json({
        data: { firstName, lastName },
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

  updateAvatar: async (
    {
      context: { user },
      body: { imageId }
    }: ICombinedRequest<IUserRequest, { imageId: ObjectId }>,
    res: Response
  ) => {
    try {
      await userController.deleteUserImages({ userId: user.id })

      await mediaService.updateById(imageId, {
        refType: MediaRefType.User,
        refId: user.id
      })

      return res.status(StatusCodes.OK).json({
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

  deleteUserImages: async ({ userId }: { userId: ObjectId }) => {
    const images = await mediaService.findManyByRef({
      refType: MediaRefType.User,
      refId: userId
    })

    const promises = []

    for (let i = 0; i < images.length; i++) {
      promises.push(new Image(images[i]).deleteFile())
    }

    await Promise.all(promises)

    await mediaService.deleteManyByRef({
      refType: MediaRefType.User,
      refId: userId
    })
  }
}
