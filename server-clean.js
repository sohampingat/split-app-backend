require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app-clean");

const PORT = process.env.PORT || 3001;

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB Connected Successfully");
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Web interface: http://localhost:${PORT}/`);
  });
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});