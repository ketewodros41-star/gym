const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Plan = require("../models/Plan");

const router = express.Router();

router.post("/register", async (req, res) => {
  console.log("--- REQUEST HIT REGISTER ROUTE ---");
  console.log("Request Body:", req.body);
  try {
    const { name, email, password, role, joinDate, planId, trainerId } =
      req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email exists" });
    console.log("dawd");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({
      name,
      email,
      passwordHash,
      role: role || "member",
    });
    console.log("sda");

    if (role === "member") {
      user.joinDate = joinDate ? new Date(joinDate) : new Date();
      if (planId) user.plan = planId;
      if (trainerId) user.trainer = trainerId;
      if (planId) {
        const plan = await Plan.findById(planId);
        if (plan) {
          const join = user.joinDate || new Date();
          const expiry = new Date(join);
          expiry.setDate(expiry.getDate() + plan.durationDays);
          user.membershipExpiry = expiry;
        }
      }
    }

    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
