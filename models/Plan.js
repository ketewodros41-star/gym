const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  description: { type: String }
});

module.exports = mongoose.model('Plan', PlanSchema);
