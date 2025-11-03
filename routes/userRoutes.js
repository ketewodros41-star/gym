const express = require('express');
const User = require('../models/User');
const Plan = require('../models/Plan');
const { authMiddleware, permit } = require('../middleware/auth');

const router = express.Router();

// GET all users (admin) or trainer's members (trainer)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const users = await User.find().populate('plan trainer', 'name price durationDays');
      return res.json(users);
    } else if (req.user.role === 'trainer') {
      const users = await User.find({ trainer: req.user._id }).populate('plan', 'name price durationDays');
      return res.json(users);
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// get single user
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const target = await User.findById(req.params.id).populate('plan trainer', 'name price durationDays');
    if (!target) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'admin' || req.user._id.equals(target._id) || (req.user.role === 'trainer' && String(target.trainer) === String(req.user._id))) {
      return res.json(target);
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// update user
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const allowed = req.user.role === 'admin' || req.user._id.equals(user._id) || (req.user.role === 'trainer' && String(user.trainer) === String(req.user._id));
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const { name, trainer, planId, joinDate } = req.body;
    if (name) user.name = name;
    if (trainer) user.trainer = trainer;
    if (joinDate) user.joinDate = new Date(joinDate);
    if (planId) {
      user.plan = planId;
      const plan = await Plan.findById(planId);
      const base = user.membershipExpiry && user.membershipExpiry > new Date() ? new Date(user.membershipExpiry) : (user.joinDate || new Date());
      const expiry = new Date(base);
      expiry.setDate(expiry.getDate() + (plan ? plan.durationDays : 0));
      user.membershipExpiry = expiry;
    }
    await user.save();
    res.json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// delete user (admin)
router.delete('/:id', authMiddleware, permit('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
