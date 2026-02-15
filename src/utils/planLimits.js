export const PLAN_LIMITS = {
  starter: {
    workers: 10,
    workstreams: 2,
    label: 'Starter',
    price: 39
  },
  business: {
    workers: 50,
    workstreams: 10,
    label: 'Business',
    price: 149
  },
  corporate: {
    workers: 200,
    workstreams: 80,
    label: 'Corporate',
    price: 349
  },
  enterprise: {
    workers: null,
    workstreams: 80,
    label: 'Enterprise',
    price: 799
  }
};

export const getPlanLimits = (plan) => {
  const key = plan && PLAN_LIMITS[plan] ? plan : 'starter';
  return PLAN_LIMITS[key];
};
