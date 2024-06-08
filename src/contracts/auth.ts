import { IUser } from './user'
export interface IAuth {
  phoneNumber: string
  userName: string
  authToken: string
}
export type SignInPayload = Pick<
  IAuth,
  'phoneNumber' | 'userName' | 'authToken'
>

export type SignUpPayload = Pick<
  IAuth,
  'phoneNumber' | 'userName' | 'authToken'
>
