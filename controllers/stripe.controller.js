const Stripe = require("stripe");

const stripe = new Stripe(ProcessingInstruction.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async ({ amount, currency = "egp", orderId }) => {
  return stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      orderId: orderId.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
};
module.exports = stripe;
