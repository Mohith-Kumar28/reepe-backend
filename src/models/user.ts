import mongoose, { Schema, model } from 'mongoose'

const UserSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  name: { type: String, required: true },
  image: { type: String },
  phoneNumber: { type: Number, required: true, unique: true },
  address: { type: String },
  bio: { type: String },
  confirmed: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const RoleSchema = new Schema({
  // id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const PermissionSchema = new Schema({
  // id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  method: { type: String, required: true },
  route: { type: String, required: true },
  description: { type: String },
  roleId: { type: String, ref: 'Role', required: true }, // Reference to Role
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Client Permission Schema
const ClientPermissionSchema = new Schema({
  // id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  sort: { type: Number, required: true },
  menu: { type: String, required: true },
  path: { type: String, required: true, unique: true },
  description: { type: String },
  roleId: { type: String, ref: 'Role', required: true }, // Reference to Role
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const User = model('User', UserSchema)
export const Role = model('Role', RoleSchema)
export const Permission = model('Permission', PermissionSchema)
export const ClientPermission = model(
  'ClientPermission',
  ClientPermissionSchema
)
