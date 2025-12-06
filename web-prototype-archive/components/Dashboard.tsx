import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Menu, 
  Bell, 
  Settings, 
  Droplet, 
  CreditCard, 
  Clock,
  Phone,
  Shield,
  X,
  ChevronRight,
  LogOut,
  Smartphone,
  History,
  Wallet,
  User,
  Car,
  Tag,
  Plus,
  Fuel,
  Truck,
  HeartPulse,
  Wrench,
  Battery,
  Activity,
  AlertTriangle
} from 'lucide-react';
import Button from './Button';

// Nairobi Prices (Base estimates)
const PRICES = {
    FUEL_PETROL: 180.66,
    FUEL_DIESEL: 168.06,
    TOWING_BASE: 5000,
    AMBULANCE_BASE: 3500,
    JUMPSTART_BASE: 1500,
    TIRE_BASE: 2000,
    DIAGNOSTICS_BASE: 2500
};

interface DashboardProps {
  onLogout: () => void;
}

type OrderStage = 'idle' | 'service-select' | 'locating' | 'details-input' | 'payment' | 'processing' | 'tracking' | 'complete';
type View = 'home' | 'orders' | 'wallet' | 'settings';
type ServiceType = 'fuel' | 'towing' | 'ambulance' | 'battery' | 'tire' | 'diagnostics' | null;

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type?: 'info' | 'alert';
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [stage, setStage] = useState<OrderStage>('idle');
  
  // Order State
  const [selectedService, setSelectedService] = useState<ServiceType>(null);
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel' | null>('petrol');
  const [amount, setAmount] = useState<string>('2000'); 
  const [towDestination, setTowDestination] = useState<string>('');
  const [ambulanceNotes, setAmbulanceNotes] = useState<string>('');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eta, setEta] = useState(15);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState<Notification | null>(null);

  // Real-time driver simulation state
  const [driverProgress, setDriverProgress] = useState(0);

  // Simulate push notifications
  const triggerNotification = (title: string, message: string, type: 'info' | 'alert' = 'info') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: 'Now',
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
    setShowNotification(newNotif);
    setTimeout(() => setShowNotification(null), 5000);
  };

  // Simulate ETA countdown and driver movement
  useEffect(() => {
    if (stage === 'tracking') {
      const interval = setInterval(() => {
        setEta((prev) => {
          if (prev <= 1) {
            triggerNotification('Rescue Unit Arrived', 'The ResQ unit has arrived at your location.', 'alert');
            setStage('complete');
            return 0;
          }
          if (prev === 10) triggerNotification('Unit Dispatched', 'ResQ Unit is en route via Waiyaki Way.');
          return prev - 1;
        });
        
        // Move driver marker
        setDriverProgress(prev => Math.min(prev + (100 / 15), 100));
      }, 2000); 
      return () => clearInterval(interval);
    } else {
      setEta(15);
      setDriverProgress(0);
    }
  }, [stage]);

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
    setStage('locating');
    setTimeout(() => setStage('details-input'), 1500);
  };

  const handlePayment = () => {
    setStage('processing');
    setTimeout(() => {
        const cost = calculateTotalCost();
        triggerNotification('Payment Received', `KES ${cost.toLocaleString()} received via M-Pesa.`);
        setStage('tracking');
    }, 2500);
  };

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const calculateFuelLiters = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || !fuelType) return '0.00';
    const price = fuelType === 'petrol' ? PRICES.FUEL_PETROL : PRICES.FUEL_DIESEL;
    return (val / price).toFixed(2);
  };

  const calculateTotalCost = () => {
    // Delivery/Service Fee is hardcoded as 200 for fuel, included in base for others
    if (selectedService === 'fuel') {
        const fuelAmt = parseFloat(amount);
        return isNaN(fuelAmt) ? 0 : fuelAmt + 200;
    }
    if (selectedService === 'towing') return PRICES.TOWING_BASE;
    if (selectedService === 'ambulance') return PRICES.AMBULANCE_BASE;
    if (selectedService === 'battery') return PRICES.JUMPSTART_BASE;
    if (selectedService === 'tire') return PRICES.TIRE_BASE;
    if (selectedService === 'diagnostics') return PRICES.DIAGNOSTICS_BASE;
    return 0;
  };

  // Helper for safe number display
  const getDisplayAmount = () => {
    if (selectedService === 'fuel') {
        const val = parseFloat(amount);
        return isNaN(val) ? 0 : val;
    }
    return 0;
  };

  const isFormValid = () => {
    if (selectedService === 'fuel') return fuelType !== null && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
    if (selectedService === 'towing') return towDestination.length > 3;
    if (selectedService === 'ambulance') return true; // Can allow empty notes for speed
    return true; // Other services just need selection
  };

  // Service Config for UI
  const SERVICES = [
    { id: 'towing', label: 'Flatbed Towing', icon: Truck, color: 'text-voltage' },
    { id: 'ambulance', label: 'Ambulance', icon: HeartPulse, color: 'text-error' },
    { id: 'battery', label: 'Battery Jump', icon: Battery, color: 'text-voltage' },
    { id: 'fuel', label: 'Fuel Delivery', icon: Droplet, color: 'text-voltage' },
    { id: 'tire', label: 'Tire Repair', icon: Wrench, color: 'text-voltage' },
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity, color: 'text-voltage' },
  ] as const;

  return (
    <div className="relative h-screen w-full bg-charcoal-900 overflow-hidden flex font-sans">
      
      {/* Toast Notification */}
      {showNotification && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm border shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 flex gap-4 animate-fade-rise cursor-pointer ${showNotification.type === 'alert' ? 'bg-error/10 border-error' : 'bg-charcoal-800 border-voltage/50'}`} onClick={() => setShowNotification(null)}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${showNotification.type === 'alert' ? 'bg-error text-white' : 'bg-voltage/20 text-voltage'}`}>
             <Bell className="w-5 h-5" />
          </div>
          <div>
             <h4 className={`font-bold text-sm ${showNotification.type === 'alert' ? 'text-error' : 'text-white'}`}>{showNotification.title}</h4>
             <p className="text-text-secondary text-xs">{showNotification.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`absolute md:relative z-50 h-full w-72 bg-charcoal-800 border-r border-charcoal-600 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
           <span className="text-xl font-bold text-white">Res<span className="text-voltage">Q</span></span>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white"><X /></button>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 p-3 bg-charcoal-700 rounded-xl mb-6 cursor-pointer hover:bg-charcoal-600 transition-colors" onClick={() => handleNavigation('settings')}>
             <img src="https://picsum.photos/seed/user/50" className="w-10 h-10 rounded-full border border-voltage" alt="User" />
             <div>
               <h4 className="font-bold text-white text-sm">Joseph Wainaina</h4>
               <p className="text-xs text-text-secondary">Muthaiga, Nairobi</p>
             </div>
          </div>

          <nav className="space-y-2">
            <NavButton icon={MapPin} label="Rescue Map" active={currentView === 'home'} onClick={() => handleNavigation('home')} />
            <NavButton icon={History} label="History" active={currentView === 'orders'} onClick={() => handleNavigation('orders')} />
            <NavButton icon={Wallet} label="Wallet" active={currentView === 'wallet'} onClick={() => handleNavigation('wallet')} />
            <NavButton icon={Settings} label="Settings" active={currentView === 'settings'} onClick={() => handleNavigation('settings')} />
            
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors mt-8">
                <LogOut size={18} />
                Logout
            </button>
          </nav>
        </div>
        
        <div className="absolute bottom-6 left-6 right-6">
           <div className="bg-voltage/10 border border-voltage/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-voltage">
                 <Shield size={16} />
                 <span className="text-xs font-bold uppercase">Membership</span>
              </div>
              <p className="text-white text-sm font-bold">ResQ Gold Active</p>
              <p className="text-xs text-text-secondary">Exp: Dec 2025</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative bg-charcoal-900 overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="md:hidden absolute top-0 left-0 right-0 z-40 p-4 flex justify-between items-center pointer-events-none">
           <button onClick={() => setSidebarOpen(true)} className="pointer-events-auto bg-charcoal-800 p-2 rounded-lg text-white shadow-lg border border-charcoal-600">
             <Menu />
           </button>
           {currentView === 'home' && (
             <div className="pointer-events-auto bg-charcoal-800/90 backdrop-blur px-4 py-2 rounded-full border border-charcoal-600 shadow-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white">Muthaiga, NBO</span>
             </div>
           )}
           <button 
             onClick={() => triggerNotification('Test Notification', 'This is a test push notification.')}
             className="pointer-events-auto bg-charcoal-800 p-2 rounded-lg text-white shadow-lg border border-charcoal-600 relative"
           >
             <Bell size={20} />
             {notifications.length > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-voltage rounded-full"></div>}
           </button>
        </header>

        {/* ----------------- VIEW: HOME (MAP) ----------------- */}
        {currentView === 'home' && (
          <div className="relative w-full h-full">
            {/* Map Background */}
            <div className="absolute inset-0 bg-charcoal-900 z-0 overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/36.8219,-1.2921,14,0/1200x800?access_token=Pk.xxx')] bg-cover bg-center opacity-60 grayscale-[30%]"></div>
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

               {/* User Pin */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-1000">
                 <div className="relative">
                    <div className="w-24 h-24 bg-voltage/20 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-6 h-6 bg-voltage border-4 border-white rounded-full shadow-[0_0_20px_#FFD60A] relative z-10"></div>
                 </div>
               </div>

               {/* Moving Driver Pin (Simulated) */}
               {stage === 'tracking' && (
                 <div 
                   className="absolute z-20 transition-all duration-[2000ms] ease-linear"
                   style={{
                     top: `${10 + (driverProgress * 0.4)}%`, 
                     left: `${10 + (driverProgress * 0.4)}%`,
                   }}
                 >
                    <div className="relative">
                       <div className="bg-charcoal-900 text-white text-[10px] font-bold px-2 py-1 rounded mb-1 whitespace-nowrap border border-charcoal-600 shadow-lg">ResQ Unit</div>
                       <div className="w-8 h-8 bg-charcoal-900 rounded-full border-2 border-voltage flex items-center justify-center shadow-xl rotate-45">
                          <Truck className="text-white w-4 h-4 -rotate-45" />
                       </div>
                    </div>
                 </div>
               )}
            </div>

            {/* ACTION PANELS */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-30 flex justify-center pointer-events-none">
               <div className="pointer-events-auto w-full max-w-lg">
                 
                 {stage === 'idle' && (
                   <div className="bg-charcoal-800/95 backdrop-blur border border-charcoal-600 rounded-3xl p-6 shadow-2xl animate-fade-rise">
                      <div className="flex items-center justify-between mb-4">
                         <h2 className="text-lg font-bold text-white">Select Service</h2>
                         <div className="bg-charcoal-700 px-3 py-1 rounded-full border border-charcoal-600">
                            <span className="text-xs text-text-secondary">Vehicle: </span>
                            <span className="text-xs font-bold text-white">Toyota Prado (KBZ...)</span>
                         </div>
                      </div>

                      {/* Service Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {SERVICES.map((s) => (
                            <button 
                                key={s.id}
                                onClick={() => handleServiceSelect(s.id as ServiceType)}
                                className="flex flex-col items-center justify-center p-4 bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-600 hover:border-voltage/50 rounded-xl transition-all group"
                            >
                                <div className={`w-10 h-10 rounded-full bg-charcoal-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                    <s.icon className={`w-6 h-6 ${s.color}`} />
                                </div>
                                <span className="text-xs font-bold text-white text-center leading-tight">{s.label}</span>
                            </button>
                        ))}
                      </div>

                      <div className="bg-voltage/10 border border-voltage/20 p-3 rounded-lg flex items-start gap-3">
                         <AlertTriangle className="text-voltage w-5 h-5 flex-shrink-0" />
                         <div>
                            <p className="text-white font-bold text-sm">Emergency Hot Buttons</p>
                            <p className="text-xs text-text-secondary">Tap 'Ambulance' for immediate medical dispatch. Police hotline available in Settings.</p>
                         </div>
                      </div>
                   </div>
                 )}

                 {stage === 'locating' && (
                   <div className="bg-charcoal-800 border border-charcoal-600 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center animate-pulse">
                      <div className="w-16 h-16 border-4 border-voltage border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h3 className="text-xl font-bold text-white">Locating nearest unit...</h3>
                      <p className="text-text-secondary mt-2">Checking verified providers in Muthaiga.</p>
                   </div>
                 )}

                 {stage === 'details-input' && (
                   <div className="bg-charcoal-800 border border-charcoal-600 rounded-3xl p-6 shadow-2xl animate-fade-rise">
                      <div className="flex items-center mb-6">
                         <button onClick={() => setStage('idle')} className="text-text-secondary hover:text-white mr-4"><X size={20} /></button>
                         <h2 className="text-xl font-bold text-white">
                             {SERVICES.find(s => s.id === selectedService)?.label} Details
                         </h2>
                      </div>
                      
                      {/* FUEL FORM */}
                      {selectedService === 'fuel' && (
                          <div className="mb-6">
                            <div className="flex gap-4 mb-6">
                                <button onClick={() => setFuelType('petrol')} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${fuelType === 'petrol' ? 'border-voltage bg-voltage/10 text-voltage' : 'border-charcoal-600 bg-charcoal-700 text-text-secondary'}`}>
                                Petrol <span className="text-xs block opacity-70">KES {PRICES.FUEL_PETROL}</span>
                                </button>
                                <button onClick={() => setFuelType('diesel')} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${fuelType === 'diesel' ? 'border-voltage bg-voltage/10 text-voltage' : 'border-charcoal-600 bg-charcoal-700 text-text-secondary'}`}>
                                Diesel <span className="text-xs block opacity-70">KES {PRICES.FUEL_DIESEL}</span>
                                </button>
                            </div>
                            <label className="text-sm text-text-secondary mb-2 block">Amount (KES)</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-2xl font-bold text-white focus:border-voltage outline-none mb-2"
                            />
                            <p className="text-voltage text-sm font-bold text-right">{calculateFuelLiters()} Liters</p>
                          </div>
                      )}

                      {/* TOWING FORM */}
                      {selectedService === 'towing' && (
                          <div className="mb-6">
                            <label className="text-sm text-text-secondary mb-2 block">Destination (Garage/Home)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Toyota Kenya, Mombasa Rd"
                                value={towDestination} 
                                onChange={(e) => setTowDestination(e.target.value)} 
                                className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-white focus:border-voltage outline-none mb-4"
                            />
                            <div className="bg-charcoal-900 p-4 rounded-xl border border-charcoal-600">
                                <div className="flex justify-between mb-2">
                                    <span className="text-text-secondary">Base Fee</span>
                                    <span className="text-white">KES {PRICES.TOWING_BASE.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Per KM</span>
                                    <span className="text-white">KES 200</span>
                                </div>
                            </div>
                          </div>
                      )}

                      {/* AMBULANCE FORM */}
                      {selectedService === 'ambulance' && (
                          <div className="mb-6">
                             <div className="bg-error/10 border border-error/30 p-4 rounded-xl mb-4">
                                <p className="text-error font-bold text-sm">For critical life-threatening emergencies, call 999 directly.</p>
                             </div>
                            <label className="text-sm text-text-secondary mb-2 block">Nature of Emergency (Optional)</label>
                            <textarea 
                                placeholder="e.g. Chest pains, unconsciousness..."
                                value={ambulanceNotes} 
                                onChange={(e) => setAmbulanceNotes(e.target.value)} 
                                className="w-full bg-charcoal-900 border border-charcoal-600 rounded-xl py-3 px-4 text-white focus:border-voltage outline-none mb-4 h-24 resize-none"
                            />
                          </div>
                      )}

                      <div className="flex justify-between items-center border-t border-charcoal-600 pt-4 mb-4">
                        <span className="text-text-secondary">Estimated Total</span>
                        <span className="text-2xl font-bold text-white">KES {calculateTotalCost().toLocaleString()}</span>
                      </div>
                      <Button className="w-full" disabled={!isFormValid()} onClick={() => setStage('payment')}>
                          {selectedService === 'ambulance' ? 'Request Ambulance' : 'Proceed to Payment'}
                      </Button>
                   </div>
                 )}

                 {stage === 'payment' && (
                   <div className="bg-charcoal-800 border border-charcoal-600 rounded-3xl p-6 shadow-2xl animate-fade-rise">
                      <div className="flex items-center mb-6">
                         <button onClick={() => setStage('details-input')} className="text-text-secondary hover:text-white mr-4"><ChevronRight className="rotate-180" size={20} /></button>
                         <h2 className="text-xl font-bold text-white">Confirm Request</h2>
                      </div>
                      <div className="bg-charcoal-900 rounded-xl p-4 mb-6 border border-charcoal-600">
                         <div className="flex justify-between mb-2">
                            <span className="text-text-secondary">Service</span>
                            <span className="text-white font-bold capitalize">{selectedService?.replace('-', ' ')}</span>
                         </div>
                         <div className="flex justify-between mb-2">
                            <span className="text-text-secondary">Location</span>
                            <span className="text-white">Muthaiga, NBO</span>
                         </div>
                         <div className="h-px bg-charcoal-600 my-2"></div>
                         <div className="flex justify-between">
                            <span className="font-bold text-white">Total</span>
                            <span className="font-bold text-voltage">KES {calculateTotalCost().toLocaleString()}</span>
                         </div>
                      </div>
                      <Button className="w-full bg-success text-charcoal-900 hover:bg-success/90" onClick={handlePayment}>Lipa na M-Pesa</Button>
                   </div>
                 )}

                 {stage === 'processing' && (
                   <div className="bg-charcoal-800 border border-charcoal-600 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-charcoal-900 rounded-full flex items-center justify-center mb-4 relative">
                         <div className="absolute inset-0 border-4 border-success rounded-full animate-ping opacity-20"></div>
                         <Smartphone className="text-success w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Check your phone</h3>
                      <p className="text-text-secondary mt-2">Enter M-Pesa PIN to complete request.</p>
                   </div>
                 )}

                 {stage === 'tracking' && (
                   <div className="bg-charcoal-800 border border-charcoal-600 rounded-3xl p-0 overflow-hidden shadow-2xl animate-fade-rise">
                      <div className="bg-voltage-gradient p-4 flex justify-between items-center text-charcoal-900">
                         <div className="font-bold flex items-center gap-2">
                           <Clock size={18} />
                           ARRIVING IN {eta} MINS
                         </div>
                         <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">ON TIME</span>
                      </div>
                      <div className="p-6">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full border-2 border-charcoal-600 bg-charcoal-700 flex items-center justify-center">
                                {selectedService === 'towing' ? <Truck className="text-white w-8 h-8" /> : 
                                 selectedService === 'ambulance' ? <HeartPulse className="text-error w-8 h-8" /> :
                                 <Truck className="text-white w-8 h-8" />}
                            </div>
                            <div>
                               <h3 className="text-xl font-bold text-white">ResQ Unit #402</h3>
                               <p className="text-text-secondary text-sm">Isusu FRR • KDA 892C</p>
                            </div>
                            <div className="flex gap-2 ml-auto">
                               <button className="w-10 h-10 rounded-full bg-charcoal-700 flex items-center justify-center hover:bg-voltage hover:text-charcoal-900 text-white transition-colors">
                                  <Phone size={20} />
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}

                 {stage === 'complete' && (
                   <div className="bg-charcoal-800 border border-charcoal-600 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center animate-fade-rise">
                      <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                           <Shield className="text-charcoal-900 w-8 h-8" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Rescue Complete!</h3>
                      <p className="text-text-secondary mb-6">Service fulfilled. Stay safe on the road.</p>
                      <Button onClick={() => { setStage('idle'); setSelectedService(null); }}>Back to Home</Button>
                   </div>
                 )}

               </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW: MY ORDERS ----------------- */}
        {currentView === 'orders' && (
          <div className="p-6 md:p-12 max-w-4xl mx-auto w-full animate-fade-rise pt-24 md:pt-12">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
               <History className="text-voltage" /> Rescue History
            </h2>
            
            <div className="space-y-4">
               {[
                 { id: '#RSQ-2093', date: 'Today, 12:30 PM', loc: 'Westlands', amount: '5000', status: 'In Progress', type: 'Flatbed Towing' },
                 { id: '#RSQ-1029', date: '12 Oct 2023', loc: 'Thika Road Mall', amount: '1500', status: 'Completed', type: 'Battery Jump' },
                 { id: '#RSQ-0921', date: '28 Sep 2023', loc: 'Mombasa Road', amount: '3000', status: 'Completed', type: 'Fuel Delivery' },
               ].map((order, i) => (
                 <div key={i} className="bg-charcoal-800 border border-charcoal-600 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-voltage/50 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center ${order.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-voltage/10 text-voltage'}`}>
                          <Truck size={24} />
                       </div>
                       <div>
                          <h4 className="font-bold text-white text-lg">{order.loc}</h4>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                             <span>{order.date}</span>
                             <span>•</span>
                             <span>{order.type}</span>
                             <span>•</span>
                             <span className="font-mono">{order.id}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                       <div className="text-right">
                          <div className="font-bold text-white text-lg">KES {order.amount}</div>
                          <div className={`text-xs font-bold uppercase ${order.status === 'Completed' ? 'text-success' : 'text-voltage'}`}>{order.status}</div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* ----------------- VIEW: WALLET ----------------- */}
        {currentView === 'wallet' && (
          <div className="p-6 md:p-12 max-w-4xl mx-auto w-full animate-fade-rise pt-24 md:pt-12">
             <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
               <Wallet className="text-voltage" /> Wallet
            </h2>
            {/* ... (Keep existing Wallet UI but conceptually it works for all services) ... */}
             <div className="grid md:grid-cols-2 gap-8 mb-10">
               {/* Balance Card */}
               <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 border border-charcoal-600 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-32 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                     <p className="text-text-secondary mb-2">M-Pesa Connected Balance</p>
                     <h3 className="text-4xl font-bold text-white mb-6 font-mono">KES 4,500.00</h3>
                     <div className="flex gap-4">
                        <Button size="sm" className="bg-success text-charcoal-900 hover:bg-success/90 border-none">Top Up</Button>
                        <Button size="sm" variant="tertiary">History</Button>
                     </div>
                  </div>
               </div>
            </div>
            {/* Keep existing payment methods UI */}
            <h3 className="text-xl font-bold text-white mb-4">Payment Methods</h3>
            <div className="space-y-4">
               <div className="bg-charcoal-800 p-4 rounded-xl border border-success/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-8 bg-success rounded flex items-center justify-center font-bold text-white text-xs">M-PESA</div>
                     <div>
                        <div className="font-bold text-white">Safaricom M-Pesa</div>
                        <div className="text-sm text-text-secondary">Connected: 07** *** 892</div>
                     </div>
                  </div>
                  <span className="bg-success/10 text-success text-xs font-bold px-2 py-1 rounded">PRIMARY</span>
               </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW: SETTINGS ----------------- */}
        {currentView === 'settings' && (
          <div className="p-6 md:p-12 max-w-3xl mx-auto w-full animate-fade-rise pt-24 md:pt-12">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
               <Settings className="text-voltage" /> Settings
            </h2>
            {/* Updated Profile Data */}
            <div className="space-y-8">
               <section>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><User size={20}/> Profile</h3>
                  <div className="bg-charcoal-800 border border-charcoal-600 rounded-2xl p-6">
                     <div className="flex items-center gap-6 mb-6">
                        <img src="https://picsum.photos/seed/user/100" className="w-20 h-20 rounded-full border-2 border-voltage" alt="Profile" />
                        <div>
                           <Button variant="secondary" size="sm" className="mb-2">Change Photo</Button>
                        </div>
                     </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-sm text-text-secondary">Full Name</label>
                           <input type="text" value="Joseph Wainaina" className="w-full bg-charcoal-900 border border-charcoal-600 rounded-lg p-3 text-white focus:border-voltage outline-none" readOnly />
                        </div>
                        <div className="space-y-1">
                           <label className="text-sm text-text-secondary">Location</label>
                           <input type="text" value="Muthaiga, Nairobi" className="w-full bg-charcoal-900 border border-charcoal-600 rounded-lg p-3 text-white focus:border-voltage outline-none" readOnly />
                        </div>
                     </div>
                  </div>
               </section>
               {/* Keep Vehicles section */}
               <section>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Car size={20}/> Saved Vehicles</h3>
                  <div className="space-y-3">
                     <div className="bg-charcoal-800 border border-voltage/50 rounded-xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-charcoal-700 rounded-lg flex items-center justify-center"><Car className="text-white"/></div>
                           <div>
                              <h4 className="font-bold text-white">Toyota Prado</h4>
                              <p className="text-xs text-text-secondary">KBZ 123A • Diesel</p>
                           </div>
                        </div>
                        <span className="bg-voltage text-charcoal-900 text-xs font-bold px-2 py-1 rounded">DEFAULT</span>
                     </div>
                  </div>
               </section>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Helper Component for Sidebar Buttons
const NavButton = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-voltage/10 text-voltage' : 'text-text-secondary hover:bg-charcoal-700 hover:text-white'}`}
  >
    <Icon size={18} />
    {label}
  </button>
);

export default Dashboard;