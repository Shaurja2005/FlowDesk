import { useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'FREE',
      price: 0,
      tagline: 'Perfect for solo developers and small experiments',
      features: [
        'Up to 3 projects',
        '5 team members',
        'Kanban board',
        'Basic task management',
        'Community support',
      ],
      cta: 'Get started free',
      highlight: false,
    },
    {
      name: 'PRO',
      price: isAnnual ? 9.60 : 12,
      tagline: 'For growing teams that need more power',
      features: [
        'Unlimited projects',
        'Unlimited members',
        'GitHub integration',
        'Time tracking & logging',
        'Priority support',
        'Activity logs & audit trail',
        'Advanced filters & search',
        'CSV export',
      ],
      cta: 'Start 14-day free trial',
      highlight: true,
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      tagline: 'For large organisations with advanced needs',
      features: [
        'Everything in Pro',
        'SSO / SAML authentication',
        'Custom roles & permissions',
        'SLA support',
        'Dedicated account manager',
        'On-premise deployment option',
      ],
      cta: 'Contact sales',
      highlight: false,
    },
  ];

  const faqs = [
    {
      q: 'Can I switch plans later?',
      a: 'Absolutely. You can upgrade or downgrade your plan at any time. Prorated charges or credits will be applied automatically.',
    },
    {
      q: 'How do you calculate "seats" or members?',
      a: 'A seat is any user with an active account in your workspace. Deactivated users do not count toward your billing.',
    },
    {
      q: 'Do you offer a discount for non-profits?',
      a: 'Yes, we offer a 50% discount for registered non-profits and educational institutions. Please contact our support team.',
    },
  ];

  return (
    <div className="min-h-full py-10 px-4 sm:px-6 lg:px-8 animate-fade-in pb-20">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold text-primary-content sm:text-5xl tracking-tight mb-4">
          Simple pricing for every team
        </h1>
        <p className="text-xl text-secondary-content">
          Start free. Scale when you're ready.
        </p>

        <div className="mt-8 flex justify-center items-center gap-4">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-primary-content' : 'text-muted-content'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-primary-500"
            role="switch"
            aria-checked={isAnnual}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-primary-content' : 'text-muted-content'}`}>
            Annually
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`glass-card relative flex flex-col p-8 ${
              plan.highlight ? 'border-primary-500 ring-1 ring-primary-500 scale-105 z-10' : 'border-theme'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                  Most popular
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary-content uppercase tracking-wider">{plan.name}</h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-primary-content">
                {typeof plan.price === 'number' ? `$${plan.price.toFixed(isAnnual && plan.price > 0 ? 2 : 0)}` : plan.price}
                {typeof plan.price === 'number' && <span className="ml-1 text-xl font-medium text-muted-content">/mo</span>}
              </div>
              <p className="mt-4 text-sm text-secondary-content">{plan.tagline}</p>
            </div>

            <button
              className={`mt-4 w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.highlight 
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20' 
                  : 'bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-500/10'
              }`}
            >
              {plan.cta}
            </button>

            <ul className="mt-8 space-y-4 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="ml-3 text-sm text-secondary-content">{feature}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center text-primary-content mb-8">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group glass-card p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex items-center justify-between font-medium text-primary-content">
                {faq.q}
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="mt-4 text-secondary-content text-sm leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto glass-card p-8 bg-primary-500/5 border-primary-500/20 text-center">
        <h2 className="text-xl font-semibold text-primary-content mb-6 flex items-center justify-center gap-2">
          <HelpCircle size={20} className="text-primary-500" />
          All plans include
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-sm font-medium text-secondary-content">99.9% uptime SLA</div>
          <div className="text-sm font-medium text-secondary-content">1-click data export</div>
          <div className="text-sm font-medium text-secondary-content">Beautiful dark mode</div>
          <div className="text-sm font-medium text-secondary-content">Responsive mobile layout</div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
