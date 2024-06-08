import mongoose, { Schema, model } from 'mongoose'

const AgencySchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  ownerId: { type: String, ref: 'User', required: true }
})

const UserAgencyRoleSchema = new Schema({
  userId: { type: String, ref: 'User', required: true },
  agencyId: { type: String, ref: 'Agency', required: true },
  roleId: { type: String, ref: 'Role', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Agency = mongoose.model('Agency', AgencySchema)
const UserAgencyRole = mongoose.model('UserAgencyRole', UserAgencyRoleSchema)

module.exports = {
  Agency,
  UserAgencyRole
}
