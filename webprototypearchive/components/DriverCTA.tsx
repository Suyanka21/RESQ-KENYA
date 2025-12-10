import React from 'react';
import Button from './Button';
import { CheckCircle2, TrendingUp, Zap, Users } from 'lucide-react';

const DriverCTA: React.FC = () => {
  return (
    <section id="providers" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-charcoal-800"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-transparent"></div>
      
      {/* Background Image Overlay */}
      <div className="absolute right-0 top-0 h-full w-full md:w-1/2 opacity-20 bg-[url('https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl bg-charcoal-900/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-charcoal-600 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="inline-block bg-voltage text-charcoal-900 font-bold px-3 py-1 rounded text-xs mb-4 uppercase tracking-wider">
            Partner With Us
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Join the <span className="text-voltage">ResQ</span> Professional Network
          </h2>
          <p className="text-text-secondary text-lg mb-8 leading-relaxed">
            We are looking for certified <strong>mechanics</strong>, <strong>tow truck operators</strong>, and <strong>private ambulance services</strong> across Kenya. 
            Stop waiting for calls. Let the jobs come to you through the ResQ Provider App.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-charcoal-800 p-2 rounded-lg">
                <TrendingUp className="text-voltage w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Grow Your Business</h4>
                <p className="text-sm text-text-secondary">Access thousands of stranded motorists instantly without marketing costs.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-charcoal-800 p-2 rounded-lg">
                <Zap className="text-voltage w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Instant Payment</h4>
                <p className="text-sm text-text-secondary">Get paid immediately via M-Pesa upon job completion. No delays.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-charcoal-800 p-2 rounded-lg">
                <Users className="text-voltage w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Verified Trust</h4>
                <p className="text-sm text-text-secondary">Get a "Verified Partner" badge and build reputation with customer ratings.</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button>
              Register as Provider
            </Button>
            <Button variant="secondary">
              Download Provider App
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DriverCTA;
