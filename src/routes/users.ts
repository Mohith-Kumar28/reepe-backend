import { Router } from 'express'

import { authGuard } from '@/guards'
import { userController } from '@/controllers'
import { userValidation } from '@/validations'
import { authMiddleware } from '@/middlewares'

export const users = (router: Router): void => {
  router.get('/me', authMiddleware, userController.me)

  router.post('/user/update', authGuard.isAuth, userController.updateProfile)

  router.post(
    '/user/update/avatar',
    authGuard.isAuth,
    userController.updateAvatar
  )
}
