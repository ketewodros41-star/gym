const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    const memberId = req.body.memberId || req.user._id;
    if (req.user.role === 'member' && String(req.user._id) !== String(memberId)) return res.status(403).json({ message: 'Forbidden' });

    const attendance = new Attendance({
      member: memberId,
      checkIn: new Date(),
      trainer: req.user.role === 'trainer' ? req.user._id : undefined
    });
    await attendance.save();
    res.json(attendance);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const memberId = req.body.memberId || req.user._id;
    if (req.user.role === 'member' && String(req.user._id) !== String(memberId)) return res.status(403).json({ message: 'Forbidden' });

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const a = await Attendance.findOne({ member: memberId, date: { $gte: todayStart } }).sort({ createdAt: -1 });
    if (!a) return res.status(404).json({ message: 'No check-in found today' });
    a.checkOut = new Date();
    await a.save();
    res.json(a);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

router.get('/member/:id', authMiddleware, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Not found' });
    if (req.user.role === 'trainer' && String(member.trainer) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'member' && String(req.user._id) !== String(req.params.id)) return res.status(403).json({ message: 'Forbidden' });

    const records = await Attendance.find({ member: req.params.id }).sort({ date: -1 });
    res.json(records);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
