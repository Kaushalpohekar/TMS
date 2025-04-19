const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoute = require('./routes/authRoute');
const dashRoute = require('./routes/dashboardRoutes');

const app = express();
const port = 4000 ;

app.use(cors());
app.use(express.json());

// ✅ Mount both under same base route
app.use('/api', authRoute);
app.use('/api', dashRoute);

// Optional base route check
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// ✅ Listen on 0.0.0.0 to be accessible over the internet
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
