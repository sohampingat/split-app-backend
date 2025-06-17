const express = require('express');
const path = require('path');

const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple server is working!' });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Simple server running on http://localhost:${PORT}`);
});