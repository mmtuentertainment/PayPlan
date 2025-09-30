const express = require('express');
const dotenv = require('dotenv');
const planRouter = require('./src/routes/plan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PayPlan API v0.1',
    version: '0.1.0',
    status: 'operational',
    endpoints: {
      plan: 'POST /plan - Generate BNPL payment plan',
      health: 'GET /health - Health check'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount plan router
app.use('/plan', planRouter);

// Only start server if not being imported for testing
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PayPlan server is running on port ${PORT}`);
    console.log(`POST /plan endpoint ready for requests`);
  });
}

module.exports = app; // Export for testing