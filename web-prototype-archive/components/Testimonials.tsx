import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Wanjiku Kimani",
    role: "Daily Commuter, Nairobi",
    text: "Stuck on Thika Road at 10 PM with a flat tire? Scariest moment ever. ResQ sent a mechanic who sorted it in 20 mins. Lifesavers!",
    rating: 5,
    image: "https://picsum.photos/seed/wanjiku/100"
  },
  {
    name: "Brian Otieno",
    role: "Matatu Sacco Manager",
    text: "We use ResQ for our entire fleet. Managing breakdowns, towing, and emergency repairs via the app has saved us so much downtime.",
    rating: 5,
    image: "https://picsum.photos/seed/brian/100"
  },
  {
    name: "Amina Yusuf",
    role: "New Driver, Mombasa",
    text: "The app is chonjo. I love tracking the rescue unit in real-time. It feels premium and safe, especially knowing I can get an ambulance or towing instantly.",
    rating: 4,
    image: "https://picsum.photos/seed/amina/100"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-charcoal-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Wakenya wanasema nini?</h2>
          <p className="text-text-secondary mt-4">Don't just take our word for it.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-charcoal-800 border border-charcoal-600 p-8 rounded-2xl relative">
              <Quote className="absolute top-8 right-8 text-charcoal-600 w-12 h-12" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, starI) => (
                  <Star 
                    key={starI} 
                    className={`w-5 h-5 ${starI < t.rating ? 'text-voltage fill-voltage' : 'text-charcoal-600'}`} 
                  />
                ))}
              </div>

              <p className="text-lg text-white mb-8 relative z-10 leading-relaxed">
                "{t.text}"
              </p>

              <div className="flex items-center gap-4">
                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full border-2 border-charcoal-600" />
                <div>
                  <h4 className="font-bold text-white">{t.name}</h4>
                  <p className="text-sm text-text-secondary">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;