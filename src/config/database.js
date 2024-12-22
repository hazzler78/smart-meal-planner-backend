const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartmealplanner', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Connection Closed');
  } catch (error) {
    console.error(`Error closing database connection: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  closeDB
}; 