const express = require('express');
const Plan = require('../models/Plan');
const { authMiddleware, permit } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, permit('admin'), async (req, res) => {
  const { name, price, durationDays, description } = req.body;
  const plan = new Plan({ name, price, durationDays, description });
  await plan.save();
  res.json(plan);
});

router.get('/', authMiddleware, async (req, res) => {
  const plans = await Plan.find();
  res.json(plans);
});

router.get('/:id', authMiddleware, async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  res.json(plan);
});

router.put('/:id', authMiddleware, permit('admin'), async (req, res) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(plan);
});

router.delete('/:id', authMiddleware, permit('admin'), async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
