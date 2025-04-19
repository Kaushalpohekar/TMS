const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoute = require('./routes/authRoute');
const dashRoute = require('./routes/dashboardRoutes');

const app = express();
const port = 4000 ;

app.use(cors());
app.use(express.json());



app.use('/api', authRoute);
app.use('/api', dashRoute);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      // Malformed JSON error
      return res.status(400).json({ message: 'Invalid JSON format in request body.' });
  }

  console.error('Internal error:', err.message); // Logs to console only
  res.status(500).json({ message: 'Something went wrong. Please try again later.' });
});


// Optional base route check
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// ✅ Listen on 0.0.0.0 to be accessible over the internet
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
