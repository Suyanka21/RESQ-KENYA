import React from 'react';
import { Check, Shield, Zap } from 'lucide-react';
import Button from './Button';

const Membership: React.FC = () => {
  return (
    <section id="membership" className="py-24 bg-charcoal-800 relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-voltage/5 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-voltage font-semibold tracking-wide uppercase text-sm mb-4">Membership Plans</h2>
          <h3 className="text-3xl md:text-5xl font-bold mb-6 text-white">Choose Your <span className="text-voltage">Peace of Mind</span></h3>
          <p className="text-text-secondary text-lg">
            Whether you are a daily commuter or a fleet manager, we have a protection plan for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basic Plan */}
          <div className="bg-charcoal-900 border border-charcoal-600 rounded-3xl p-8 flex flex-col hover:border-voltage/30 transition-colors">
            <div className="mb-6">
              <span className="text-text-secondary font-bold tracking-wider uppercase text-sm">Pay Per Use</span>
              <h4 className="text-3xl font-bold text-white mt-2">ResQ Basic</h4>
              <p className="text-4xl font-bold text-voltage mt-4">KES 0<span className="text-lg text-text-secondary font-normal">/mo</span></p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Pay only when you request service',
                'Access to all 6 service categories',
                'Standard response time (20-30 mins)',
                'Real-time GPS tracking',
                '24/7 Support access'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-charcoal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-text-secondary">{item}</span>
                </div>
              ))}
            </ul>

            <Button variant="tertiary" className="w-full">Get Started</Button>
          </div>

          {/* Gold Plan */}
          <div className="bg-charcoal-900 border border-voltage rounded-3xl p-8 flex flex-col relative shadow-[0_0_40px_rgba(255,214,10,0.1)] transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-voltage text-charcoal-900 font-bold px-4 py-1 rounded-full text-sm shadow-lg">
              MOST POPULAR
            </div>
            
            <div className="mb-6">
              <span className="text-voltage font-bold tracking-wider uppercase text-sm flex items-center gap-2">
                <Shield size={16} className="fill-voltage" /> Premium Protection
              </span>
              <h4 className="text-3xl font-bold text-white mt-2">ResQ Gold</h4>
              <p className="text-4xl font-bold text-white mt-4">KES 1,500<span className="text-lg text-text-secondary font-normal">/mo</span></p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Unlimited Free Towing (within 20km)',
                'Priority Dispatch (Top of queue)',
                '1 Free Vehicle Diagnostic per month',
                'Discounted Fuel Delivery fees',
                'Personal Account Manager',
                'Family Coverage (Up to 3 vehicles)'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-voltage flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-charcoal-900" />
                  </div>
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </ul>

            <Button variant="primary" pulse className="w-full">Join ResQ Gold</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Membership;
