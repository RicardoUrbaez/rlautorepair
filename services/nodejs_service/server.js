const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store (demo purposes)
const appointments = [];
const customers = [];

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RL Auto Shop Node.js Service',
    timestamp: new Date().toISOString()
  });
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
  res.json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// Create appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { customerName, serviceType, scheduledDate, vehicleInfo } = req.body;
    
    // Validation
    if (!customerName || !serviceType || !scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const appointment = {
      id: uuidv4(),
      customerName,
      serviceType,
      scheduledDate,
      vehicleInfo,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    appointments.push(appointment);
    
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get appointment by ID
app.get('/api/appointments/:id', (req, res) => {
  const appointment = appointments.find(a => a.id === req.params.id);
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: 'Appointment not found'
    });
  }
  
  res.json({
    success: true,
    data: appointment
  });
});

// Update appointment status
app.patch('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body;
  const appointment = appointments.find(a => a.id === req.params.id);
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: 'Appointment not found'
    });
  }
  
  appointment.status = status;
  appointment.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: appointment
  });
});

// Customer routes
app.get('/api/customers', (req, res) => {
  res.json({
    success: true,
    count: customers.length,
    data: customers
  });
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, address } = req.body;
  
  const customer = {
    id: uuidv4(),
    name,
    email,
    phone,
    address,
    createdAt: new Date().toISOString()
  };
  
  customers.push(customer);
  
  res.status(201).json({
    success: true,
    data: customer
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 RL Auto Shop Node.js Service`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;
