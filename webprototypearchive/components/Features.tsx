import type React from "react"
import { Truck, HeartPulse, Wrench, Battery, Zap, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: Truck,
    title: "Flatbed Towing",
    description:
      "Stuck on the highway? We dispatch professional flatbeds to safely transport your vehicle to your preferred garage.",
  },
  {
    icon: HeartPulse,
    title: "Ambulance Dispatch",
    description:
      "Medical emergencies require speed. One tap connects you to the nearest ambulance service with GPS precision.",
  },
  {
    icon: Wrench,
    title: "Tire & Mechanical",
    description:
      "From punctures to engine overheating, our network of verified mobile mechanics is ready to fix you on the spot.",
  },
  {
    icon: Battery,
    title: "Battery Jumpstart",
    description:
      "Car won't start? Don't wait for a stranger. We deliver a jumpstart or battery replacement in minutes.",
  },
  {
    icon: Zap,
    title: "Vehicle Diagnostics",
    description:
      "Warning lights on the dashboard? Get a technician with an OBD scanner to diagnose the issue instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Fuel Delivery",
    description: "Ran empty? We deliver petrol or diesel in safe, approved containers directly to your location.",
  },
]

const Features: React.FC = () => {
  return (
    <section id="services" className="py-24 bg-charcoal-900 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-voltage font-semibold tracking-wide uppercase text-sm mb-4">Our Services</h2>
          <h3 className="text-3xl md:text-5xl font-bold mb-6">
            Complete <span className="text-transparent bg-clip-text bg-voltage-gradient">Emergency Infrastructure</span>
          </h3>
          <p className="text-text-secondary text-lg">
            ResQ is not just an app; it's your lifeline on Kenyan roads. We provide comprehensive coverage for both
            vehicle and medical emergencies.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-charcoal-800 border border-charcoal-600 rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 hover:border-voltage/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              {/* Inner Glow on Hover */}
              <div className="absolute inset-0 rounded-2xl bg-voltage/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="w-12 h-12 bg-charcoal-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-voltage-gradient transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-voltage group-hover:text-charcoal-900 transition-colors duration-300" />
              </div>

              <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
              <p className="text-text-secondary leading-relaxed group-hover:text-white/80 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
