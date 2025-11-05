require("dotenv").config();
const express = require("express");
const mongoose = require('mongoose');
const blogRoutes = require("./routes/blog.route");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json({ limit: '10mb' })); // For parsing application/json
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For parsing application/x-www-form-urlencoded

app.use(cors());
app.use(express.json());


app.use('/api/blogs', blogRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!')
})


// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Blog API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


app.listen(PORT, () => {
    console.log(`Server is running on port: http://localhost:${PORT}`);
});