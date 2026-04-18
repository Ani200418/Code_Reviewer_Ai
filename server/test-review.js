const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // get first user
    const user = await User.findOne();
    if (!user) {
      console.log("No user found");
      return;
    }
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    const code = "console.log('hello');".repeat(100); // 2100 chars
    
    console.log("Sending request...");
    const res = await axios.post('http://localhost:5001/api/review-code', {
      code,
      language: 'javascript'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  } finally {
    mongoose.disconnect();
  }
})();
