# Gym Backend

## Setup

1. Copy `.env.example` to `.env` and fill values:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gym
JWT_SECRET=supersecret
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:3000
```

2. Install deps:
```
npm install
```

3. Seed sample data:
```
npm run seed
```

4. Start server:
```
npm run dev
```

## Notes
- Uses Gmail SMTP via Nodemailer. For Gmail, use an App Password (if 2FA enabled).
- Scheduler runs daily at midnight (server timezone configurable via SCHEDULER_TZ env var).
