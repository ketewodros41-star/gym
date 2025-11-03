const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin','trainer','member'], default: 'member' },
  joinDate: { type: Date },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  membershipExpiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
