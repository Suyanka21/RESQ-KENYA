// ⚡ ResQ Kenya - Customer Dashboard (2025 Enhanced)
// Phase 2: Animated map, SOS button, skeleton loaders, enhanced transitions

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Pressable, Platform,
    TextInput, ActivityIndicator, Dimensions, Animated, Easing, Image
} from 'react-native';
import { router } from 'expo-router';
import { colors, SERVICE_TYPES, PRICES, shadows, borderRadius, spacing } from '../../theme/voltage-premium';
import { useAuth } from '../../services/AuthContext';
import { createServiceRequest, getUserRequests } from '../../services/firestore.service';
import { NAIROBI_DEFAULT, getCurrentLocation, reverseGeocode, requestLocationPermission } from '../../services/location.service';
import { initiatePaymentDemo, formatAmount, validatePhoneNumber } from '../../services/payment.service';
import { subscribeToProviderLocation, calculateETA, formatETA, formatDistance } from '../../services/realtime.service';
import type { ServiceRequest } from '../../types';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width > 768;

// Types
// Flow: idle → locating → details-input → confirmed → tracking → arrived → serviceComplete → payment → processing → complete
type OrderStage = 'idle' | 'locating' | 'details-input' | 'confirmed' | 'tracking' | 'arrived' | 'serviceComplete' | 'payment' | 'processing' | 'complete';
type ServiceType = 'towing' | 'tire' | 'battery' | 'fuel' | 'diagnostics' | 'ambulance' | null;
type ViewType = 'home' | 'orders' | 'wallet' | 'settings';

// Services
const SERVICES = [
    { id: 'towing', label: 'Flatbed Towing', emoji: '🚛', color: colors.serviceTowing, basePrice: PRICES.TOWING_BASE },
    { id: 'ambulance', label: 'Ambulance', emoji: '🚑', color: colors.serviceAmbulance, basePrice: PRICES.AMBULANCE_BASE, emergency: true },
    { id: 'battery', label: 'Battery Jump', emoji: '⚡', color: colors.serviceBattery, basePrice: PRICES.JUMPSTART_BASE },
    { id: 'fuel', label: 'Fuel Delivery', emoji: '⛽', color: colors.serviceFuel, basePrice: 0 },
    { id: 'tire', label: 'Tire Repair', emoji: '🔧', color: colors.serviceTire, basePrice: PRICES.TIRE_BASE },
    { id: 'diagnostics', label: 'Diagnostics', emoji: '🔍', color: colors.serviceDiagnostics, basePrice: PRICES.DIAGNOSTICS_BASE },
] as const;

// Mock Orders
const MOCK_ORDERS = [
    { id: '#RSQ-2093', date: 'Today, 12:30 PM', loc: 'Westlands', amount: '5,000', status: 'In Progress', type: 'towing' },
    { id: '#RSQ-1029', date: '12 Oct 2023', loc: 'Thika Road Mall', amount: '1,500', status: 'Completed', type: 'battery' },
    { id: '#RSQ-0921', date: '28 Sep 2023', loc: 'Mombasa Road', amount: '3,000', status: 'Completed', type: 'fuel' },
];

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

// Pulsing Animation Component
const PulsingView = ({ children, style, duration = 1500 }: { children: React.ReactNode, style?: any, duration?: number }) => {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.15, duration, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return <Animated.View style={[style, { transform: [{ scale: pulse }] }]}>{children}</Animated.View>;
};

// Fade-In Component
const FadeIn = ({ children, delay = 0, style }: { children: React.ReactNode, delay?: number, style?: any }) => {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
            Animated.timing(slide, { toValue: 0, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]).start();
    }, []);

    return <Animated.View style={[style, { opacity: fade, transform: [{ translateY: slide }] }]}>{children}</Animated.View>;
};

// Skeleton Loader
const Skeleton = ({ width: w, height: h, borderRadius: br = 8 }: { width: number | string, height: number, borderRadius?: number }) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true })
        ).start();
    }, []);

    return (
        <View style={{ width: w as any, height: h, borderRadius: br, backgroundColor: colors.charcoal[700], overflow: 'hidden' }}>
            <Animated.View style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: colors.charcoal[600],
                opacity: shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.6, 0.3] })
            }} />
        </View>
    );
};

// Nav Button
const NavBtn = ({ icon, label, active, onPress }: { icon: string, label: string, active: boolean, onPress: () => void }) => (
    <Pressable style={[styles.navBtn, active && styles.navBtnActive]} onPress={onPress}>
        <Text style={styles.navBtnIcon}>{icon}</Text>
        <Text style={[styles.navBtnLabel, active && styles.navBtnLabelActive]}>{label}</Text>
        {active && <View style={styles.navBtnGlow} />}
    </Pressable>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function CustomerDashboard() {
    // Auth hook for user data
    const { user } = useAuth();

    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stage, setStage] = useState<OrderStage>('idle');
    const [selectedService, setSelectedService] = useState<ServiceType>(null);
    const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
    const [amount, setAmount] = useState('2000');
    const [towDestination, setTowDestination] = useState('');
    const [ambulanceNotes, setAmbulanceNotes] = useState('');
    const [eta, setEta] = useState(15);
    const [toast, setToast] = useState<{ title: string, msg: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Phase 3.5: Interactivity State
    const [walletModal, setWalletModal] = useState<'topup' | 'history' | 'limit' | null>(null);
    const [settingsState, setSettingsState] = useState({ notifications: true, darkMode: true });
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [settingsModal, setSettingsModal] = useState<'addPlace' | 'editProfile' | null>(null);
    const [newPlaceName, setNewPlaceName] = useState('');
    const [newPlaceAddress, setNewPlaceAddress] = useState('');

    // Phase 4: Location State
    const [userLocation, setUserLocation] = useState(NAIROBI_DEFAULT);
    const [userAddress, setUserAddress] = useState('Locating...');

    // Phase 5: Wallet State
    const [topupAmount, setTopupAmount] = useState('500');
    const [walletBalance, setWalletBalance] = useState(4500);
    const [isTopupLoading, setIsTopupLoading] = useState(false);

    const toggleSetting = (key: keyof typeof settingsState) => {
        setSettingsState(prev => ({ ...prev, [key]: !prev[key] }));
        if (Platform.OS === 'web') {
            // Simulate visual feedback for demo
            console.log(`Toggled ${key}: ${!settingsState[key]}`);
        }
    };

    const toggleSection = (section: string) => {
        // LayoutAnimation doesn't work on web, skip it
        if (Platform.OS !== 'web') {
            try {
                const LayoutAnimation = require('react-native').LayoutAnimation;
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            } catch (e) {
                // Ignore if LayoutAnimation is unavailable
            }
        }
        setExpandedSection(prev => prev === section ? null : section);
    };

    const M_PESA_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png";

    // Animation refs for driver movement
    const driverX = useRef(new Animated.Value(0)).current;
    const driverY = useRef(new Animated.Value(0)).current;
    const panelSlide = useRef(new Animated.Value(50)).current;
    const panelFade = useRef(new Animated.Value(0)).current;

    // Simulate loading
    useEffect(() => {
        setTimeout(() => setIsLoading(false), 1200);
    }, []);

    // Fetch user location on mount
    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const hasPermission = await requestLocationPermission();
                if (hasPermission) {
                    const location = await getCurrentLocation();
                    setUserLocation(location);
                    const address = await reverseGeocode(location.latitude, location.longitude);
                    setUserAddress(address);
                    console.log('User location:', location, address);
                } else {
                    setUserAddress('Nairobi, Kenya');
                }
            } catch (error) {
                console.error('Error fetching location:', error);
                setUserAddress('Nairobi, Kenya');
            }
        };
        fetchLocation();
    }, []);

    // ETA countdown + driver animation
    useEffect(() => {
        if (stage === 'tracking') {
            // Reset driver to starting position
            driverX.setValue(0);
            driverY.setValue(0);

            // Calculate dynamic animation targets based on screen dimensions
            // Map is 320px tall
            // User pin: top 45%, left 50% (centered with -20px margin)
            // Driver starts: top 10%, left 10%
            const MAP_HEIGHT = 320;
            const userPinY = MAP_HEIGHT * 0.45;  // ~144px
            const driverStartY = MAP_HEIGHT * 0.10;  // ~32px
            const userPinX = width * 0.50;  // 50% of screen width
            const driverStartX = width * 0.10;  // 10% of screen width

            // Calculate deltas (how much the driver needs to move)
            const deltaX = userPinX - driverStartX;  // Move right to center
            const deltaY = userPinY - driverStartY;  // Move down to user

            // Animate driver toward user pin
            Animated.parallel([
                Animated.timing(driverX, { toValue: deltaX, duration: eta * 2000, useNativeDriver: true, easing: Easing.linear }),
                Animated.timing(driverY, { toValue: deltaY, duration: eta * 2000, useNativeDriver: true, easing: Easing.linear }),
            ]).start();

            const interval = setInterval(() => {
                setEta((prev) => {
                    if (prev <= 1) {
                        showToast('🚛 Unit Arrived', 'ResQ unit has arrived! Service will begin shortly.');
                        setStage('arrived');
                        return 0;
                    }
                    if (prev === 10) showToast('🚚 Unit Dispatched', 'ResQ Unit is en route via Waiyaki Way');
                    if (prev === 5) showToast('📍 Almost There', 'Unit is 5 minutes away');
                    return prev - 1;
                });
            }, 2000);
            return () => clearInterval(interval);
        } else {
            setEta(15);
            driverX.setValue(0);
            driverY.setValue(0);
        }
    }, [stage]);

    // Panel animation on stage change
    useEffect(() => {
        panelSlide.setValue(50);
        panelFade.setValue(0);
        Animated.parallel([
            Animated.spring(panelSlide, { toValue: 0, useNativeDriver: true, friction: 8 }),
            Animated.timing(panelFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [stage]);

    const showToast = (title: string, msg: string) => {
        setToast({ title, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const handleServiceSelect = (id: ServiceType) => {
        setSelectedService(id);
        setStage('locating');
        setTimeout(() => setStage('details-input'), 1800);
    };

    const handlePayment = async () => {
        setStage('processing');

        try {
            // Create service request data for Firestore
            const requestData = {
                userId: user?.id || 'demo-user',
                serviceType: selectedService || 'towing',
                status: 'searching' as const,
                location: {
                    latitude: NAIROBI_DEFAULT.latitude,
                    longitude: NAIROBI_DEFAULT.longitude,
                    address: 'Westlands, Nairobi (Demo)',
                },
                price: calculateTotal(),
                paymentStatus: 'pending' as const,
                createdAt: new Date(),
                ...(selectedService === 'towing' && towDestination ? {
                    destination: { latitude: -1.30, longitude: 36.82, address: towDestination }
                } : {}),
                ...(selectedService === 'fuel' ? { fuelType, fuelAmount: parseFloat(amount) } : {}),
            };

            console.log('Creating service request:', requestData);

            // Initiate M-Pesa payment (demo mode)
            const paymentResult = await initiatePaymentDemo({
                requestId: `RSQ-${Date.now()}`,
                amount: calculateTotal(),
                phoneNumber: user?.phoneNumber || '254700000001',
                description: `ResQ ${getServiceLabel()} Service`,
            });

            if (paymentResult.success) {
                showToast('✅ Payment Complete', `${formatAmount(calculateTotal())} paid via M-Pesa. Thank you!`);
                setStage('complete');
                // Production: await createServiceRequest(requestData as any);
            } else {
                showToast('❌ Payment Failed', paymentResult.error || 'Please try again');
                setStage('payment');
            }
        } catch (error) {
            console.error('Failed to create service request:', error);
            showToast('❌ Error', 'Failed to process request. Please try again.');
            setStage('payment');
        }
    };

    const handleReset = () => {
        setStage('idle');
        setSelectedService(null);
        setAmount('2000');
        setTowDestination('');
    };

    // Handle Wallet Top-Up via M-Pesa STK Push
    const handleTopUp = async () => {
        const topupVal = parseFloat(topupAmount);
        if (isNaN(topupVal) || topupVal < 50) {
            showToast('❌ Invalid Amount', 'Minimum top-up is KES 50');
            return;
        }

        setIsTopupLoading(true);
        try {
            const result = await initiatePaymentDemo({
                requestId: `TOPUP-${Date.now()}`,
                amount: topupVal,
                phoneNumber: user?.phoneNumber || '254700000001',
                description: 'ResQ Wallet Top-Up',
            });

            if (result.success) {
                setWalletBalance(prev => prev + topupVal);
                showToast('✅ Top Up Successful', `${formatAmount(topupVal)} added to wallet`);
                setWalletModal(null);
                setTopupAmount('500');
            } else {
                showToast('❌ Top Up Failed', result.error || 'Please try again');
            }
        } catch (error) {
            console.error('Top-up failed:', error);
            showToast('❌ Error', 'Failed to process top-up');
        } finally {
            setIsTopupLoading(false);
        }
    };

    const calculateFuelLiters = () => {
        const val = parseFloat(amount);
        if (!val) return '0.00';
        return (val / (fuelType === 'petrol' ? PRICES.FUEL_PETROL : PRICES.FUEL_DIESEL)).toFixed(2);
    };

    const calculateTotal = () => {
        if (selectedService === 'fuel') return (parseFloat(amount) || 0) + 200;
        return SERVICES.find(s => s.id === selectedService)?.basePrice || 0;
    };

    const isFormValid = () => {
        if (selectedService === 'fuel') return parseFloat(amount) > 0;
        if (selectedService === 'towing') return towDestination.length > 3;
        return true;
    };

    const getServiceLabel = () => SERVICES.find(s => s.id === selectedService)?.label || '';
    const getServiceEmoji = (id: string) => SERVICES.find(s => s.id === id)?.emoji || '🔧';
    const getServiceColor = (id: string) => SERVICES.find(s => s.id === id)?.color || colors.voltage;

    // ============================================================================
    // RENDER SIDEBAR
    // ============================================================================
    const renderSidebar = () => (
        <View style={[styles.sidebar, (!isLargeScreen && !sidebarOpen) && styles.sidebarHidden]}>
            <View style={styles.sidebarHeader}>
                <View style={styles.sidebarLogo}>
                    <View style={styles.logoIcon}><Text>⚡</Text></View>
                    <Text style={styles.logoText}>Res<Text style={styles.logoAccent}>Q</Text></Text>
                </View>
                {!isLargeScreen && (
                    <Pressable onPress={() => setSidebarOpen(false)}><Text style={styles.closeBtn}>✕</Text></Pressable>
                )}
            </View>

            <ScrollView style={styles.sidebarScroll} contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
                <Pressable style={styles.userCard}>
                    <View style={styles.userAvatar}><Text style={styles.userAvatarText}>JW</Text></View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>Joseph Wainaina</Text>
                        <Text style={styles.userLoc}>📍 Muthaiga, Nairobi</Text>
                    </View>
                </Pressable>

                <View style={styles.navList}>
                    <NavBtn icon="🗺️" label="Rescue Map" active={currentView === 'home'} onPress={() => { setCurrentView('home'); setSidebarOpen(false); }} />
                    <NavBtn icon="📜" label="History" active={currentView === 'orders'} onPress={() => { setCurrentView('orders'); setSidebarOpen(false); }} />
                    <NavBtn icon="💳" label="Wallet" active={currentView === 'wallet'} onPress={() => { setCurrentView('wallet'); setSidebarOpen(false); }} />
                    <NavBtn icon="⚙️" label="Settings" active={currentView === 'settings'} onPress={() => { setCurrentView('settings'); setSidebarOpen(false); }} />
                </View>

                <Pressable style={styles.logoutBtn} onPress={() => router.replace('/')}>
                    <Text style={styles.logoutIcon}>🚪</Text><Text style={styles.logoutText}>Logout</Text>
                </Pressable>

                <View style={styles.memberBadge}>
                    <Text style={styles.memberIcon}>🛡️</Text>
                    <Text style={styles.memberLabel}>RESQ GOLD</Text>
                    <Text style={styles.memberExp}>Active until Dec 2025</Text>
                </View>
            </ScrollView>
        </View>
    );

    // ============================================================================
    // RENDER HOME VIEW
    // ============================================================================
    const renderHomeView = () => (
        <ScrollView style={styles.homeViewScroll} contentContainerStyle={styles.homeViewContent} showsVerticalScrollIndicator={false}>
            {/* Animated Map Background */}
            <View style={styles.mapBg}>
                <View style={styles.mapRoad1} />
                <View style={styles.mapRoad2} />
                <View style={styles.mapRoad3} />

                {/* User Location Pin with Pulse */}
                <View style={styles.userPinWrap}>
                    <PulsingView style={styles.userPinPulse} duration={2000}><View /></PulsingView>
                    <View style={styles.userPinDot} />
                </View>

                {/* Driver Pin (when tracking) */}
                {stage === 'tracking' && (
                    <Animated.View
                        style={[
                            styles.driverPinWrap,
                            { transform: [{ translateX: driverX }, { translateY: driverY }] }
                        ]}
                    >
                        <View style={styles.driverPinLabel}><Text style={styles.driverPinLabelText}>ResQ Unit</Text></View>
                        <View style={styles.driverPinIcon}>
                            <Text style={{ fontSize: 18, transform: [{ scaleX: -1 }] }}>🚛</Text>
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Action Panel */}
            <Animated.View style={[styles.actionPanel, { opacity: panelFade, transform: [{ translateY: panelSlide }] }]}>

                {/* IDLE - Service Selection */}
                {stage === 'idle' && (
                    <View style={styles.panel}>
                        <View style={styles.panelHeader}>
                            <Text style={styles.panelTitle}>Select Service</Text>
                            <View style={styles.vehicleBadge}><Text style={styles.vehicleBadgeText}>🚗 Toyota Prado</Text></View>
                        </View>

                        {/* SOS Emergency Button */}
                        <PulsingView style={styles.sosContainer} duration={1200}>
                            <Pressable
                                style={({ pressed }) => [styles.sosBtn, pressed && styles.sosBtnPressed]}
                                onPress={() => handleServiceSelect('ambulance')}
                            >
                                <Text style={styles.sosIcon}>🚨</Text>
                                <View>
                                    <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
                                    <Text style={styles.sosSubtitle}>Tap for immediate ambulance</Text>
                                </View>
                            </Pressable>
                        </PulsingView>

                        {/* Service Grid */}
                        {isLoading ? (
                            <View style={styles.serviceGrid}>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <View key={i} style={styles.serviceCardSkeleton}>
                                        <Skeleton width={44} height={44} borderRadius={14} />
                                        <Skeleton width="80%" height={12} borderRadius={4} />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.serviceGrid}>
                                {SERVICES.filter(s => s.id !== 'ambulance').map((s, i) => (
                                    <FadeIn key={s.id} delay={i * 80}>
                                        <Pressable
                                            style={({ pressed, hovered }: any) => [
                                                styles.serviceCard,
                                                pressed && styles.serviceCardPressed,
                                                hovered && styles.serviceCardHover
                                            ]}
                                            onPress={() => handleServiceSelect(s.id as ServiceType)}
                                        >
                                            <View style={[styles.serviceIcon, { backgroundColor: `${s.color}20` }]}>
                                                <Text style={styles.serviceEmoji}>{s.emoji}</Text>
                                            </View>
                                            <Text style={styles.serviceLabel}>{s.label}</Text>
                                            <Text style={styles.servicePrice}>
                                                {s.basePrice > 0 ? `KES ${s.basePrice.toLocaleString()}` : 'Variable'}
                                            </Text>
                                        </Pressable>
                                    </FadeIn>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* LOCATING */}
                {stage === 'locating' && (
                    <View style={[styles.panel, styles.panelCenter]}>
                        <View style={styles.locatingRing}>
                            <PulsingView duration={800}><View style={styles.locatingRingInner} /></PulsingView>
                        </View>
                        <Text style={styles.locatingTitle}>Finding nearest unit...</Text>
                        <Text style={styles.locatingSub}>Checking verified providers in Nairobi</Text>
                        <View style={styles.progressBar}>
                            <Animated.View style={styles.progressFill} />
                        </View>
                    </View>
                )}

                {/* DETAILS INPUT */}
                {stage === 'details-input' && (
                    <View style={styles.panel}>
                        <View style={styles.panelRow}>
                            <Pressable onPress={handleReset}><Text style={styles.backBtn}>←</Text></Pressable>
                            <Text style={styles.panelTitle}>{getServiceLabel()} Details</Text>
                        </View>

                        {selectedService === 'fuel' && (
                            <View style={styles.formGroup}>
                                <View style={styles.fuelRow}>
                                    {['petrol', 'diesel'].map(t => (
                                        <Pressable key={t} style={[styles.fuelTypeBtn, fuelType === t && styles.fuelTypeBtnActive]} onPress={() => setFuelType(t as any)}>
                                            <Text style={[styles.fuelTypeText, fuelType === t && styles.fuelTypeTextActive]}>{t === 'petrol' ? 'Petrol' : 'Diesel'}</Text>
                                            <Text style={styles.fuelPrice}>KES {t === 'petrol' ? PRICES.FUEL_PETROL : PRICES.FUEL_DIESEL}/L</Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <Text style={styles.inputLabel}>Amount (KES)</Text>
                                <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor={colors.text.muted} />
                                <Text style={styles.litersText}>≈ {calculateFuelLiters()} Liters</Text>
                            </View>
                        )}

                        {selectedService === 'towing' && (
                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Destination (Garage/Home)</Text>
                                <TextInput style={styles.textInput} value={towDestination} onChangeText={setTowDestination} placeholder="e.g. Toyota Kenya, Mombasa Rd" placeholderTextColor={colors.text.muted} />
                                <View style={styles.priceBox}>
                                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Base Fee</Text><Text style={styles.priceValue}>KES {PRICES.TOWING_BASE.toLocaleString()}</Text></View>
                                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Per KM</Text><Text style={styles.priceValue}>KES 200</Text></View>
                                </View>
                            </View>
                        )}

                        {selectedService === 'ambulance' && (
                            <View style={styles.formGroup}>
                                <View style={styles.emergencyAlert}>
                                    <Text style={styles.emergencyAlertText}>🚨 For critical emergencies, call 999 directly</Text>
                                </View>
                                <Text style={styles.inputLabel}>Nature of Emergency (Optional)</Text>
                                <TextInput style={[styles.textInput, styles.textArea]} value={ambulanceNotes} onChangeText={setAmbulanceNotes} placeholder="e.g. Chest pains, accident..." placeholderTextColor={colors.text.muted} multiline />
                            </View>
                        )}

                        {(selectedService === 'battery' || selectedService === 'tire' || selectedService === 'diagnostics') && (
                            <View style={styles.formGroup}>
                                <View style={styles.priceBox}>
                                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Service Fee</Text><Text style={styles.priceValue}>KES {calculateTotal().toLocaleString()}</Text></View>
                                </View>
                            </View>
                        )}

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Estimated Total</Text>
                            <Text style={styles.totalValue}>KES {calculateTotal().toLocaleString()}</Text>
                        </View>
                        <Text style={styles.mpesaNote}>💳 Payment after service completion</Text>
                        <Pressable style={[styles.primaryBtn, !isFormValid() && styles.btnDisabled]} onPress={() => isFormValid() && setStage('confirmed')} disabled={!isFormValid()}>
                            <Text style={styles.primaryBtnText}>{selectedService === 'ambulance' ? '🚑 Request Ambulance' : '✓ Confirm Request'}</Text>
                        </Pressable>
                    </View>
                )}

                {/* CONFIRMED - Request confirmed, finding provider */}
                {stage === 'confirmed' && (
                    <View style={[styles.panel, styles.panelCenter]}>
                        <PulsingView style={styles.locatingRing}><View style={styles.locatingRingInner} /></PulsingView>
                        <Text style={styles.processingTitle}>Request Confirmed! ✓</Text>
                        <Text style={styles.processingSub}>Finding nearest ResQ unit...</Text>
                        <View style={styles.progressBar}><View style={styles.progressFill} /></View>
                        <Pressable style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => setStage('tracking')}>
                            <Text style={styles.primaryBtnText}>🚛 Provider Found - Track Now</Text>
                        </Pressable>
                    </View>
                )}

                {/* TRACKING - Driver on the way */}
                {stage === 'tracking' && (
                    <View style={styles.trackingPanel}>
                        <View style={styles.trackingHeader}>
                            <View style={styles.etaBox}>
                                <Text style={styles.etaIcon}>⏱️</Text>
                                <Text style={styles.etaText}>ARRIVING IN {eta} MINS</Text>
                            </View>
                            <View style={styles.onTimeBadge}><Text style={styles.onTimeBadgeText}>ON TIME</Text></View>
                        </View>
                        <View style={styles.etaProgress}>
                            <View style={[styles.etaProgressFill, { width: `${((15 - eta) / 15) * 100}%` }]} />
                        </View>
                        <View style={styles.driverCard}>
                            <View style={styles.driverAvatar}><Text style={styles.driverAvatarIcon}>🚛</Text></View>
                            <View style={styles.driverInfo}>
                                <Text style={styles.driverName}>ResQ Unit #402</Text>
                                <Text style={styles.driverVehicle}>Isuzu FRR • KDA 892C</Text>
                            </View>
                            <Pressable style={styles.callBtn}><Text style={styles.callBtnIcon}>📞</Text></Pressable>
                        </View>
                    </View>
                )}

                {/* ARRIVED - Service in progress */}
                {stage === 'arrived' && (
                    <View style={styles.panel}>
                        <View style={styles.panelCenter}>
                            <View style={[styles.successIcon, { backgroundColor: `${colors.voltage}20` }]}>
                                <Text style={{ fontSize: 36 }}>🔧</Text>
                            </View>
                            <Text style={styles.processingTitle}>Service In Progress</Text>
                            <Text style={styles.processingSub}>ResQ Unit #402 is working on your vehicle</Text>
                        </View>
                        <View style={styles.driverCard}>
                            <View style={styles.driverAvatar}><Text style={styles.driverAvatarIcon}>🚛</Text></View>
                            <View style={styles.driverInfo}>
                                <Text style={styles.driverName}>ResQ Unit #402</Text>
                                <Text style={styles.driverVehicle}>KDA 892C • On Site</Text>
                            </View>
                            <Pressable style={styles.callBtn}><Text style={styles.callBtnIcon}>📞</Text></Pressable>
                        </View>
                        <Pressable style={[styles.primaryBtn, { marginTop: 20 }]} onPress={() => setStage('serviceComplete')}>
                            <Text style={styles.primaryBtnText}>✅ Service Complete - Proceed to Rate</Text>
                        </Pressable>
                    </View>
                )}

                {/* SERVICE COMPLETE - User confirms satisfaction */}
                {stage === 'serviceComplete' && (
                    <View style={styles.panel}>
                        <View style={styles.panelHeader}>
                            <Text style={styles.panelTitle}>Rate Your Service</Text>
                        </View>
                        <View style={styles.panelCenter}>
                            <Text style={{ fontSize: 48, marginBottom: 10 }}>⭐⭐⭐⭐⭐</Text>
                            <Text style={styles.processingSub}>How was your ResQ experience?</Text>
                        </View>
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service</Text><Text style={styles.summaryValue}>{getServiceLabel()}</Text></View>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Provider</Text><Text style={styles.summaryValue}>Unit #402</Text></View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Amount Due</Text><Text style={styles.summaryTotalValue}>KES {calculateTotal().toLocaleString()}</Text></View>
                        </View>
                        <Pressable style={styles.mpesaPayBtn} onPress={() => setStage('payment')}>
                            <Text style={styles.mpesaPayBtnText}>✓ Confirm & Proceed to Pay</Text>
                        </Pressable>
                    </View>
                )}

                {/* PAYMENT - Pay via M-Pesa (moved to after service) */}
                {stage === 'payment' && (
                    <View style={styles.panel}>
                        <View style={styles.panelRow}><Pressable onPress={() => setStage('serviceComplete')}><Text style={styles.backBtn}>←</Text></Pressable><Text style={styles.panelTitle}>Pay Now</Text></View>

                        {/* Order Summary */}
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service</Text><Text style={styles.summaryValue}>{getServiceLabel()}</Text></View>
                            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Location</Text><Text style={styles.summaryValue}>{userAddress}</Text></View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryRow}><Text style={styles.summaryTotalLabel}>Total</Text><Text style={styles.summaryTotalValue}>KES {calculateTotal().toLocaleString()}</Text></View>
                        </View>

                        {/* M-Pesa Payment Section */}
                        <View style={styles.mpesaSection}>
                            <View style={styles.mpesaHeader}>
                                <Image
                                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/512px-M-PESA_LOGO-01.svg.png' }}
                                    style={styles.mpesaLogo}
                                    resizeMode="contain"
                                />
                                <Text style={styles.lipaNaMpesaText}>Lipa na M-Pesa</Text>
                            </View>

                            {/* Till Number / Paybill Info */}
                            <View style={styles.tillBox}>
                                <Text style={styles.tillLabel}>Buy Goods Till Number</Text>
                                <Text style={styles.tillNumber}>123456</Text>
                                <Text style={styles.tillName}>ResQ Kenya Ltd</Text>
                            </View>

                            <Text style={styles.mpesaNote}>
                                You will receive an STK push on your phone. Enter your M-Pesa PIN to complete payment.
                            </Text>
                        </View>

                        {/* Pay Button */}
                        <Pressable style={styles.mpesaPayBtn} onPress={handlePayment}>
                            <Image
                                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/512px-M-PESA_LOGO-01.svg.png' }}
                                style={styles.mpesaBtnLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.mpesaPayBtnText}>Pay KES {calculateTotal().toLocaleString()}</Text>
                        </Pressable>
                    </View>
                )}

                {/* PROCESSING */}
                {stage === 'processing' && (
                    <View style={[styles.panel, styles.panelCenter]}>
                        <PulsingView style={styles.phoneIconWrap}><Text style={styles.phoneIcon}>📱</Text></PulsingView>
                        <Text style={styles.processingTitle}>Check your phone</Text>
                        <Text style={styles.processingSub}>Enter M-Pesa PIN to complete</Text>
                    </View>
                )}

                {/* COMPLETE */}
                {stage === 'complete' && (
                    <View style={[styles.panel, styles.panelCenter]}>
                        <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
                        <Text style={styles.completeTitle}>Rescue Complete!</Text>
                        <Text style={styles.completeSub}>Service fulfilled. Stay safe on the road.</Text>
                        <Pressable style={styles.primaryBtn} onPress={handleReset}><Text style={styles.primaryBtnText}>Back to Home</Text></Pressable>
                    </View>
                )}
            </Animated.View>
        </ScrollView>
    );

    // ============================================================================
    // RENDER ORDERS VIEW
    // ============================================================================
    // ============================================================================
    // RENDER ORDERS VIEW (Enhanced)
    // ============================================================================
    const renderOrdersView = () => (
        <ScrollView style={styles.viewScroll} contentContainerStyle={styles.viewContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.viewTitle}>📜 Rescue History</Text>
            <Text style={styles.viewSubtitle}>Your recent emergency requests</Text>

            <View style={styles.timelineContainer}>
                {/* Vertical Timeline Line */}
                <View style={styles.timelineLine} />

                {MOCK_ORDERS.map((o, i) => (
                    <FadeIn key={i} delay={i * 100} style={styles.timelineItem}>
                        <View style={styles.timelineDotWrap}>
                            <View style={[styles.timelineDot, o.status === 'Completed' ? styles.dotComplete : styles.dotProgress]} />
                        </View>

                        <View style={styles.orderCardEnhanced}>
                            <View style={styles.orderHeader}>
                                <View style={[styles.serviceIconSmall, { backgroundColor: `${getServiceColor(o.type)}20` }]}>
                                    <Text>{getServiceEmoji(o.type)}</Text>
                                </View>
                                <View style={styles.orderHeaderText}>
                                    <Text style={styles.orderId}>{o.id}</Text>
                                    <View style={[styles.statusPill, o.status === 'Completed' ? styles.statusPillComplete : styles.statusPillProgress]}>
                                        <Text style={[styles.statusPillText, o.status === 'Completed' ? styles.statusTextComplete : styles.statusTextProgress]}>
                                            {o.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.orderBody}>
                                <View style={styles.orderRow}>
                                    <Text style={styles.orderLabel}>Location</Text>
                                    <Text style={styles.orderValue}>{o.loc}</Text>
                                </View>
                                <View style={styles.orderRow}>
                                    <Text style={styles.orderLabel}>Date</Text>
                                    <Text style={styles.orderValue}>{o.date}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.orderFooter}>
                                    <Text style={styles.orderAmountLabel}>Total Paid</Text>
                                    <Text style={styles.orderAmountValue}>KES {o.amount}</Text>
                                </View>
                            </View>
                        </View>
                    </FadeIn>
                ))}
            </View>
        </ScrollView>
    );

    // ============================================================================
    // RENDER WALLET VIEW (Enhanced)
    // ============================================================================
    const renderWalletView = () => (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.viewScroll} contentContainerStyle={styles.viewContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.viewTitle}>💳 Wallet</Text>

                {/* Premium Gradient Card */}
                <FadeIn style={styles.walletCardGradient}>
                    <View style={styles.walletCardBg} />
                    <View style={styles.walletCardContent}>
                        <View style={styles.walletHeader}>
                            <Text style={styles.walletLabel}>Available Balance</Text>
                            <View style={styles.walletChip}><Text style={styles.walletChipText}>KES</Text></View>
                        </View>
                        <Text style={styles.walletBalance}>{walletBalance.toLocaleString()}<Text style={styles.walletBalanceDecimal}>.00</Text></Text>
                        <View style={styles.walletFooter}>
                            <Text style={styles.walletUser}>Joseph Wainaina</Text>
                            <Text style={styles.walletExp}>**** 892</Text>
                        </View>
                    </View>
                </FadeIn>

                <View style={styles.actionGrid}>
                    <Pressable style={styles.actionBtn} onPress={() => setWalletModal('topup')}>
                        <View style={[styles.actionIcon, { backgroundColor: `${colors.success}20` }]}><Text>➕</Text></View>
                        <Text style={styles.actionLabel}>Top Up</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => setWalletModal('history')}>
                        <View style={[styles.actionIcon, { backgroundColor: `${colors.voltage}20` }]}><Text>📜</Text></View>
                        <Text style={styles.actionLabel}>History</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => setWalletModal('limit')}>
                        <View style={[styles.actionIcon, { backgroundColor: `${colors.info}20` }]}><Text>📊</Text></View>
                        <Text style={styles.actionLabel}>Limit</Text>
                    </Pressable>
                </View>

                <Text style={styles.sectionLabel}>Payment Methods</Text>
                <FadeIn delay={100} style={styles.methodCardEnhanced}>
                    <View style={[styles.methodIcon, { backgroundColor: '#fff', padding: 2, overflow: 'hidden' }]}>
                        <Image source={{ uri: M_PESA_LOGO }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    </View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>M-Pesa</Text>
                        <Text style={styles.methodSub}>Default • 07** *** 892</Text>
                    </View>
                    <View style={styles.radioChosen}>
                        <View style={styles.radioInner} />
                    </View>
                </FadeIn>

                <FadeIn delay={200} style={styles.methodCardEnhanced}>
                    <View style={[styles.methodIcon, { backgroundColor: '#1a1a1a' }]}><Text style={styles.methodEmoji}>💳</Text></View>
                    <View style={styles.methodInfo}>
                        <Text style={styles.methodTitle}>Visa •• 4242</Text>
                        <Text style={styles.methodSub}>Expires 12/26</Text>
                    </View>
                    <View style={styles.radioUnchosen} />
                </FadeIn>
            </ScrollView>

            {/* Wallet Action Modal Overlay */}
            {walletModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {walletModal === 'topup' ? '📲 Top Up via M-Pesa' : walletModal === 'limit' ? 'Set Spend Limit' : 'Transaction History'}
                        </Text>

                        {walletModal === 'topup' && (
                            <View>
                                {/* M-Pesa Header */}
                                <View style={styles.mpesaHeader}>
                                    <Image
                                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/512px-M-PESA_LOGO-01.svg.png' }}
                                        style={styles.mpesaLogo}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.lipaNaMpesaText}>Lipa na M-Pesa</Text>
                                </View>

                                {/* Phone Number Display */}
                                <View style={styles.tillBox}>
                                    <Text style={styles.tillLabel}>STK Push will be sent to</Text>
                                    <Text style={styles.tillNumber}>{user?.phoneNumber || '0700***001'}</Text>
                                </View>

                                {/* Amount Input */}
                                <Text style={styles.inputLabel}>Enter Amount (KES)</Text>
                                <TextInput
                                    style={[styles.amountInput, { marginBottom: 10 }]}
                                    value={topupAmount}
                                    onChangeText={setTopupAmount}
                                    keyboardType="numeric"
                                    placeholder="500"
                                    placeholderTextColor={colors.text.muted}
                                />
                                <Text style={styles.mpesaNote}>Minimum top-up: KES 50</Text>
                            </View>
                        )}

                        {walletModal === 'history' && (
                            <View style={{ height: 100, width: '100%', backgroundColor: colors.charcoal[900], borderRadius: 8, marginBottom: 20, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: colors.text.secondary }}>No recent transactions found</Text>
                            </View>
                        )}

                        {walletModal === 'limit' && (
                            <Text style={styles.modalText}>Configure your monthly spending limits.</Text>
                        )}

                        {/* Action Buttons */}
                        {walletModal === 'topup' ? (
                            <Pressable
                                style={[styles.mpesaPayBtn, isTopupLoading && styles.btnDisabled]}
                                onPress={handleTopUp}
                                disabled={isTopupLoading}
                            >
                                {isTopupLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Image
                                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/512px-M-PESA_LOGO-01.svg.png' }}
                                            style={styles.mpesaBtnLogo}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.mpesaPayBtnText}>Top Up KES {topupAmount || '0'}</Text>
                                    </>
                                )}
                            </Pressable>
                        ) : (
                            <Pressable style={styles.primaryBtn} onPress={() => setWalletModal(null)}>
                                <Text style={styles.primaryBtnText}>{walletModal === 'history' ? 'Close' : 'Save'}</Text>
                            </Pressable>
                        )}

                        <Pressable style={[styles.btnSecondary, { marginTop: 10, alignItems: 'center' }]} onPress={() => setWalletModal(null)}>
                            <Text style={{ color: colors.text.secondary }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );


    // ============================================================================
    // RENDER SETTINGS VIEW (Enhanced)
    // ============================================================================
    const renderSettingsView = () => (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.viewScroll} contentContainerStyle={styles.viewContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.viewTitle}>⚙️ Settings</Text>

                <FadeIn style={styles.profileHeaderCard}>
                    <View style={styles.profileHeaderBg} />
                    <View style={styles.profileHeaderContent}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarLargeText}>JW</Text>
                            <Pressable style={styles.editAvatarBtn} onPress={() => setSettingsModal('editProfile')}><Text style={styles.editAvatarIcon}>✏️</Text></Pressable>
                        </View>
                        <Text style={styles.profileNameLarge}>Joseph Wainaina</Text>
                        <Text style={styles.profileMembership}>RESQ GOLD MEMBER</Text>
                    </View>
                </FadeIn>

                <View style={styles.settingsGroup}>
                    <Text style={styles.groupTitle}>ACCOUNT</Text>
                    <View style={styles.groupContainer}>
                        <Pressable style={styles.settingRow} onPress={() => toggleSection('personal')}>
                            <View style={styles.settingIcon}><Text>👤</Text></View>
                            <Text style={styles.settingLabel}>Personal Info</Text>
                            <Text style={[styles.settingArrow, expandedSection === 'personal' && { transform: [{ rotate: '90deg' }] }]}>›</Text>
                        </Pressable>
                        {expandedSection === 'personal' && (
                            <FadeIn style={{ padding: 15, backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderColor: colors.charcoal[700] }}>
                                <View style={{ marginBottom: 10 }}><Text style={{ color: colors.text.secondary, fontSize: 12 }}>Full Name</Text><Text style={{ color: colors.text.primary }}>Joseph Wainaina</Text></View>
                                <View style={{ marginBottom: 10 }}><Text style={{ color: colors.text.secondary, fontSize: 12 }}>Email</Text><Text style={{ color: colors.text.primary }}>joseph@example.com</Text></View>
                                <View><Text style={{ color: colors.text.secondary, fontSize: 12 }}>Phone</Text><Text style={{ color: colors.text.primary }}>+254 7** *** 892</Text></View>
                            </FadeIn>
                        )}

                        <View style={styles.settingDivider} />

                        <Pressable style={styles.settingRow} onPress={() => toggleSection('vehicles')}>
                            <View style={styles.settingIcon}><Text>🚗</Text></View>
                            <Text style={styles.settingLabel}>Saved Vehicles</Text>
                            <Text style={[styles.settingArrow, expandedSection === 'vehicles' && { transform: [{ rotate: '90deg' }] }]}>›</Text>
                        </Pressable>
                        {expandedSection === 'vehicles' && (
                            <FadeIn style={{ padding: 10, backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderColor: colors.charcoal[700] }}>
                                <View style={styles.vehicleCard}>
                                    <View style={styles.vehicleIconWrap}><Text>🚙</Text></View>
                                    <View style={styles.vehicleInfo}>
                                        <Text style={styles.vehicleTitle}>Toyota Prado</Text>
                                        <Text style={styles.vehicleSub}>KCD 123X • Silver</Text>
                                    </View>
                                    <View style={styles.defaultVehicleBadge}><Text style={styles.defaultVehicleText}>Default</Text></View>
                                </View>
                            </FadeIn>
                        )}

                        <View style={styles.settingDivider} />
                        <Pressable style={styles.settingRow} onPress={() => toggleSection('places')}>
                            <View style={styles.settingIcon}><Text>📍</Text></View>
                            <Text style={styles.settingLabel}>Saved Places</Text>
                            <Text style={[styles.settingArrow, expandedSection === 'places' && { transform: [{ rotate: '90deg' }] }]}>›</Text>
                        </Pressable>
                        {expandedSection === 'places' && (
                            <FadeIn style={{ padding: 15, backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderColor: colors.charcoal[700] }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `${colors.voltage}20`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                        <Text>🏠</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Home</Text>
                                        <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Muthaiga, Nairobi</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `${colors.info}20`, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                        <Text>🏢</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.text.primary, fontWeight: '600' }}>Work</Text>
                                        <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Westlands, Nairobi</Text>
                                    </View>
                                </View>
                                <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8 }} onPress={() => setSettingsModal('addPlace')}>
                                    <Text style={{ color: colors.voltage, fontWeight: '600' }}>+ Add New Place</Text>
                                </Pressable>
                            </FadeIn>
                        )}
                    </View>
                </View>

                <View style={styles.settingsGroup}>
                    <Text style={styles.groupTitle}>PREFERENCES</Text>
                    <View style={styles.groupContainer}>
                        <Pressable style={styles.settingRow} onPress={() => toggleSetting('notifications')}>
                            <View style={styles.settingIcon}><Text>🔔</Text></View>
                            <Text style={styles.settingLabel}>Notifications</Text>
                            <View style={[styles.toggleActive, !settingsState.notifications && { backgroundColor: colors.charcoal[600], alignItems: 'flex-start' }]}>
                                <View style={styles.toggleKnobActive} />
                            </View>
                        </Pressable>
                        <View style={styles.settingDivider} />
                        <Pressable style={styles.settingRow} onPress={() => toggleSetting('darkMode')}>
                            <View style={styles.settingIcon}><Text>🌙</Text></View>
                            <Text style={styles.settingLabel}>Dark Mode</Text>
                            <View style={[styles.toggleActive, !settingsState.darkMode && { backgroundColor: colors.charcoal[600], alignItems: 'flex-start' }]}>
                                <View style={styles.toggleKnobActive} />
                            </View>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.settingsGroup}>
                    <Text style={styles.groupTitle}>SUPPORT</Text>
                    <View style={styles.groupContainer}>
                        <Pressable style={styles.settingRow} onPress={() => router.push('/(customer)/help')}>
                            <View style={styles.settingIcon}><Text>❓</Text></View>
                            <Text style={styles.settingLabel}>Help Center</Text>
                            <Text style={styles.settingArrow}>›</Text>
                        </Pressable>
                        <View style={styles.settingDivider} />
                        <Pressable style={styles.settingRow} onPress={() => router.push('/(customer)/terms')}>
                            <View style={styles.settingIcon}><Text>📄</Text></View>
                            <Text style={styles.settingLabel}>Terms & Privacy</Text>
                            <Text style={styles.settingArrow}>›</Text>
                        </Pressable>
                        <View style={styles.settingDivider} />
                        <Pressable style={styles.logoutBtn} onPress={() => showToast('Logged Out', 'You have been logged out')}>
                            <Text style={styles.logoutIcon}>🚪</Text>
                            <Text style={styles.logoutText}>Log Out</Text>
                        </Pressable>
                    </View>
                </View>

                <Text style={styles.appVersion}>ResQ v2.0.5 (Build 2025)</Text>
            </ScrollView>

            {/* Settings Modal Overlay */}
            {
                settingsModal && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            {settingsModal === 'addPlace' && (
                                <>
                                    <Text style={styles.modalTitle}>📍 Add New Place</Text>
                                    <TextInput
                                        style={[styles.amountInput, { marginBottom: 12, fontSize: 16, textAlign: 'left' }]}
                                        placeholder="Place Name (e.g., Gym)"
                                        placeholderTextColor={colors.text.secondary}
                                        value={newPlaceName}
                                        onChangeText={setNewPlaceName}
                                    />
                                    <TextInput
                                        style={[styles.amountInput, { marginBottom: 20, fontSize: 16, textAlign: 'left' }]}
                                        placeholder="Address"
                                        placeholderTextColor={colors.text.secondary}
                                        value={newPlaceAddress}
                                        onChangeText={setNewPlaceAddress}
                                    />
                                    <Pressable style={styles.primaryBtn} onPress={() => {
                                        if (newPlaceName && newPlaceAddress) {
                                            showToast('Success', `"${newPlaceName}" saved to your places`);
                                            setNewPlaceName('');
                                            setNewPlaceAddress('');
                                        }
                                        setSettingsModal(null);
                                    }}>
                                        <Text style={styles.primaryBtnText}>Save Place</Text>
                                    </Pressable>
                                </>
                            )}
                            {settingsModal === 'editProfile' && (
                                <>
                                    <Text style={styles.modalTitle}>✏️ Edit Profile</Text>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                        <Text style={{ fontSize: 32 }}>JW</Text>
                                    </View>
                                    <Pressable style={[styles.primaryBtn, { backgroundColor: colors.charcoal[700], marginBottom: 12 }]} onPress={() => showToast('Camera', 'Camera access coming soon')}>
                                        <Text style={[styles.primaryBtnText, { color: colors.text.primary }]}>📷 Take Photo</Text>
                                    </Pressable>
                                    <Pressable style={[styles.primaryBtn, { backgroundColor: colors.charcoal[700], marginBottom: 20 }]} onPress={() => showToast('Gallery', 'Gallery access coming soon')}>
                                        <Text style={[styles.primaryBtnText, { color: colors.text.primary }]}>🖼️ Choose from Gallery</Text>
                                    </Pressable>
                                    <Pressable style={styles.primaryBtn} onPress={() => setSettingsModal(null)}>
                                        <Text style={styles.primaryBtnText}>Done</Text>
                                    </Pressable>
                                </>
                            )}
                            <Pressable style={[styles.btnSecondary, { marginTop: 10, alignItems: 'center' }]} onPress={() => setSettingsModal(null)}>
                                <Text style={{ color: colors.text.secondary }}>Cancel</Text>
                            </Pressable>
                        </View>
                    </View>
                )
            }
        </View >
    );

    // ============================================================================
    // MAIN RENDER
    // ============================================================================
    return (
        <View style={styles.container}>
            {/* Toast */}
            {toast && (
                <Pressable style={styles.toast} onPress={() => setToast(null)}>
                    <View style={styles.toastContent}><Text style={styles.toastTitle}>{toast.title}</Text><Text style={styles.toastMsg}>{toast.msg}</Text></View>
                </Pressable>
            )}

            {renderSidebar()}

            <View style={styles.mainContent}>
                {!isLargeScreen && (
                    <View style={styles.mobileHeader}>
                        <Pressable style={styles.menuBtn} onPress={() => setSidebarOpen(true)}><Text style={styles.menuIcon}>☰</Text></Pressable>
                        <View style={styles.headerPill}><View style={styles.headerDot} /><Text style={styles.headerLoc}>Muthaiga, NBO</Text></View>
                        <Pressable style={styles.notifBtn}><Text>🔔</Text><View style={styles.notifDot} /></Pressable>
                    </View>
                )}

                {currentView === 'home' && renderHomeView()}
                {currentView === 'orders' && renderOrdersView()}
                {currentView === 'wallet' && renderWalletView()}
                {currentView === 'settings' && renderSettingsView()}
            </View>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: colors.charcoal[900] },

    // Sidebar
    sidebar: { width: 280, backgroundColor: colors.charcoal[800], borderRightWidth: 1, borderRightColor: colors.charcoal[600], paddingTop: Platform.OS === 'ios' ? 50 : 30, ...(isWeb && isLargeScreen ? {} : { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 50 }) },
    sidebarHidden: { transform: [{ translateX: -300 }] },
    sidebarScroll: { flex: 1 },
    sidebarContent: { paddingBottom: 20 },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    sidebarLogo: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.voltage, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoText: { fontSize: 22, fontWeight: '800', color: colors.text.primary },
    logoAccent: { color: colors.voltage },
    closeBtn: { color: colors.text.secondary, fontSize: 22, padding: 8 },

    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[700], marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: 16, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.charcoal[600] },
    userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.charcoal[600], justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm, borderWidth: 2, borderColor: colors.voltage },
    userAvatarText: { color: colors.text.primary, fontWeight: '700' },
    userInfo: { flex: 1 },
    userName: { color: colors.text.primary, fontWeight: '700', fontSize: 15 },
    userLoc: { color: colors.text.secondary, fontSize: 12 },

    navList: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
    navBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md, borderRadius: 12, marginBottom: 4, position: 'relative', overflow: 'hidden' },
    navBtnActive: { backgroundColor: `${colors.voltage}12` },
    navBtnGlow: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: colors.voltage, borderRadius: 2 },
    navBtnIcon: { fontSize: 18, marginRight: spacing.sm },
    navBtnLabel: { color: colors.text.secondary, fontSize: 15, fontWeight: '500' },
    navBtnLabelActive: { color: colors.voltage, fontWeight: '600' },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.xl },
    logoutIcon: { fontSize: 16, marginRight: spacing.sm },
    logoutText: { color: colors.emergency, fontSize: 14, fontWeight: '500' },

    memberBadge: { margin: spacing.lg, padding: spacing.md, backgroundColor: `${colors.voltage}10`, borderWidth: 1, borderColor: `${colors.voltage}30`, borderRadius: 14 },
    memberIcon: { fontSize: 16 },
    memberLabel: { color: colors.voltage, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
    memberExp: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },

    // Main Content
    mainContent: { flex: 1, backgroundColor: colors.charcoal[900] },
    mobileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
    menuBtn: { width: 44, height: 44, backgroundColor: colors.charcoal[800], borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.charcoal[600] },
    menuIcon: { color: colors.text.primary, fontSize: 20 },
    headerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[800], paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: colors.charcoal[600] },
    headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 8 },
    headerLoc: { color: colors.text.primary, fontSize: 13, fontWeight: '600' },
    notifBtn: { width: 44, height: 44, backgroundColor: colors.charcoal[800], borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.charcoal[600], position: 'relative' },
    notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, backgroundColor: colors.voltage, borderRadius: 4 },

    // Toast
    toast: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, right: 20, zIndex: 100, backgroundColor: colors.charcoal[800], borderRadius: 16, borderWidth: 1, borderColor: `${colors.voltage}40`, padding: spacing.md, flexDirection: 'row', ...(isWeb && { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } as any) },
    toastContent: { flex: 1 },
    toastTitle: { color: colors.text.primary, fontSize: 15, fontWeight: '700' },
    toastMsg: { color: colors.text.secondary, fontSize: 13 },

    // Home View
    homeViewScroll: { flex: 1 },
    homeViewContent: { paddingBottom: 100 },
    mapBg: { height: 320, backgroundColor: colors.charcoal[800], position: 'relative', overflow: 'hidden' },
    mapRoad1: { position: 'absolute', top: '45%', left: -50, right: -50, height: 6, backgroundColor: colors.charcoal[700], transform: [{ rotate: '8deg' }] },
    mapRoad2: { position: 'absolute', top: 0, left: '50%', bottom: 0, width: 6, backgroundColor: colors.charcoal[700] },
    mapRoad3: { position: 'absolute', top: '70%', left: -50, right: -50, height: 4, backgroundColor: colors.charcoal[700], transform: [{ rotate: '-5deg' }] },
    userPinWrap: { position: 'absolute', top: '45%', left: '50%', marginLeft: -20, marginTop: -20, alignItems: 'center', justifyContent: 'center' },
    userPinPulse: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.voltage}25` },
    userPinDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.voltage, borderWidth: 5, borderColor: '#fff', ...(isWeb && { boxShadow: '0 4px 12px rgba(255,214,10,0.5)' } as any) },
    driverPinWrap: { position: 'absolute', top: '10%', left: '10%', alignItems: 'center', zIndex: 20 },
    driverPinLabel: { backgroundColor: colors.charcoal[900], paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginBottom: 4 },
    driverPinLabelText: { color: colors.text.primary, fontSize: 11, fontWeight: '700' },
    driverPinIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.charcoal[900], borderWidth: 2, borderColor: colors.voltage, justifyContent: 'center', alignItems: 'center' },

    // Action Panel
    actionPanel: { paddingHorizontal: spacing.md, marginTop: -60 },
    panel: { backgroundColor: colors.charcoal[800], borderRadius: 24, borderWidth: 1, borderColor: colors.charcoal[600], padding: spacing.lg, ...(isWeb && { boxShadow: '0 12px 40px rgba(0,0,0,0.4)' } as any) },
    panelCenter: { alignItems: 'center', paddingVertical: spacing.xl * 1.5 },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    panelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
    panelTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
    backBtn: { color: colors.text.secondary, fontSize: 24, marginRight: spacing.md, fontWeight: '300' },
    vehicleBadge: { backgroundColor: colors.charcoal[700], paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.charcoal[600] },
    vehicleBadgeText: { color: colors.text.primary, fontSize: 13, fontWeight: '600' },

    // SOS Button
    sosContainer: { marginBottom: spacing.lg },
    sosBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.emergency}15`, borderWidth: 2, borderColor: colors.emergency, borderRadius: 16, padding: spacing.md, ...(isWeb && { boxShadow: '0 0 20px rgba(255,61,61,0.3)' } as any) },
    sosBtnPressed: { backgroundColor: `${colors.emergency}25`, transform: [{ scale: 0.98 }] },
    sosIcon: { fontSize: 28, marginRight: spacing.md },
    sosTitle: { color: colors.emergency, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    sosSubtitle: { color: colors.text.secondary, fontSize: 12 },

    // Service Grid
    serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
    serviceCard: { width: '31%', backgroundColor: colors.charcoal[700], borderRadius: 16, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.charcoal[600] },
    serviceCardPressed: { borderColor: colors.voltage, backgroundColor: colors.charcoal[600], transform: [{ scale: 0.96 }] },
    serviceCardHover: { borderColor: `${colors.voltage}60`, transform: [{ translateY: -2 }] },
    serviceCardSkeleton: { width: '31%', padding: spacing.md, alignItems: 'center', gap: 8 },
    serviceIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    serviceEmoji: { fontSize: 22 },
    serviceLabel: { fontSize: 12, fontWeight: '600', color: colors.text.primary, textAlign: 'center' },
    servicePrice: { fontSize: 10, color: colors.text.muted, marginTop: 4 },

    // Locating
    locatingRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.voltage}20`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
    locatingRingInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.voltage },
    locatingTitle: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
    locatingSub: { color: colors.text.secondary, marginTop: 8, marginBottom: spacing.lg },
    progressBar: { width: 200, height: 4, backgroundColor: colors.charcoal[700], borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', width: '60%', backgroundColor: colors.voltage },

    // Forms
    formGroup: { marginBottom: spacing.lg },
    inputLabel: { color: colors.text.secondary, fontSize: 13, marginBottom: 8, fontWeight: '500' },
    textInput: { backgroundColor: colors.charcoal[900], borderWidth: 1, borderColor: colors.charcoal[600], borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: 16, color: colors.text.primary, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    amountInput: { backgroundColor: colors.charcoal[900], borderWidth: 1, borderColor: colors.charcoal[600], borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: 16, color: colors.text.primary, fontSize: 28, fontWeight: '700' },
    fuelRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    fuelTypeBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: 14, borderWidth: 2, borderColor: colors.charcoal[600], backgroundColor: colors.charcoal[700], alignItems: 'center' },
    fuelTypeBtnActive: { borderColor: colors.voltage, backgroundColor: `${colors.voltage}10` },
    fuelTypeText: { color: colors.text.secondary, fontWeight: '600', fontSize: 15 },
    fuelTypeTextActive: { color: colors.voltage },
    fuelPrice: { color: colors.text.muted, fontSize: 11, marginTop: 4 },
    litersText: { color: colors.voltage, fontSize: 15, fontWeight: '600', textAlign: 'right', marginTop: 8 },
    priceBox: { backgroundColor: colors.charcoal[900], padding: spacing.md, borderRadius: 14, borderWidth: 1, borderColor: colors.charcoal[600] },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    priceLabel: { color: colors.text.secondary, fontSize: 14 },
    priceValue: { color: colors.text.primary, fontWeight: '600' },
    emergencyAlert: { backgroundColor: `${colors.emergency}15`, borderWidth: 1, borderColor: `${colors.emergency}40`, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
    emergencyAlertText: { color: colors.emergency, fontWeight: '600', fontSize: 14 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.charcoal[600], marginBottom: spacing.md },
    totalLabel: { color: colors.text.secondary, fontSize: 15 },
    totalValue: { color: colors.text.primary, fontSize: 28, fontWeight: '800' },
    primaryBtn: { backgroundColor: colors.voltage, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
    btnDisabled: { opacity: 0.5 },
    primaryBtnText: { color: colors.charcoal[900], fontWeight: '700', fontSize: 16 },

    // Payment
    summaryBox: { backgroundColor: colors.charcoal[900], borderRadius: 14, padding: spacing.md, borderWidth: 1, borderColor: colors.charcoal[600], marginBottom: spacing.lg },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { color: colors.text.secondary, fontSize: 14 },
    summaryValue: { color: colors.text.primary, fontWeight: '600' },
    summaryDivider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: 10 },
    summaryTotalLabel: { color: colors.text.primary, fontWeight: '700', fontSize: 16 },
    summaryTotalValue: { color: colors.voltage, fontWeight: '800', fontSize: 20 },

    // M-Pesa Section
    mpesaSection: { backgroundColor: colors.charcoal[900], borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.success, marginBottom: spacing.lg },
    mpesaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    mpesaLogo: { width: 80, height: 32, marginRight: spacing.sm },
    lipaNaMpesaText: { color: colors.success, fontSize: 18, fontWeight: '700' },
    tillBox: { backgroundColor: colors.charcoal[800], borderRadius: 12, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.charcoal[600] },
    tillLabel: { color: colors.text.secondary, fontSize: 12, marginBottom: 4 },
    tillNumber: { color: colors.voltage, fontSize: 32, fontWeight: '800', letterSpacing: 2 },
    tillName: { color: colors.text.primary, fontSize: 14, fontWeight: '600', marginTop: 4 },
    mpesaNote: { color: colors.text.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
    mpesaPayBtn: { backgroundColor: colors.success, paddingVertical: 18, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    mpesaBtnLogo: { width: 24, height: 24 },
    mpesaPayBtnText: { color: '#fff', fontWeight: '700', fontSize: 18 },
    mpesaBtn: { backgroundColor: colors.success, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
    mpesaBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Processing
    phoneIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
    phoneIcon: { fontSize: 36 },
    processingTitle: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
    processingSub: { color: colors.text.secondary, marginTop: 8 },

    // Tracking
    trackingPanel: { backgroundColor: colors.charcoal[800], borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.charcoal[600] },
    trackingHeader: { backgroundColor: colors.voltage, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    etaBox: { flexDirection: 'row', alignItems: 'center' },
    etaIcon: { fontSize: 18, marginRight: 8 },
    etaText: { color: colors.charcoal[900], fontWeight: '800', fontSize: 15 },
    onTimeBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    onTimeBadgeText: { color: colors.charcoal[900], fontSize: 11, fontWeight: '700' },
    etaProgress: { height: 4, backgroundColor: colors.charcoal[900] },
    etaProgressFill: { height: '100%', backgroundColor: colors.success },
    driverCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    driverAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.charcoal[600] },
    driverAvatarIcon: { fontSize: 26 },
    driverInfo: { flex: 1, marginLeft: spacing.md },
    driverName: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
    driverVehicle: { color: colors.text.secondary, fontSize: 14 },
    callBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.charcoal[600] },
    callBtnIcon: { fontSize: 20 },

    // Complete
    successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: `${colors.success}20`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
    successIconText: { fontSize: 48, color: colors.success, fontWeight: '700' },
    completeTitle: { fontSize: 26, fontWeight: '800', color: colors.text.primary },
    completeSub: { color: colors.text.secondary, marginTop: 8, marginBottom: spacing.xl },

    // Views
    viewScroll: { flex: 1, paddingTop: isLargeScreen ? 50 : 0 },
    viewContent: { padding: spacing.lg, paddingBottom: 100 },
    viewTitle: { fontSize: 30, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.sm },
    viewSubtitle: { color: colors.text.secondary, fontSize: 15, marginBottom: spacing.xl },
    sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text.secondary, marginBottom: spacing.md, marginTop: spacing.xl, letterSpacing: 0.5 },

    // Orders
    orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: colors.charcoal[600], borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm },
    orderIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    orderInfo: { flex: 1 },
    orderLoc: { color: colors.text.primary, fontWeight: '700', fontSize: 16 },
    orderMeta: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
    orderRight: { alignItems: 'flex-end' },
    orderAmount: { color: colors.text.primary, fontWeight: '700', fontSize: 16 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
    statusComplete: { backgroundColor: `${colors.success}15` },
    statusProgress: { backgroundColor: `${colors.voltage}15` },
    statusText: { fontSize: 11, fontWeight: '700' },
    statusTextComplete: { color: colors.success },
    statusTextProgress: { color: colors.voltage },

    // Wallet
    balanceCard: { backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: colors.charcoal[600], borderRadius: 24, padding: spacing.xl, ...(isWeb && { background: 'linear-gradient(135deg, #1A1A1A 0%, #252525 100%)' } as any) },
    balanceLabel: { color: colors.text.secondary, fontSize: 14 },
    balanceAmount: { color: colors.text.primary, fontSize: 40, fontWeight: '800', marginTop: 8, marginBottom: spacing.lg },
    balanceBtns: { flexDirection: 'row', gap: spacing.md },
    topUpBtn: { backgroundColor: colors.success, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    topUpBtnText: { color: '#fff', fontWeight: '700' },
    historyBtn: { backgroundColor: colors.charcoal[700], paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.charcoal[600] },
    historyBtnText: { color: colors.text.primary },
    paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: `${colors.success}40`, borderRadius: 16, padding: spacing.md },
    mpesaBadge: { backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: spacing.md },
    mpesaBadgeText: { color: '#fff', fontWeight: '700', fontSize: 11 },
    paymentInfo: { flex: 1 },
    paymentTitle: { color: colors.text.primary, fontWeight: '700' },
    paymentSub: { color: colors.text.secondary, fontSize: 13 },
    primaryMethodBadge: { backgroundColor: `${colors.success}15`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    primaryMethodText: { color: colors.success, fontSize: 10, fontWeight: '700' },

    // Settings
    settingsCard: { backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: colors.charcoal[600], borderRadius: 20, padding: spacing.lg },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
    profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.voltage, marginRight: spacing.lg },
    profileAvatarText: { color: colors.text.primary, fontWeight: '800', fontSize: 28 },
    changePhotoBtn: { backgroundColor: colors.charcoal[700], paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.charcoal[600] },
    changePhotoBtnText: { color: colors.text.primary, fontSize: 14 },
    fieldRow: { marginBottom: spacing.md },
    fieldLabel: { color: colors.text.secondary, fontSize: 12, marginBottom: 6 },
    fieldValue: { backgroundColor: colors.charcoal[900], borderWidth: 1, borderColor: colors.charcoal[600], borderRadius: 12, padding: spacing.md },
    fieldValueText: { color: colors.text.primary },
    vehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[800], borderWidth: 1, borderColor: `${colors.voltage}40`, borderRadius: 16, padding: spacing.md },
    vehicleIconWrap: { width: 44, height: 44, backgroundColor: colors.charcoal[700], borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    vehicleInfo: { flex: 1 },
    vehicleTitle: { color: colors.text.primary, fontWeight: '700' },
    vehicleSub: { color: colors.text.secondary, fontSize: 13 },
    defaultVehicleBadge: { backgroundColor: colors.voltage, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    defaultVehicleText: { color: colors.charcoal[900], fontSize: 10, fontWeight: '700' },

    // Orders (Enhanced)
    timelineContainer: { paddingLeft: spacing.md, paddingVertical: spacing.md },
    timelineLine: { position: 'absolute', left: 24, top: 20, bottom: 20, width: 2, backgroundColor: colors.charcoal[700] },
    timelineItem: { flexDirection: 'row', marginBottom: spacing.lg },
    timelineDotWrap: { width: 32, alignItems: 'center', marginRight: spacing.md },
    timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 6, borderWidth: 2, borderColor: colors.charcoal[900] },
    dotComplete: { backgroundColor: colors.success },
    dotProgress: { backgroundColor: colors.voltage },
    orderCardEnhanced: { flex: 1, backgroundColor: colors.charcoal[800], borderRadius: 16, borderWidth: 1, borderColor: colors.charcoal[600], padding: spacing.md },
    orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    serviceIconSmall: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
    orderHeaderText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderId: { color: colors.text.primary, fontWeight: '700', fontSize: 15 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusPillComplete: { backgroundColor: `${colors.success}15` },
    statusPillProgress: { backgroundColor: `${colors.voltage}15` },
    statusPillText: { fontSize: 11, fontWeight: '700' },
    orderBody: { gap: 8 },
    orderRow: { flexDirection: 'row', justifyContent: 'space-between' },
    orderLabel: { color: colors.text.secondary, fontSize: 13 },
    orderValue: { color: colors.text.primary, fontSize: 13, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.charcoal[600], marginVertical: 4 },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderAmountLabel: { color: colors.text.secondary, fontSize: 13 },
    orderAmountValue: { color: colors.voltage, fontWeight: '700', fontSize: 15 },

    // Wallet (Enhanced)
    walletCardGradient: { height: 220, borderRadius: 24, padding: spacing.xl, justifyContent: 'space-between', marginBottom: spacing.xl, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: `${colors.voltage}40` },
    walletCardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.charcoal[800] }, // Gradient fallback
    walletCardContent: { flex: 1, justifyContent: 'space-between' },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    walletLabel: { color: colors.text.secondary, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
    walletChip: { backgroundColor: `${colors.voltage}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    walletChipText: { color: colors.voltage, fontSize: 10, fontWeight: '800' },
    walletBalance: { color: colors.text.primary, fontSize: 48, fontWeight: '800' },
    walletBalanceDecimal: { fontSize: 28, color: colors.text.secondary },
    walletFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    walletUser: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
    walletExp: { color: colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14 },

    actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
    actionBtn: { width: '31%', backgroundColor: colors.charcoal[800], borderRadius: 16, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.charcoal[600] },
    actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionLabel: { color: colors.text.primary, fontSize: 12, fontWeight: '600' },

    methodCardEnhanced: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[800], borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.charcoal[600] },
    methodIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    methodEmoji: { fontSize: 20 },
    methodInfo: { flex: 1 },
    methodTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 15 },
    methodSub: { color: colors.text.secondary, fontSize: 12 },
    radioChosen: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.voltage, padding: 3 },
    radioInner: { flex: 1, borderRadius: 10, backgroundColor: colors.voltage },
    radioUnchosen: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.charcoal[500] },

    // Settings (Enhanced)
    profileHeaderCard: { backgroundColor: colors.charcoal[800], borderRadius: 24, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.charcoal[600], overflow: 'hidden' },
    profileHeaderBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: `${colors.voltage}10` },
    profileHeaderContent: { alignItems: 'center', marginTop: 20 },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.charcoal[800], marginBottom: spacing.md },
    avatarLargeText: { fontSize: 36, fontWeight: '800', color: colors.text.primary },
    editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.voltage, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.charcoal[800] },
    editAvatarIcon: { fontSize: 14 },
    profileNameLarge: { color: colors.text.primary, fontSize: 22, fontWeight: '800', marginBottom: 4 },
    profileMembership: { color: colors.voltage, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

    settingsGroup: { marginBottom: spacing.xl },
    groupTitle: { color: colors.text.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: spacing.sm },
    groupContainer: { backgroundColor: colors.charcoal[800], borderRadius: 16, padding: spacing.sm, borderWidth: 1, borderColor: colors.charcoal[600] },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
    settingIcon: { width: 32, alignItems: 'center', marginRight: spacing.sm },
    settingLabel: { flex: 1, color: colors.text.primary, fontSize: 15, fontWeight: '500' },
    settingArrow: { color: colors.text.secondary, fontSize: 18, fontWeight: '300' },
    settingDivider: { height: 1, backgroundColor: colors.charcoal[700], marginLeft: 48 },
    toggleActive: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.voltage, padding: 2, alignItems: 'flex-end' },
    toggleKnobActive: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.charcoal[900] },
    appVersion: { textAlign: 'center', color: colors.charcoal[600], fontSize: 12, marginTop: spacing.md },

    // Modal
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { width: '85%', backgroundColor: colors.charcoal[800], borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.charcoal[600], alignItems: 'center' },
    modalTitle: { color: colors.text.primary, fontSize: 20, fontWeight: '700', marginBottom: spacing.md, textAlign: 'center' },
    modalText: { color: colors.text.secondary, fontSize: 14, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
    btnSecondary: { paddingVertical: 12, paddingHorizontal: 24 },
});
