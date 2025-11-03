const express = require('express');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Plan = require('../models/Plan');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// record payment (admin or member)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { memberId, amount, status, planId } = req.body;
    if (req.user.role !== 'admin' && String(req.user._id) !== String(memberId)) return res.status(403).json({ message: 'Forbidden' });

    const payment = new Payment({ member: memberId, amount, status: status || 'completed', plan: planId });
    await payment.save();

    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) {
        const member = await User.findById(memberId);
        const base = member.membershipExpiry && member.membershipExpiry > new Date() ? new Date(member.membershipExpiry) : new Date();
        base.setDate(base.getDate() + plan.durationDays);
        member.membershipExpiry = base;
        member.plan = planId;
        await member.save();
      }
    }
    res.json(payment);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// list payments (admin or member)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const q = {};
    if (req.user.role === 'member') q.member = req.user._id;
    const payments = await Payment.find(q).populate('member plan', 'name email price');
    res.json(payments);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
