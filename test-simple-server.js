const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
});