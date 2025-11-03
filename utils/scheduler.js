const cron = require('node-cron');
const User = require('../models/User');
const { sendMail } = require('./emailService');

const start = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily expiry check');
      const now = new Date();
      const expiredMembers = await User.find({ role: 'member', membershipExpiry: { $lte: now } });
      if (expiredMembers.length === 0) {
        console.log('No expired memberships today.');
        return;
      }

      const admins = await User.find({ role: 'admin' });
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      if (adminEmails.length) {
        const list = expiredMembers.map(m => `${m.name} <${m.email}> - expired ${m.membershipExpiry?.toISOString().split('T')[0] || 'unknown'}`).join('\n');
        await sendMail({
          to: adminEmails.join(','),
          subject: `Expired memberships: ${expiredMembers.length}`,
          text: `The following members have expired:\n\n${list}`
        });
      }

      for (const m of expiredMembers) {
        if (!m.email) continue;
        await sendMail({
          to: m.email,
          subject: 'Your gym membership has expired',
          text: `Hi ${m.name},\n\nYour gym membership expired on ${m.membershipExpiry?.toISOString().split('T')[0] || 'today'}. Please renew to continue access.\n\nBest,\nGym Team`
        }).catch(err => console.error('Mail to member failed', m.email, err));
      }

      console.log(`Notified ${expiredMembers.length} members and admins.`);
    } catch (err) {
      console.error('Error in scheduler', err);
    }
  }, { timezone: process.env.SCHEDULER_TZ || 'UTC' });
};

module.exports = { start };
