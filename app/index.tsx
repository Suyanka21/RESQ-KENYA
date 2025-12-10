// ⚡ ResQ Kenya - Landing Page (2025 Enhanced)
// Features: Glassmorphism, Animations, Micro-interactions, Modern UI

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, Pressable, Platform,
    Dimensions, Animated, Easing
} from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, borderRadius, spacing } from '../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width > 768;

// ============================================================================
// DATA
// ============================================================================

const NAV_LINKS = [
    { name: 'Services', href: '#services' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Membership', href: '#membership' },
    { name: 'Join as Provider', href: '#providers' },
];

const FEATURES = [
    { emoji: '🚛', title: 'Flatbed Towing', description: 'Professional flatbeds to safely transport your vehicle to your preferred garage.', color: colors.serviceTowing },
    { emoji: '🚑', title: 'Ambulance Dispatch', description: 'One tap connects you to the nearest ambulance service with GPS precision.', color: colors.serviceAmbulance },
    { emoji: '🔧', title: 'Tire & Mechanical', description: 'Our verified mobile mechanics are ready to fix you on the spot.', color: colors.serviceTire },
    { emoji: '⚡', title: 'Battery Jumpstart', description: 'Jumpstart or battery replacement delivered in minutes.', color: colors.serviceBattery },
    { emoji: '🔍', title: 'Vehicle Diagnostics', description: 'Technician with OBD scanner to diagnose issues instantly.', color: colors.serviceDiagnostics },
    { emoji: '⛽', title: 'Fuel Delivery', description: 'Petrol or diesel delivered in safe containers to your location.', color: colors.serviceFuel },
];

const STEPS = [
    { num: '01', title: 'Select Emergency', desc: 'Choose the service you need—Towing, Ambulance, Fuel, or Mechanics.' },
    { num: '02', title: 'Share Location', desc: 'GPS pinpoints your exact location automatically.' },
    { num: '03', title: 'Instant Dispatch', desc: 'Nearest verified provider accepts and heads your way.' },
    { num: '04', title: 'Track & Pay', desc: 'Watch arrival in real-time, pay via M-Pesa after service.' },
];

const BASIC_FEATURES = ['Pay only when you request', 'All 6 service categories', '20-30 min response', 'Real-time tracking', '24/7 Support'];
const GOLD_FEATURES = ['Free Towing (20km)', 'Priority Dispatch', '1 Free Diagnostic/month', 'Discounted Fuel fees', 'Account Manager', '3 Vehicle Coverage'];

const TESTIMONIALS = [
    { name: 'Wanjiku K.', role: 'Commuter, Nairobi', text: 'Stuck at 10 PM with a flat tire. ResQ sent help in 20 mins. Lifesavers!', rating: 5 },
    { name: 'Brian O.', role: 'Fleet Manager', text: 'We use ResQ for our entire fleet. Saved us so much downtime.', rating: 5 },
    { name: 'Amina Y.', role: 'New Driver, Mombasa', text: 'The app is chonjo. Real-time tracking feels premium and safe.', rating: 5 },
];

const STATS = [
    { value: 15000, label: 'Rescues', suffix: '+' },
    { value: 8, label: 'Min Avg', suffix: ' min' },
    { value: 98, label: 'Satisfaction', suffix: '%' },
];

// ============================================================================
// ANIMATED COUNTER HOOK
// ============================================================================
const useAnimatedCounter = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (!hasStarted) return;
        let startTime: number;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [hasStarted, end, duration]);

    return { count, start: () => setHasStarted(true) };
};

// ============================================================================
// ANIMATED CARD COMPONENT
// ============================================================================
const AnimatedCard = ({ children, delay = 0, style }: { children: React.ReactNode, delay?: number, style?: any }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {children}
        </Animated.View>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Hero animations
    const heroFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(40)).current;
    const ctaPulse = useRef(new Animated.Value(1)).current;

    // Stats counters
    const stat1 = useAnimatedCounter(15000, 2500);
    const stat2 = useAnimatedCounter(8, 1500);
    const stat3 = useAnimatedCounter(98, 2000);

    useEffect(() => {
        // Hero entrance animation
        Animated.parallel([
            Animated.timing(heroFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(heroSlide, { toValue: 0, duration: 1000, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]).start();

        // CTA pulse loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(ctaPulse, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
                Animated.timing(ctaPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();

        // Start counters after delay
        setTimeout(() => { stat1.start(); stat2.start(); stat3.start(); }, 800);
    }, []);

    const handleGetStarted = () => router.push('/(customer)');
    const handleLogin = () => router.push('/(auth)/login');

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* ============ NAVBAR (Glassmorphism) ============ */}
            <View style={styles.navbar}>
                <Pressable style={styles.logo}>
                    <View style={styles.logoIcon}><Text style={styles.logoIconText}>⚡</Text></View>
                    <Text style={styles.logoText}>Res<Text style={styles.logoAccent}>Q</Text></Text>
                </Pressable>

                {isWeb && isLargeScreen && (
                    <View style={styles.desktopNav}>
                        {NAV_LINKS.map((link) => (
                            <Pressable key={link.name} style={({ hovered }: any) => [styles.navLink, hovered && styles.navLinkHovered]}>
                                {({ hovered }: any) => (
                                    <View style={styles.navLinkContainer}>
                                        <Text style={[styles.navLinkText, hovered && styles.navLinkTextHovered]}>{link.name}</Text>
                                        <View style={[styles.navLinkUnderline, hovered && styles.navLinkUnderlineActive]} />
                                    </View>
                                )}
                            </Pressable>
                        ))}
                        <Pressable style={({ hovered, pressed }: any) => [styles.navBtnSecondary, hovered && styles.navBtnSecondaryHover, pressed && styles.btnPressed]} onPress={handleLogin}>
                            <Text style={styles.navBtnSecondaryText}>Log in</Text>
                        </Pressable>
                        <Pressable style={({ hovered, pressed }: any) => [styles.navBtnPrimary, hovered && styles.navBtnPrimaryHover, pressed && styles.btnPressed]} onPress={handleGetStarted}>
                            <Text style={styles.navBtnPrimaryText}>Get App</Text>
                        </Pressable>
                    </View>
                )}

                {(!isWeb || !isLargeScreen) && (
                    <Pressable style={styles.menuBtn} onPress={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <Text style={styles.menuBtnText}>{mobileMenuOpen ? '✕' : '☰'}</Text>
                    </Pressable>
                )}
            </View>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <View style={styles.mobileMenu}>
                    {NAV_LINKS.map((link) => (
                        <Pressable key={link.name} style={styles.mobileNavLink} onPress={() => setMobileMenuOpen(false)}>
                            <Text style={styles.mobileNavLinkText}>{link.name}</Text>
                        </Pressable>
                    ))}
                    <Pressable style={styles.mobileBtnOutline} onPress={() => { setMobileMenuOpen(false); handleLogin(); }}>
                        <Text style={styles.mobileBtnOutlineText}>Log in</Text>
                    </Pressable>
                    <Pressable style={styles.mobileBtnPrimary} onPress={() => { setMobileMenuOpen(false); handleGetStarted(); }}>
                        <Text style={styles.mobileBtnPrimaryText}>Download App</Text>
                    </Pressable>
                </View>
            )}

            <ScrollView ref={scrollRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* ============ HERO SECTION ============ */}
                <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
                    <View style={styles.heroGlow} />
                    <View style={styles.heroGlow2} />

                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>LIVE • 24/7 RESPONSE IN NAIROBI</Text>
                    </View>

                    <Text style={styles.headline}>
                        Help when it{'\n'}matters <Text style={styles.headlineAccent}>most.</Text>
                    </Text>

                    <Text style={styles.subheadline}>
                        From flatbed towing to ambulance dispatch. ResQ is the "Uber for Rescue" — fast, reliable, just a tap away.
                    </Text>

                    <View style={styles.ctaRow}>
                        <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
                            <Pressable style={({ pressed }) => [styles.primaryCta, pressed && styles.ctaPressed]} onPress={handleGetStarted}>
                                <Text style={styles.primaryCtaText}>Request Assistance →</Text>
                            </Pressable>
                        </Animated.View>
                        <Pressable style={({ pressed }) => [styles.secondaryCta, pressed && styles.ctaPressed]} onPress={handleGetStarted}>
                            <Text style={styles.secondaryCtaText}>View Services</Text>
                        </Pressable>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stat1.count.toLocaleString()}+</Text>
                            <Text style={styles.statLabel}>Rescues</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stat2.count} min</Text>
                            <Text style={styles.statLabel}>Avg Response</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stat3.count}%</Text>
                            <Text style={styles.statLabel}>Satisfaction</Text>
                        </View>
                    </View>

                    {/* Phone Mockup */}
                    <View style={styles.phoneMockup}>
                        <View style={styles.phoneScreen}>
                            <View style={styles.phoneHeader}>
                                <Text style={styles.phoneHeaderText}>ResQ</Text>
                                <View style={styles.phoneOnline} />
                            </View>
                            <View style={styles.phoneMap}>
                                <View style={styles.mapRoad1} />
                                <View style={styles.mapRoad2} />
                                <View style={styles.userPin}>
                                    <View style={styles.userPinPulse} />
                                    <View style={styles.userPinDot} />
                                </View>
                            </View>
                            <View style={styles.phoneCard}>
                                <View style={styles.phoneCardIcon}><Text>🚛</Text></View>
                                <View style={styles.phoneCardInfo}>
                                    <Text style={styles.phoneCardTitle}>ResQ Towing Unit</Text>
                                    <Text style={styles.phoneCardEta}>Arriving in 8 mins</Text>
                                </View>
                                <View style={styles.phoneCardBadge}><Text style={styles.phoneCardBadgeText}>EN ROUTE</Text></View>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* ============ FEATURES SECTION ============ */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>OUR SERVICES</Text>
                    <Text style={styles.sectionTitle}>Complete <Text style={styles.accent}>Emergency Infrastructure</Text></Text>
                    <Text style={styles.sectionSubtitle}>Your lifeline on Kenyan roads. Vehicle and medical emergencies covered.</Text>

                    <View style={styles.featuresGrid}>
                        {FEATURES.map((f, i) => (
                            <AnimatedCard key={i} delay={i * 100} style={styles.featureCard}>
                                <Pressable style={({ hovered }: any) => [styles.featureCardInner, hovered && styles.featureCardHover]}>
                                    <View style={[styles.featureIcon, { backgroundColor: `${f.color}20` }]}>
                                        <Text style={styles.featureEmoji}>{f.emoji}</Text>
                                    </View>
                                    <Text style={styles.featureTitle}>{f.title}</Text>
                                    <Text style={styles.featureDesc}>{f.description}</Text>
                                </Pressable>
                            </AnimatedCard>
                        ))}
                    </View>
                </View>

                {/* ============ HOW IT WORKS ============ */}
                <View style={[styles.section, styles.sectionAlt]}>
                    <Text style={styles.sectionTitle}>How <Text style={styles.accent}>ResQ</Text> Works</Text>
                    <Text style={styles.sectionSubtitle}>Emergency response simplified into 4 easy steps.</Text>

                    <View style={styles.stepsGrid}>
                        {STEPS.map((s, i) => (
                            <AnimatedCard key={i} delay={i * 150} style={styles.stepCard}>
                                <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.num}</Text></View>
                                <Text style={styles.stepTitle}>{s.title}</Text>
                                <Text style={styles.stepDesc}>{s.desc}</Text>
                            </AnimatedCard>
                        ))}
                    </View>
                </View>

                {/* ============ MEMBERSHIP ============ */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>MEMBERSHIP</Text>
                    <Text style={styles.sectionTitle}>Choose Your <Text style={styles.accent}>Peace of Mind</Text></Text>

                    <View style={styles.plansRow}>
                        <AnimatedCard delay={100} style={styles.planCard}>
                            <Text style={styles.planType}>PAY PER USE</Text>
                            <Text style={styles.planName}>ResQ Basic</Text>
                            <Text style={styles.planPrice}>KES 0<Text style={styles.planPriceUnit}>/mo</Text></Text>
                            {BASIC_FEATURES.map((f, i) => (
                                <View key={i} style={styles.planFeature}><Text style={styles.checkMark}>✓</Text><Text style={styles.planFeatureText}>{f}</Text></View>
                            ))}
                            <Pressable style={styles.planBtnSecondary}><Text style={styles.planBtnSecondaryText}>Get Started</Text></Pressable>
                        </AnimatedCard>

                        <AnimatedCard delay={200} style={[styles.planCard, styles.planCardGold]}>
                            <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>MOST POPULAR</Text></View>
                            <Text style={styles.planTypeGold}>🛡️ PREMIUM PROTECTION</Text>
                            <Text style={styles.planNameGold}>ResQ Gold</Text>
                            <Text style={styles.planPriceGold}>KES 1,500<Text style={styles.planPriceUnitGold}>/mo</Text></Text>
                            {GOLD_FEATURES.map((f, i) => (
                                <View key={i} style={styles.planFeature}><Text style={styles.checkMarkGold}>✓</Text><Text style={styles.planFeatureTextGold}>{f}</Text></View>
                            ))}
                            <Pressable style={styles.planBtnPrimary}><Text style={styles.planBtnPrimaryText}>Join ResQ Gold</Text></Pressable>
                        </AnimatedCard>
                    </View>
                </View>

                {/* ============ TESTIMONIALS ============ */}
                <View style={[styles.section, styles.sectionAlt]}>
                    <Text style={styles.sectionTitle}>Wakenya wanasema nini?</Text>
                    <View style={styles.testimonialsGrid}>
                        {TESTIMONIALS.map((t, i) => (
                            <AnimatedCard key={i} delay={i * 100} style={styles.testimonialCard}>
                                <View style={styles.quoteIcon}><Text style={styles.quoteIconText}>❝</Text></View>
                                <View style={styles.starsRow}>{[...Array(5)].map((_, j) => <Text key={j} style={styles.star}>⭐</Text>)}</View>
                                <Text style={styles.testimonialText}>"{t.text}"</Text>
                                <View style={styles.testimonialAuthor}>
                                    <View style={styles.testimonialAvatar}><Text style={styles.testimonialAvatarText}>{t.name[0]}</Text></View>
                                    <View><Text style={styles.testimonialName}>{t.name}</Text><Text style={styles.testimonialRole}>{t.role}</Text></View>
                                </View>
                            </AnimatedCard>
                        ))}
                    </View>
                </View>

                {/* ============ DOWNLOAD CTA ============ */}
                <View style={styles.downloadSection}>
                    <Text style={styles.downloadTitle}>NEVER STRANDED AGAIN.</Text>
                    <Text style={styles.downloadSubtitle}>Download ResQ today. First delivery fee waived.</Text>
                    <View style={styles.storeButtons}>
                        <Pressable style={({ pressed }) => [styles.storeBtn, pressed && styles.storeBtnPressed]}>
                            <Text style={styles.storeIcon}>📱</Text>
                            <View><Text style={styles.storeLabel}>Download on</Text><Text style={styles.storeName}>App Store</Text></View>
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.storeBtn, pressed && styles.storeBtnPressed]}>
                            <Text style={styles.storeIcon}>📱</Text>
                            <View><Text style={styles.storeLabel}>GET IT ON</Text><Text style={styles.storeName}>Google Play</Text></View>
                        </Pressable>
                    </View>
                </View>

                {/* ============ FOOTER ============ */}
                <View style={styles.footer}>
                    <View style={styles.footerTop}>
                        <View style={styles.footerBrand}>
                            <View style={styles.footerLogo}><Text style={styles.footerLogoIcon}>⚡</Text><Text style={styles.footerLogoText}>Res<Text style={styles.logoAccent}>Q</Text></Text></View>
                            <Text style={styles.footerDesc}>The smart emergency services platform for motorists. Towing to medical response, distress to instant action.</Text>
                            <Text style={styles.footerContact}>📍 Geometry Ltd, Muthaiga{'\n'}📞 +254 720 018 427</Text>
                        </View>
                        <View style={styles.footerLinks}>
                            <View style={styles.footerCol}><Text style={styles.footerColTitle}>Services</Text><Text style={styles.footerLink}>Towing</Text><Text style={styles.footerLink}>Ambulance</Text><Text style={styles.footerLink}>Fuel</Text></View>
                            <View style={styles.footerCol}><Text style={styles.footerColTitle}>Company</Text><Text style={styles.footerLink}>About</Text><Text style={styles.footerLink}>Careers</Text><Text style={styles.footerLink}>Contact</Text></View>
                            <View style={styles.footerCol}><Text style={styles.footerColTitle}>Legal</Text><Text style={styles.footerLink}>Terms</Text><Text style={styles.footerLink}>Privacy</Text></View>
                        </View>
                    </View>
                    <View style={styles.footerBottom}>
                        <Text style={styles.footerCopyright}>© 2025 Geometry Ltd. All rights reserved.</Text>
                        <View style={styles.socialIcons}><Text style={styles.socialIcon}>𝕏</Text><Text style={styles.socialIcon}>📷</Text><Text style={styles.socialIcon}>🔗</Text></View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.charcoal[900] },
    scrollView: { flex: 1 },

    // NAVBAR (Glassmorphism)
    navbar: {
        position: isWeb ? 'fixed' as any : 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
        backgroundColor: isWeb ? 'rgba(15, 15, 15, 0.85)' : colors.charcoal[900],
        ...(isWeb && { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any),
        borderBottomWidth: 1, borderBottomColor: `${colors.charcoal[600]}50`,
    },
    logo: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.voltage, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { fontSize: 20 },
    logoText: { fontSize: 24, fontWeight: '800', color: colors.text.primary },
    logoAccent: { color: colors.voltage },
    desktopNav: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    navLink: { paddingVertical: 8 },
    navLinkHovered: {},
    navLinkContainer: { alignItems: 'center' as const },
    navLinkText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
    navLinkTextHovered: { color: colors.voltage },
    navLinkUnderline: { height: 2, width: 0, backgroundColor: colors.voltage, marginTop: 4, borderRadius: 1 },
    navLinkUnderlineActive: { width: '100%' as any },
    navBtnSecondary: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: colors.voltage },
    navBtnSecondaryHover: { backgroundColor: `${colors.voltage}15` },
    navBtnSecondaryText: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
    navBtnPrimary: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.voltage },
    navBtnPrimaryHover: { backgroundColor: colors.voltageBright, transform: [{ scale: 1.02 }] },
    navBtnPrimaryText: { color: colors.charcoal[900], fontSize: 14, fontWeight: '700' },
    btnPressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
    menuBtn: { padding: 8 },
    menuBtnText: { color: colors.text.primary, fontSize: 24 },

    // Mobile Menu
    mobileMenu: { position: 'absolute', top: Platform.OS === 'ios' ? 100 : 80, left: 0, right: 0, zIndex: 99, backgroundColor: colors.charcoal[800], borderBottomWidth: 1, borderBottomColor: colors.charcoal[600], padding: spacing.lg, gap: spacing.md },
    mobileNavLink: { paddingVertical: spacing.sm },
    mobileNavLinkText: { color: colors.text.primary, fontSize: 18, fontWeight: '600' },
    mobileBtnOutline: { padding: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: colors.voltage, alignItems: 'center', marginTop: spacing.md },
    mobileBtnOutlineText: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
    mobileBtnPrimary: { padding: spacing.md, borderRadius: 12, backgroundColor: colors.voltage, alignItems: 'center' },
    mobileBtnPrimaryText: { color: colors.charcoal[900], fontSize: 16, fontWeight: '700' },

    // HERO
    hero: { paddingTop: Platform.OS === 'ios' ? 140 : 120, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2, position: 'relative' },
    heroGlow: { position: 'absolute', top: 80, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: `${colors.voltage}12` },
    heroGlow2: { position: 'absolute', top: 200, right: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: `${colors.voltage}08` },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,26,26,0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: colors.charcoal[600], alignSelf: 'flex-start', marginBottom: spacing.lg, ...(isWeb && { backdropFilter: 'blur(8px)' } as any) },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 10 },
    statusText: { fontSize: 11, fontWeight: '700', color: colors.text.secondary, letterSpacing: 1 },
    headline: { fontSize: isLargeScreen ? 64 : 44, fontWeight: '800', color: colors.text.primary, lineHeight: isLargeScreen ? 72 : 52, marginBottom: spacing.md },
    headlineAccent: { color: colors.voltage },
    subheadline: { fontSize: 17, color: colors.text.secondary, lineHeight: 28, marginBottom: spacing.xl, maxWidth: 500 },
    ctaRow: { flexDirection: isLargeScreen ? 'row' : 'column', gap: spacing.md, marginBottom: spacing.xl },
    primaryCta: { backgroundColor: colors.voltage, paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', ...(isWeb && { boxShadow: '0 0 30px rgba(255,214,10,0.4)' } as any) },
    primaryCtaText: { color: colors.charcoal[900], fontSize: 17, fontWeight: '700' },
    secondaryCta: { borderWidth: 2, borderColor: colors.voltage, paddingVertical: 16, paddingHorizontal: 28, borderRadius: 16, alignItems: 'center' },
    secondaryCtaText: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
    ctaPressed: { transform: [{ scale: 0.97 }] },

    // Stats
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,26,26,0.7)', padding: spacing.lg, borderRadius: 20, borderWidth: 1, borderColor: colors.charcoal[600], marginBottom: spacing.xl, alignSelf: 'flex-start', ...(isWeb && { backdropFilter: 'blur(10px)' } as any) },
    statItem: { alignItems: 'center', paddingHorizontal: spacing.lg },
    statValue: { fontSize: 28, fontWeight: '800', color: colors.voltage },
    statLabel: { fontSize: 12, color: colors.text.secondary, marginTop: 4, fontWeight: '500' },
    statDivider: { width: 1, height: 40, backgroundColor: colors.charcoal[600] },

    // Phone Mockup
    phoneMockup: { alignSelf: 'center', marginTop: spacing.xl },
    phoneScreen: { width: 280, height: 500, backgroundColor: colors.charcoal[800], borderRadius: 36, borderWidth: 6, borderColor: colors.charcoal[600], overflow: 'hidden', ...(isWeb && { boxShadow: '0 20px 60px rgba(0,0,0,0.6)' } as any) },
    phoneHeader: { height: 50, backgroundColor: colors.charcoal[900], borderBottomWidth: 1, borderBottomColor: colors.charcoal[600], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    phoneHeaderText: { color: colors.text.primary, fontWeight: '700' },
    phoneOnline: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
    phoneMap: { flex: 1, backgroundColor: colors.charcoal[800], position: 'relative' },
    mapRoad1: { position: 'absolute', top: '50%', left: 0, right: 0, height: 4, backgroundColor: colors.charcoal[700], transform: [{ rotate: '10deg' }] },
    mapRoad2: { position: 'absolute', top: 0, left: '50%', bottom: 0, width: 4, backgroundColor: colors.charcoal[700] },
    userPin: { position: 'absolute', top: '40%', left: '50%', marginLeft: -12, marginTop: -12, alignItems: 'center' },
    userPinPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: `${colors.voltage}30`, marginLeft: -13, marginTop: -13 },
    userPinDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.voltage, borderWidth: 4, borderColor: '#fff' },
    phoneCard: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(15,15,15,0.95)', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: `${colors.voltage}40` },
    phoneCardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    phoneCardInfo: { flex: 1 },
    phoneCardTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 13 },
    phoneCardEta: { color: colors.text.secondary, fontSize: 11 },
    phoneCardBadge: { backgroundColor: colors.voltage, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    phoneCardBadgeText: { color: colors.charcoal[900], fontSize: 9, fontWeight: '800' },

    // SECTIONS
    section: { padding: spacing.xl, paddingVertical: spacing.xl * 2 },
    sectionAlt: { backgroundColor: colors.charcoal[800] },
    sectionLabel: { color: colors.voltage, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.sm, textAlign: 'center' },
    sectionTitle: { fontSize: isLargeScreen ? 40 : 30, fontWeight: '800', color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
    sectionSubtitle: { fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl, maxWidth: 600, alignSelf: 'center' },
    accent: { color: colors.voltage },

    // FEATURES
    featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
    featureCard: { width: isLargeScreen ? '30%' : '100%', maxWidth: 360 },
    featureCardInner: { backgroundColor: colors.charcoal[800], borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: colors.charcoal[600] },
    featureCardHover: { borderColor: `${colors.voltage}50`, transform: [{ translateY: -4 }], ...(isWeb && { boxShadow: '0 8px 30px rgba(0,0,0,0.3)' } as any) },
    featureIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    featureEmoji: { fontSize: 26 },
    featureTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
    featureDesc: { fontSize: 14, color: colors.text.secondary, lineHeight: 22 },

    // STEPS
    stepsGrid: { flexDirection: isLargeScreen ? 'row' : 'column', gap: spacing.lg, justifyContent: 'center' },
    stepCard: { flex: isLargeScreen ? 1 : undefined, alignItems: 'center', paddingHorizontal: spacing.md },
    stepNum: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.charcoal[900], borderWidth: 2, borderColor: colors.voltage, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, ...(isWeb && { boxShadow: '0 0 20px rgba(255,214,10,0.2)' } as any) },
    stepNumText: { fontSize: 20, fontWeight: '800', color: colors.voltage },
    stepTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm, textAlign: 'center' },
    stepDesc: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },

    // PLANS
    plansRow: { flexDirection: isLargeScreen ? 'row' : 'column', gap: spacing.lg, justifyContent: 'center', alignItems: 'stretch' },
    planCard: { flex: isLargeScreen ? 1 : undefined, maxWidth: 380, backgroundColor: colors.charcoal[900], borderRadius: 24, padding: spacing.xl, borderWidth: 1, borderColor: colors.charcoal[600] },
    planCardGold: { borderColor: colors.voltage, ...(isWeb && { boxShadow: '0 0 40px rgba(255,214,10,0.15)' } as any), transform: isLargeScreen ? [{ translateY: -16 }] : [] },
    popularBadge: { position: 'absolute', top: -12, left: '50%', marginLeft: -60, backgroundColor: colors.voltage, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    popularBadgeText: { color: colors.charcoal[900], fontSize: 11, fontWeight: '800' },
    planType: { color: colors.text.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    planTypeGold: { color: colors.voltage, fontSize: 12, fontWeight: '700' },
    planName: { fontSize: 26, fontWeight: '800', color: colors.text.primary, marginTop: 8 },
    planNameGold: { fontSize: 26, fontWeight: '800', color: colors.text.primary, marginTop: 8 },
    planPrice: { fontSize: 36, fontWeight: '800', color: colors.voltage, marginTop: spacing.md },
    planPriceUnit: { fontSize: 16, color: colors.text.secondary, fontWeight: '400' },
    planPriceGold: { fontSize: 36, fontWeight: '800', color: colors.text.primary, marginTop: spacing.md },
    planPriceUnitGold: { fontSize: 16, color: colors.text.secondary, fontWeight: '400' },
    planFeature: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
    checkMark: { color: colors.text.secondary, fontSize: 14, marginRight: spacing.sm },
    checkMarkGold: { color: colors.voltage, fontSize: 14, marginRight: spacing.sm },
    planFeatureText: { color: colors.text.secondary, fontSize: 14 },
    planFeatureTextGold: { color: colors.text.primary, fontSize: 14, fontWeight: '500' },
    planBtnSecondary: { marginTop: spacing.xl, padding: spacing.md, borderRadius: 14, backgroundColor: colors.charcoal[700], alignItems: 'center', borderWidth: 1, borderColor: colors.charcoal[600] },
    planBtnSecondaryText: { color: colors.text.primary, fontWeight: '600' },
    planBtnPrimary: { marginTop: spacing.xl, padding: spacing.md, borderRadius: 14, backgroundColor: colors.voltage, alignItems: 'center' },
    planBtnPrimaryText: { color: colors.charcoal[900], fontWeight: '700' },

    // TESTIMONIALS
    testimonialsGrid: { flexDirection: isLargeScreen ? 'row' : 'column', gap: spacing.lg },
    testimonialCard: { flex: 1, backgroundColor: colors.charcoal[800], borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: colors.charcoal[600], position: 'relative' },
    quoteIcon: { position: 'absolute', top: 16, right: 20 },
    quoteIconText: { fontSize: 36, color: colors.charcoal[600] },
    starsRow: { flexDirection: 'row', marginBottom: spacing.md },
    star: { fontSize: 14 },
    testimonialText: { fontSize: 15, color: colors.text.primary, lineHeight: 24, marginBottom: spacing.lg },
    testimonialAuthor: { flexDirection: 'row', alignItems: 'center' },
    testimonialAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.charcoal[700], justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
    testimonialAvatarText: { color: colors.text.primary, fontWeight: '700' },
    testimonialName: { color: colors.text.primary, fontWeight: '700' },
    testimonialRole: { color: colors.text.secondary, fontSize: 12 },

    // DOWNLOAD CTA
    downloadSection: { backgroundColor: colors.voltage, padding: spacing.xl * 2, alignItems: 'center' },
    downloadTitle: { fontSize: isLargeScreen ? 44 : 32, fontWeight: '900', color: colors.charcoal[900], textAlign: 'center', marginBottom: spacing.md },
    downloadSubtitle: { fontSize: 18, color: 'rgba(0,0,0,0.7)', textAlign: 'center', marginBottom: spacing.xl },
    storeButtons: { flexDirection: isLargeScreen ? 'row' : 'column', gap: spacing.md },
    storeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.charcoal[900], paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 12 },
    storeBtnPressed: { transform: [{ scale: 0.97 }] },
    storeIcon: { fontSize: 24 },
    storeLabel: { fontSize: 10, color: colors.text.secondary },
    storeName: { fontSize: 16, color: colors.text.primary, fontWeight: '700' },

    // FOOTER
    footer: { backgroundColor: colors.charcoal[900], borderTopWidth: 1, borderTopColor: colors.charcoal[600], padding: spacing.xl },
    footerTop: { flexDirection: isLargeScreen ? 'row' : 'column', gap: spacing.xl, marginBottom: spacing.xl },
    footerBrand: { flex: 1 },
    footerLogo: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    footerLogoIcon: { fontSize: 20, marginRight: 8 },
    footerLogoText: { fontSize: 20, fontWeight: '800', color: colors.text.primary },
    footerDesc: { color: colors.text.secondary, fontSize: 14, lineHeight: 22, marginBottom: spacing.md },
    footerContact: { color: colors.text.secondary, fontSize: 13, lineHeight: 22 },
    footerLinks: { flexDirection: 'row', gap: spacing.xl },
    footerCol: {},
    footerColTitle: { color: colors.text.primary, fontWeight: '700', marginBottom: spacing.md },
    footerLink: { color: colors.text.secondary, fontSize: 14, marginBottom: spacing.sm },
    footerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.charcoal[600], paddingTop: spacing.lg },
    footerCopyright: { color: colors.charcoal[600], fontSize: 13 },
    socialIcons: { flexDirection: 'row', gap: spacing.md },
    socialIcon: { color: colors.charcoal[600], fontSize: 18 },
});
