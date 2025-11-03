const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Mongoose 6+ connects using the promise returned by mongoose.connect
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are now default, but it's good practice to keep them in mind:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(
      `✅ MongoDB Connected successfully on host: ${conn.connection.host}`
    );
  } catch (error) {
    // CRITICAL: Log the error clearly so you know *why* it failed
    console.error(`❌ DB Connection Failed: ${error.message}`);

    // This stops the process if the DB is required
    process.exit(1);
  }
};

module.exports = connectDB;
