import React, { useState, useEffect } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import Button from './Button';

interface NavbarProps {
  onLogin?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Membership', href: '#membership' },
    { name: 'Join as Provider', href: '#providers' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-charcoal-900/80 backdrop-blur-md border-b border-charcoal-600 h-20 shadow-2xl' 
          : 'bg-transparent h-24'
      }`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-voltage-gradient p-2 rounded-lg group-hover:shadow-[0_0_15px_rgba(255,214,10,0.5)] transition-shadow">
            <Zap className="h-6 w-6 text-charcoal-900 fill-charcoal-900" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white group-hover:text-voltage transition-colors">
            Res<span className="text-voltage">Q</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-sm font-medium text-white/90 hover:text-voltage transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-voltage after:transition-all hover:after:w-full"
            >
              {link.name}
            </a>
          ))}
          <Button variant="secondary" size="sm" onClick={onLogin}>
            Log in
          </Button>
          <Button size="sm" onClick={onLogin}>
            Get App
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white hover:text-voltage"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-charcoal-800 border-b border-charcoal-600 p-6 flex flex-col gap-6 animate-fade-rise shadow-2xl">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-lg font-medium text-white hover:text-voltage"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-4 mt-4">
            <Button variant="secondary" className="w-full" onClick={() => { setIsMobileMenuOpen(false); onLogin?.(); }}>
              Log in
            </Button>
            <Button className="w-full" onClick={() => { setIsMobileMenuOpen(false); onLogin?.(); }}>
              Download App
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
