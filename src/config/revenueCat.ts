
export const REVENUECAT_CONFIG = {
  ENTITLEMENT_IDENTIFIER: 'pro',
  OFFERING_ID: 'ofrng4657c81eae',
  products: {
    monthly: 'og_999_1m', // Monthly $9.99
    yearly: 'og_yearly_2999_1y', // Yearly $29.99
  },
  pricing: {
    monthly: 9.99,
    yearly: 29.99,
  },
  trials: {
    monthly: {
      hasTrial: false,
      trialDays: 0,
      trialText: "$9.99/month"
    },
    yearly: {
      hasTrial: true,
      trialDays: 3,
      trialText: "3-day free trial, then $29.99/year"
    }
  },
  developmentMode: {
    enabled: process.env.NODE_ENV === 'development',
    mockSubscription: false, // Disable mock to use real RevenueCat
  }
};
