/*
  Run: npm run seed
  Creates sample admin, trainer, member and plans for testing.
*/
require('dotenv').config();
const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Plan = require('./models/Plan');

async function seed(){
  await connectDB();
  console.log('Seeding DB...');
  await User.deleteMany({});
  await Plan.deleteMany({});

  const adminPass = await bcrypt.hash('adminpass', 10);
  const trainerPass = await bcrypt.hash('trainerpass', 10);
  const memberPass = await bcrypt.hash('memberpass', 10);

  const admin = new User({ name: 'Admin User', email: 'admin@example.com', passwordHash: adminPass, role: 'admin' });
  await admin.save();

  const trainer = new User({ name: 'Trainer One', email: 'trainer@example.com', passwordHash: trainerPass, role: 'trainer' });
  await trainer.save();

  const monthly = new Plan({ name: 'Monthly', price: 30, durationDays: 30 });
  const yearly = new Plan({ name: 'Yearly', price: 300, durationDays: 365 });
  await monthly.save();
  await yearly.save();

  const join = new Date();
  const expiry = new Date(join);
  expiry.setDate(expiry.getDate() + monthly.durationDays);

  const member = new User({
    name: 'Member One',
    email: 'member@example.com',
    passwordHash: memberPass,
    role: 'member',
    joinDate: join,
    plan: monthly._id,
    trainer: trainer._id,
    membershipExpiry: expiry
  });
  await member.save();

  console.log('Seed complete. Credentials:');
  console.log('admin@example.com / adminpass');
  console.log('trainer@example.com / trainerpass');
  console.log('member@example.com / memberpass');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
