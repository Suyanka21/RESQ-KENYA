import React from 'react';
import { MapPin, Star, ArrowRight, Truck, Activity } from 'lucide-react';
import Button from './Button';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-dark-gradient">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-voltage/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-voltage/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left Content */}
        <div className="space-y-8 max-w-2xl animate-fade-rise">
          <div className="inline-flex items-center gap-2 bg-charcoal-800 border border-charcoal-600 rounded-full px-4 py-1.5 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-xs font-semibold tracking-wide uppercase text-text-secondary">
              24/7 Response in Nairobi
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
            Help when it <br />
            matters <br />
            <span className="text-transparent bg-clip-text bg-voltage-gradient voltage-text-shadow">
              most.
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-text-secondary max-w-lg leading-relaxed">
            From flatbed towing and tire repair to ambulance dispatch. 
            ResQ is the "Uber for Rescue" — fast, reliable, and just a tap away.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" pulse className="w-full sm:w-auto shadow-[0_0_40px_rgba(255,214,10,0.3)]" onClick={onGetStarted}>
              Request Assistance
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={onGetStarted}>
              View Services
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-4 text-sm text-text-secondary">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-charcoal-900 overflow-hidden bg-charcoal-700">
                  <img src={`https://picsum.photos/seed/driver${i}/100`} alt="Driver" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-voltage">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span>Verified Mechanics & Medics</span>
            </div>
          </div>
        </div>

        {/* Right Content - Visual */}
        <div className="relative hidden lg:block h-[800px] w-full">
           {/* Abstract Phone/Map Visualization */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[700px] bg-charcoal-800 rounded-[48px] border-8 border-charcoal-600 shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden z-20">
              {/* Fake UI Header */}
              <div className="h-14 bg-charcoal-900 border-b border-charcoal-600 flex items-center justify-between px-6">
                 <span className="font-bold">ResQ App</span>
                 <div className="w-8 h-8 rounded-full bg-charcoal-700 flex items-center justify-center">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                 </div>
              </div>
              
              {/* Fake Map */}
              <div className="w-full h-full bg-charcoal-800 relative bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/36.8219,-1.2921,13,0/350x700?access_token=Pk.xxx')] bg-cover">
                  {/* Fallback pattern if image fails */}
                  <div className="absolute inset-0 bg-charcoal-800/80"></div>

                  {/* Map Roads (CSS Art representation of Nairobi nodes) */}
                  <div className="absolute top-0 left-1/2 w-4 h-full bg-charcoal-700/50 -translate-x-1/2"></div>
                  <div className="absolute top-1/2 left-0 w-full h-4 bg-charcoal-700/50 -translate-y-1/2 rotate-12"></div>
                  
                  {/* User Pin */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-voltage/20 animate-ping absolute"></div>
                    <div className="w-4 h-4 rounded-full bg-voltage shadow-[0_0_20px_#FFD60A] relative z-10 border-2 border-white"></div>
                    <div className="mt-2 bg-charcoal-900 text-xs px-2 py-1 rounded text-white font-bold shadow-lg">You (Muthaiga)</div>
                  </div>

                  {/* Driver Card Overlay */}
                  <div className="absolute bottom-8 left-4 right-4 bg-charcoal-900/90 backdrop-blur border border-voltage/30 p-4 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-charcoal-700 border border-charcoal-600 flex items-center justify-center">
                                <Truck size={20} className="text-white"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">ResQ Towing Unit</h4>
                                <p className="text-xs text-text-secondary">Arriving in 12 mins</p>
                            </div>
                        </div>
                        <div className="bg-voltage text-charcoal-900 font-bold px-2 py-1 rounded text-xs">
                            DISPATCHED
                        </div>
                    </div>
                    <div className="w-full bg-charcoal-700 h-1 rounded-full overflow-hidden">
                        <div className="bg-voltage h-full w-[65%]"></div>
                    </div>
                  </div>
              </div>
           </div>

           {/* Decorative elements behind phone */}
           <div className="absolute top-1/3 right-0 w-64 h-64 bg-voltage rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>
        </div>

      </div>
    </section>
  );
};

export default Hero;