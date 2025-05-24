const User = require('../models/User'); // Update path as needed
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or another service like SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER, // Add this to your .env file
    pass: process.env.EMAIL_PASS  // Add this to your .env file
  }
});

// Helper function to send confirmation email
const sendConfirmationEmail = async (email, name, sessionId) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Sleep Haven - Your Account & Receipt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4A6FE3; padding: 20px; text-align: center;">
            <h1 style="color: white;">Sleep Haven</h1>
          </div>
          
          <div style="padding: 20px; border: 1px solid #eee;">
            <h2>Welcome to Sleep Haven, ${name}!</h2>
            <p>Your account has been successfully created and your sleep plan is now available.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0;">Receipt Details</h3>
              <p><strong>Payment ID:</strong> ${sessionId}</p>
              <p><strong>Amount:</strong> $50.00</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Item:</strong> Sleep Haven Personalized Sleep Plan</p>
            </div>
            
            <p>You can access your personalized sleep plan by logging into your account at <a href="https://www.sleephaven.ai">www.sleephaven.ai</a>.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Sweet dreams,<br>The Sleep Haven Team</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>© 2025 Sleep Haven. All rights reserved.</p>
            <p>123 Sleep Street, Dreamland, CA 94043</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw the error so the registration process can continue
  }
};

/**
 * Register a user
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Register a new user after payment
 * @route POST /api/users/register-paid-user
 * @access Public
 */
const registerPaidUser = async (req, res) => {
  try {
    const { name, email, password, sessionId } = req.body;

    // Validate required fields
    if (!name || !email || !password || !sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // Verify the payment session
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!session || session.payment_status !== 'paid') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or unpaid session'
        });
      }
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment session'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with paid status
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      hasPaidPlan: true,
      paymentSessionId: sessionId
    });

    if (user) {
      // Send confirmation email
      await sendConfirmationEmail(email, name, sessionId);
      
      res.status(201).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          hasPaidPlan: user.hasPaidPlan,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Error registering paid user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Login user
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        status: 'success',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          hasPaidPlan: user.hasPaidPlan,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.status(200).json({
        status: 'success',
        data: user
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
      
      const updatedUser = await user.save();
      
      res.status(200).json({
        status: 'success',
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          hasPaidPlan: updatedUser.hasPaidPlan,
          token: generateToken(updatedUser._id)
        }
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

module.exports = {
  registerUser,
  registerPaidUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};
