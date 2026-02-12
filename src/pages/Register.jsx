import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { addUser } from '../store/slices/usersSlice';
import { addOrganization, addMembership, setCurrentOrg } from '../store/slices/organizationsSlice';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getPlanLimits } from '../utils/planLimits';
import './Register.css';

const buildInviteCode = () =>
  `ATH-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-4)}`;

const PLAN_OPTIONS = [
  {
    id: 'starter',
    title: 'Starter',
    price: 39,
    recommended: false,
    features: ['Up to 10 people', 'Core Audit Engine', '2 Active Workstreams']
  },
  {
    id: 'business',
    title: 'Business',
    price: 149,
    recommended: true,
    features: ['Up to 50 people', 'Pending Queue', 'Metrics Dashboard']
  },
  {
    id: 'corporate',
    title: 'Corporate',
    price: 349,
    recommended: false,
    features: ['Up to 200 people', 'Manager Roles', 'Advanced Reports']
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    price: 799,
    recommended: false,
    features: ['Unlimited people', 'AI Intelligence', '24/7 Support']
  }
];

const PLAN_ICONS = {
  starter: (
    <svg className="plan-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 13c6-1 9-6 14-7-1 7-6 12-13 12-1 0-2-2-1-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 12c1 2 2 3 4 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  business: (
    <svg className="plan-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 21h16V7l-8-4-8 4v14z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 21v-6h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  corporate: (
    <svg className="plan-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 21h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 21V7l6-3 6 3v14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 11h4M10 14h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  enterprise: (
    <svg className="plan-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9l4-4 4 4 4-4 4 4-2 9H6L4 9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 18h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
};

export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [registrationType, setRegistrationType] = useState('company'); // 'company' or 'user'
  const [companyStep, setCompanyStep] = useState(1); // 1: info, 2: plan, 3: payment

  // Company fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [industry, setIndustry] = useState('Construction');
  const [adminContact, setAdminContact] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  
  // Payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [billingName, setBillingName] = useState('');

  // User fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add('auth-lock-scroll');
    return () => {
      document.body.classList.remove('auth-lock-scroll');
    };
  }, []);

  const ensureUserInDirectory = (payload) => {
    dispatch(addUser({
      name: payload.name,
      email: payload.email,
      role: payload.role
    }));
  };

  const handleCompanyInfoNext = (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !companyName.trim() || !companyEmail.trim() || !companyPassword.trim()) {
      setError(t('Please fill all required fields'));
      return;
    }
    setError('');
    setCompanyStep(2);
  };

  const handlePlanNext = () => {
    if (!selectedPlan) {
      setError(t('Please select a plan'));
      return;
    }
    setError('');
    setCompanyStep(3);
  };

  const handleCompanyRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim() || !billingName.trim()) {
      setError(t('Please fill all payment fields'));
      setIsLoading(false);
      return;
    }

    try {
      const userPayload = {
        email: companyEmail.trim(),
        password: companyPassword,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        role: 'admin'
      };

      const result = await dispatch(loginUser(userPayload));
      if (result.type === 'auth/login/fulfilled') {
        ensureUserInDirectory(result.payload.user);

        const selectedPlanOption = PLAN_OPTIONS.find(p => p.id === selectedPlan) || PLAN_OPTIONS[0];
        const limits = getPlanLimits(selectedPlan);
        const orgId = `org-${Date.now()}`;
        
        dispatch(
          addOrganization({
            id: orgId,
            name: companyName.trim(),
            inviteCode: buildInviteCode(),
            brandColor: '#1ec9ff',
            logoUrl: '',
            planId: selectedPlan,
            planType: selectedPlan,
            plan_type: selectedPlan,
            workerLimit: limits.workers ?? null,
            worker_limit: limits.workers ?? null,
            planPrice: selectedPlanOption.price,
            industry: industry || '',
            adminContact: adminContact.trim() || companyEmail.trim()
          })
        );

        dispatch(
          addMembership({
            userId: result.payload.user.id,
            orgId,
            role: 'Admin',
            status: 'active'
          })
        );

        dispatch(setCurrentOrg(orgId));
        localStorage.setItem('athenea.registration.complete', 'true');
        localStorage.setItem('athenea.onboarding.complete', 'true');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(t('Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!firstName.trim() || !lastName.trim() || !userEmail.trim() || !userPassword.trim()) {
      setError(t('Please fill all required fields'));
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        email: userEmail.trim(),
        password: userPassword,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        role: 'worker'
      };

      const result = await dispatch(loginUser(payload));
      if (result.type === 'auth/login/fulfilled') {
        ensureUserInDirectory(result.payload.user);

        const defaultOrgId = 'org-1';
        dispatch(
          addMembership({
            userId: result.payload.user.id,
            orgId: defaultOrgId,
            role: 'Worker',
            status: 'pending'
          })
        );

        localStorage.setItem('athenea.registration.complete', 'true');
        localStorage.setItem('athenea.onboarding.complete', 'true');
        navigate('/awaiting-command');
      }
    } catch (err) {
      setError(t('Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-shell">
        <div className="register-card">
          <div className="register-header">
            <span className="register-kicker">{t('Register')}</span>
            <h1>{t('Create your account')}</h1>
            <p>{t('Choose your registration type below')}</p>
          </div>

          <div className="register-type-selector">
            <button
              type="button"
              className={`type-button ${registrationType === 'company' ? 'active' : ''}`}
              onClick={() => setRegistrationType('company')}
            >
              {t('Company')}
            </button>
            <button
              type="button"
              className={`type-button ${registrationType === 'user' ? 'active' : ''}`}
              onClick={() => setRegistrationType('user')}
            >
              {t('User')}
            </button>
          </div>

          {registrationType === 'company' && companyStep === 1 && (
            <form onSubmit={handleCompanyInfoNext} className="register-form">
              <div className="form-group">
                <label htmlFor="firstName">{t('First Name')} *</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder={t('Enter your name')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('Last Name')} *</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder={t('Enter your last name')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyName">{t('Company Name')} *</label>
                <input
                  id="companyName"
                  type="text"
                  placeholder={t('Enter your company name')}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="industry">{t('Industry')}</label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value="Construction">Construction</option>
                  <option value="Energy">Energy</option>
                  <option value="Telecom">Telecom</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="companyEmail">{t('Email')} *</label>
                <input
                  id="companyEmail"
                  type="email"
                  placeholder={t('Enter your email')}
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyPassword">{t('Password')} *</label>
                <input
                  id="companyPassword"
                  type="password"
                  placeholder={t('Enter your password')}
                  value={companyPassword}
                  onChange={(e) => setCompanyPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminContact">{t('Admin Contact')}</label>
                <input
                  id="adminContact"
                  type="email"
                  placeholder={t('Optional admin contact email')}
                  value={adminContact}
                  onChange={(e) => setAdminContact(e.target.value)}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="register-button">
                {t('Continue to Plan Selection')}
              </button>

              <div className="register-footer">
                <span>{t('Already have an account?')}</span>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate('/login')}
                >
                  {t('Sign in')}
                </button>
              </div>
            </form>
          )}

          {registrationType === 'company' && companyStep === 2 && (
            <div className="register-form">
              <h2 className="step-title">{t('Select your Plan')}</h2>
              <p className="step-desc">{t('Choose the plan that fits your organization')}</p>

              <div className="plans-grid">
                {PLAN_OPTIONS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const limits = getPlanLimits(plan.id);
                  return (
                    <button
                      type="button"
                      key={plan.id}
                      className={`plan-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="plan-header">
                        <div className="plan-title-row">
                          {PLAN_ICONS[plan.id]}
                          <span className="plan-title">{plan.title}</span>
                          {plan.recommended && (
                            <span className="plan-badge">{t('Recommended')}</span>
                          )}
                        </div>
                        <div className="plan-price">
                          <span className="plan-currency">$</span>
                          <span className="plan-amount">{plan.price}</span>
                          <span className="plan-period">/mo</span>
                        </div>
                      </div>
                      <ul className="plan-features">
                        {plan.features.map((feature) => (
                          <li key={feature}>{t(feature)}</li>
                        ))}
                      </ul>
                      <div className="plan-limit">
                        {t('Worker limit')}: {limits.workers ?? t('Unlimited')}
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="register-actions">
                <button
                  type="button"
                  className="register-button secondary"
                  onClick={() => setCompanyStep(1)}
                >
                  {t('Back')}
                </button>
                <button
                  type="button"
                  className="register-button"
                  onClick={handlePlanNext}
                >
                  {t('Continue to Payment')}
                </button>
              </div>
            </div>
          )}

          {registrationType === 'company' && companyStep === 3 && (
            <form onSubmit={handleCompanyRegister} className="register-form">
              <h2 className="step-title">{t('Payment Information')}</h2>
              <p className="step-desc">{t('Secure payment powered by Stripe')}</p>

              <div className="payment-summary">
                <div className="summary-row">
                  <span>{t('Plan')}</span>
                  <span className="summary-value">
                    {PLAN_OPTIONS.find(p => p.id === selectedPlan)?.title}
                  </span>
                </div>
                <div className="summary-row total">
                  <span>{t('Total')}</span>
                  <span className="summary-value">
                    ${PLAN_OPTIONS.find(p => p.id === selectedPlan)?.price}/mo
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="billingName">{t('Cardholder Name')} *</label>
                <input
                  id="billingName"
                  type="text"
                  placeholder={t('John Doe')}
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cardNumber">{t('Card Number')} *</label>
                <input
                  id="cardNumber"
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength="19"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cardExpiry">{t('Expiry Date')} *</label>
                  <input
                    id="cardExpiry"
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cardCvc">{t('CVC')} *</label>
                  <input
                    id="cardCvc"
                    type="text"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="payment-note">
                <svg className="lock-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                  />
                </svg>
                <span>{t('Your payment information is encrypted and secure')}</span>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="register-actions">
                <button
                  type="button"
                  className="register-button secondary"
                  onClick={() => setCompanyStep(2)}
                >
                  {t('Back')}
                </button>
                <button type="submit" className="register-button" disabled={isLoading}>
                  {isLoading ? t('Processing...') : t('Complete Registration')}
                </button>
              </div>
            </form>
          )}

          {registrationType === 'user' && (
            <form onSubmit={handleUserRegister} className="register-form">
              <div className="form-group">
                <label htmlFor="firstName">{t('First Name')} *</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder={t('Enter your name')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('Last Name')} *</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder={t('Enter your last name')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="userEmail">{t('Email')} *</label>
                <input
                  id="userEmail"
                  type="email"
                  placeholder={t('Enter your email')}
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="userPassword">{t('Password')} *</label>
                <input
                  id="userPassword"
                  type="password"
                  placeholder={t('Enter your password')}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="inviteCode">{t('Invite Code')} ({t('Optional')})</label>
                <input
                  id="inviteCode"
                  type="text"
                  placeholder={t('Enter invite code if you have one')}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="register-button" disabled={isLoading}>
                {isLoading ? t('Creating account...') : t('Create User Account')}
              </button>

              <div className="register-footer">
                <span>{t('Already have an account?')}</span>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate('/login')}
                >
                  {t('Sign in')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
