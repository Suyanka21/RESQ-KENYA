import React from 'react';

const steps = [
  {
    num: "01",
    title: "Select Your Emergency",
    desc: "Open the ResQ app and choose the service you need—whether it's Towing, Ambulance, Fuel, or Mechanics."
  },
  {
    num: "02",
    title: "Share Live Location",
    desc: "Our GPS integration pinpoints your exact location, even if you are unsure where you are on the highway."
  },
  {
    num: "03",
    title: "Instant Dispatch",
    desc: "The nearest verified provider (Tow Truck, Ambulance, or Mechanic) accepts the job and heads your way immediately."
  },
  {
    num: "04",
    title: "Track & Pay",
    desc: "Watch the unit arrive in real-time on the map. Pay securely via M-Pesa only after the service is complete."
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-charcoal-800 border-y border-charcoal-600">
      <div className="container mx-auto px-4">
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-4">How <span className="text-voltage">ResQ</span> Works</h2>
          <p className="text-text-secondary text-lg">We've simplified emergency response into 4 easy steps to get you moving again.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-charcoal-600 -z-10"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative pt-4">
              <div className="w-16 h-16 bg-charcoal-900 border-2 border-voltage rounded-2xl flex items-center justify-center text-2xl font-bold text-voltage mb-6 shadow-[0_0_20px_rgba(255,214,10,0.2)] z-10 mx-auto md:mx-0">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center md:text-left">{step.title}</h3>
              <p className="text-text-secondary text-center md:text-left leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
