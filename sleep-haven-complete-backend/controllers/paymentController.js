const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User'); // Updated path


/**
 * Create a Stripe checkout session
 * @route POST /api/payments/create-checkout-session
 * @access Private
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verify user exists if userId is provided
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sleep Haven Personalized Sleep Plan',
              description: 'Lifetime access to your customized sleep recommendations',
              images: ['https://www.sleephaven.ai/images/sleep-plan-preview.jpg'],
            },
            unit_amount: 5000, // $50.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel.html`,
      metadata: {
        userId: userId || 'guest' // Store userId or 'guest' for guest checkout
      }
    });

    res.status(200).json({
      status: 'success',
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Verify payment status
 * @route GET /api/payments/verify-payment/:sessionId
 * @access Private
 */
const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        userId: session.metadata?.userId
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Create a guest checkout session (no authentication required)
 * @route POST /api/payments/guest-checkout
 * @access Public
 */
const createGuestCheckoutSession = async (req, res) => {
  try {
    // Create Stripe checkout session for guest
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sleep Haven Personalized Sleep Plan',
              description: 'Lifetime access to your customized sleep recommendations',
              images: ['https://www.sleephaven.ai/images/sleep-plan-preview.jpg'],
            },
            unit_amount: 5000, // $50.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&guest=true`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel.html`,
      metadata: {
        userId: 'guest'
      },
      // Collect customer email for account creation after payment
      customer_email: req.body.email || undefined
    });

    res.status(200).json({
      status: 'success',
      url: session.url
    });
  } catch (error) {
    console.error('Error creating guest checkout session:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  createCheckoutSession,
  verifyPayment,
  createGuestCheckoutSession
};
