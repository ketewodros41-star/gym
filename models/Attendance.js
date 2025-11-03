const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  checkIn: { type: Date },
  checkOut: { type: Date },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
