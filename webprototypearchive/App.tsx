import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Membership from './components/Membership';
import Testimonials from './components/Testimonials';
import DriverCTA from './components/DriverCTA';
import DownloadCTA from './components/DownloadCTA';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';

export type ViewState = 'landing' | 'dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');

  const handleLogin = () => {
    // Bypass auth for demo purposes
    setView('dashboard');
    window.scrollTo(0, 0);
  };

  if (view === 'dashboard') {
    return <Dashboard onLogout={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-charcoal-900 text-white font-sans selection:bg-voltage selection:text-charcoal-900 overflow-x-hidden">
      <Navbar onLogin={handleLogin} />
      <main>
        <Hero onGetStarted={handleLogin} />
        <Features />
        <HowItWorks />
        <Membership />
        <Testimonials />
        <DriverCTA />
        <DownloadCTA />
      </main>
      <Footer />
    </div>
  );
};

export default App;
