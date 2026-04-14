const INTERNAL_KEY = process.env.HIVE_INTERNAL_KEY || '';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';

export function x402Middleware(req, res, next) {
  // Internal key bypass — Hive services skip payment
  const internalKey = req.headers['x-hive-internal-key'] || req.headers['x-hive-internal'] || req.headers['x-api-key'];
  if (internalKey && (internalKey === INTERNAL_KEY || internalKey === SERVICE_API_KEY) && INTERNAL_KEY) {
    req.paymentVerified = true;
    req.paymentAmount = 0;
    req.paymentNote = 'internal_key_bypass';
    return next();
  }

  // Check for x402 payment header
  const paymentHeader = req.headers['x-payment'] || req.headers['x-402-payment'];
  if (paymentHeader) {
    req.paymentVerified = true;
    req.paymentAmount = parseFloat(paymentHeader) || 0;
    return next();
  }

  // Extract DID for subscription-based access
  const did = req.headers['x-did'] || req.headers['x-hivetrust-did'];
  if (did) {
    req.authenticatedDID = did;
    return next();
  }

  // Bearer token with DID
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer did:hive:')) {
    req.authenticatedDID = auth.replace('Bearer ', '');
    return next();
  }

  // No auth — return 402 Payment Required
  return res.status(402).json({
    error: 'Payment Required',
    message: 'This endpoint requires x402 payment or a valid subscription',
    payment_methods: ['x402', 'subscription'],
    subscribe_url: '/v1/pulse/subscribe',
  });
}

export function optionalAuth(req, res, next) {
  const did = req.headers['x-did'] || req.headers['x-hivetrust-did'];
  if (did) req.authenticatedDID = did;

  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer did:hive:')) {
    req.authenticatedDID = auth.replace('Bearer ', '');
  }

  const internalKey = req.headers['x-hive-internal-key'] || req.headers['x-hive-internal'] || req.headers['x-api-key'];
  if (internalKey && (internalKey === INTERNAL_KEY || internalKey === SERVICE_API_KEY) && INTERNAL_KEY) {
    req.paymentVerified = true;
  }

  next();
}
