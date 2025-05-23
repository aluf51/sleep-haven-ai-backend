const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment session
// @route   POST /api/payments/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
  try {
    const { userId } = req.body;

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sleep Haven Personalized Plan',
              description: 'Personalized sleep plan with lifetime access and 24/7 support',
            },
            unit_amount: 5000, // $50.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        userId: userId
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

// @desc    Verify payment success
// @route   GET /api/payments/verify-payment/:sessionId
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve the session to verify payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Here you would update your database to mark the user's payment as complete
      // For example: await User.findByIdAndUpdate(session.metadata.userId, { hasPaid: true });
      
      res.status(200).json({
        status: 'success',
        message: 'Payment verified successfully',
        data: {
          paymentStatus: session.payment_status,
          customerEmail: session.customer_details.email
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Payment not completed'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
