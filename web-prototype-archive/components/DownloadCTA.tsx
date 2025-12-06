import React from 'react';
import Button from './Button';
import { Smartphone } from 'lucide-react';

const DownloadCTA: React.FC = () => {
  return (
    <section className="py-24 bg-voltage-gradient relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-black text-charcoal-900 mb-6 voltage-text-shadow">
          NEVER RUN EMPTY AGAIN.
        </h2>
        <p className="text-charcoal-900/80 text-xl font-medium max-w-2xl mx-auto mb-10">
          Join the network that keeps your city moving. Download FuelRescue today and get your first delivery fee waived.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-charcoal-900 text-white hover:bg-charcoal-800 transition-colors px-8 py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl hover:scale-105 duration-200">
                <Smartphone className="w-6 h-6" />
                <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-lg font-bold leading-none">App Store</div>
                </div>
            </button>
            <button className="bg-charcoal-900 text-white hover:bg-charcoal-800 transition-colors px-8 py-4 rounded-xl flex items-center justify-center gap-3 shadow-xl hover:scale-105 duration-200">
                <Smartphone className="w-6 h-6" />
                <div className="text-left">
                    <div className="text-xs text-gray-400">GET IT ON</div>
                    <div className="text-lg font-bold leading-none">Google Play</div>
                </div>
            </button>
        </div>
      </div>

      {/* Decorative energy sweep */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[energySweep_3s_infinite_linear] pointer-events-none opacity-30"></div>
    </section>
  );
};

export default DownloadCTA;