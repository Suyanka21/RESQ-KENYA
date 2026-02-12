// ⚡ ResQ Kenya - Emergency Command Center Dashboard
// 3-State Bottom Sheet + Smart Intent Bar + Floating SOS
// Bolt-inspired premium dark command center

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Animated,
    Dimensions, Platform, Modal, TextInput, PanResponder,
    type GestureResponderEvent, type PanResponderGestureState,
} from 'react-native';
import { router } from 'expo-router';
import {
    Menu, Bell, Crosshair, MapPin, X, Home, Clock, CreditCard,
    Settings, HelpCircle, LogOut, ChevronRight, Shield, Search,
    Zap, Fuel, Battery, Disc, Activity, HeartPulse, Truck,
    Wallet as WalletIcon, Car, History, ShieldAlert, Star, Users
} from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, touchTargets, typography } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Sheet snap points (from bottom)
const SHEET_EXPANDED = height * 0.60;  // 60% — Emergency Hub
const SHEET_HALF = height * 0.40;      // 40% — Hybrid Context
const SHEET_COLLAPSED = 80;            // 80px — Operational Map
const SNAP_POINTS = [SHEET_COLLAPSED, SHEET_HALF, SHEET_EXPANDED];

// Service definitions
const SERVICES = [
    { id: 'towing', name: 'Towing', icon: Truck, color: '#FFA500', bg: 'rgba(255, 165, 0, 0.12)', keywords: ['tow', 'flatbed', 'stuck'] },
    { id: 'fuel', name: 'Fuel', icon: Fuel, color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.12)', keywords: ['fuel', 'petrol', 'diesel', 'gas'] },
    { id: 'battery', name: 'Battery', icon: Battery, color: '#FFA500', bg: 'rgba(255, 165, 0, 0.12)', keywords: ['battery', 'jump', 'jumpstart', 'dead'] },
    { id: 'tire', name: 'Tire', icon: Disc, color: '#9C27B0', bg: 'rgba(156, 39, 176, 0.12)', keywords: ['tire', 'tyre', 'flat', 'puncture'] },
    { id: 'diagnostics', name: 'Diagnostics', icon: Activity, color: '#2196F3', bg: 'rgba(33, 150, 243, 0.12)', keywords: ['scan', 'diagnos', 'check', 'engine'] },
    { id: 'medical', name: 'Ambulance', icon: HeartPulse, color: '#FF3D3D', bg: 'rgba(255, 61, 61, 0.12)', keywords: ['ambulance', 'medical', 'emergency', 'hospital'] },
];

// Sidebar nav items
const NAV_ITEMS = [
    { icon: WalletIcon, label: 'ResQ Wallet', sublabel: 'KES 2,450', route: '/(customer)/wallet', active: false },
    { icon: Car, label: 'My Garage', sublabel: 'Digital Glovebox', route: '/(customer)/profile', active: false },
    { icon: History, label: 'Service History', route: '/(customer)/history', active: false },
    { icon: ShieldAlert, label: 'Emergency Safety Hub', route: '/(customer)/help', active: false },
];

// Provider markers scattered across "Nairobi"
const PROVIDER_MARKERS = [
    { top: '22%', left: '18%' }, { top: '35%', left: '72%' },
    { top: '52%', left: '28%' }, { top: '68%', left: '82%' },
    { top: '28%', left: '55%' }, { top: '75%', left: '40%' },
    { top: '40%', left: '12%' }, { top: '58%', left: '65%' },
];

// ============================================================================
// DARK MAP COMPONENT
// ============================================================================
const DarkMap = () => (
    <View style={mapStyles.container}>
        {/* Road grid */}
        <View style={mapStyles.gridOverlay}>
            {[...Array(8)].map((_, i) => (
                <View key={`h${i}`} style={[mapStyles.gridLine, { top: `${10 + i * 12}%` }]} />
            ))}
            {[...Array(5)].map((_, i) => (
                <View key={`v${i}`} style={[mapStyles.gridLineV, { left: `${15 + i * 18}%` }]} />
            ))}
        </View>

        {/* Provider markers (Voltage Orange) */}
        {PROVIDER_MARKERS.map((pos, i) => (
            <View key={`p${i}`} style={[mapStyles.providerMarker, { top: pos.top as any, left: pos.left as any }]}>
                <View style={mapStyles.providerDot} />
            </View>
        ))}

        {/* User location marker (center) */}
        <View style={mapStyles.userMarker}>
            <View style={mapStyles.userPulseOuter} />
            <View style={mapStyles.userPulseInner} />
            <View style={mapStyles.userDot}>
                <View style={mapStyles.userDotCore} />
            </View>
            <View style={mapStyles.userLabel}>
                <Text style={mapStyles.userLabelText}>You are here</Text>
            </View>
        </View>
    </View>
);

// ============================================================================
// SIDEBAR DRAWER
// ============================================================================
const SidebarDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const slideAnim = useRef(new Animated.Value(-280)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 180,
                    friction: 12,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: -280,
                    tension: 180,
                    friction: 12,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    return (
        <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[sidebarStyles.backdrop, { opacity: backdropAnim }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>
            <Animated.View style={[sidebarStyles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                {/* Header */}
                <View style={sidebarStyles.header}>
                    <View style={sidebarStyles.headerTop}>
                        <View style={sidebarStyles.brandRow}>
                            <View style={sidebarStyles.brandIcon}>
                                <Zap size={16} color={colors.background.primary} strokeWidth={3} fill={colors.background.primary} />
                            </View>
                            <Text style={sidebarStyles.brandName}>ResQ</Text>
                        </View>
                        <Pressable onPress={onClose} style={sidebarStyles.closeBtn}
                            accessibilityLabel="Close menu" accessibilityRole="button">
                            <X size={20} color={colors.text.secondary} strokeWidth={2} />
                        </Pressable>
                    </View>

                    {/* User Profile with Safety Rating */}
                    <View style={sidebarStyles.userProfile}>
                        <View style={sidebarStyles.avatar}>
                            <Text style={sidebarStyles.avatarText}>JM</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={sidebarStyles.userName}>John Mwangi</Text>
                            <View style={sidebarStyles.ratingRow}>
                                <Star size={14} color={colors.voltage} fill={colors.voltage} />
                                <Text style={sidebarStyles.ratingValue}>4.74</Text>
                                <Text style={sidebarStyles.ratingLabel}>Safety Rating</Text>
                            </View>
                        </View>
                    </View>
                    <Pressable
                        onPress={() => { onClose(); router.push('/(customer)/profile'); }}
                        style={sidebarStyles.viewProfileLink}
                        accessibilityLabel="View profile" accessibilityRole="button">
                        <Text style={sidebarStyles.viewProfileText}>View Profile</Text>
                        <ChevronRight size={14} color={colors.text.secondary} />
                    </Pressable>
                </View>

                {/* Nav Items */}
                <ScrollView style={sidebarStyles.navList} showsVerticalScrollIndicator={false}>
                    {NAV_ITEMS.map((item) => (
                        <Pressable key={item.label}
                            style={({ pressed }) => [sidebarStyles.navItem, pressed && { backgroundColor: 'rgba(255,165,0,0.06)' }]}
                            onPress={() => { onClose(); router.push(item.route as any); }}
                            accessibilityLabel={item.label} accessibilityRole="button">
                            <View style={sidebarStyles.navItemLeft}>
                                <View style={sidebarStyles.navIconWrap}>
                                    <item.icon size={20} color={colors.voltage} strokeWidth={2} />
                                </View>
                                <View>
                                    <Text style={sidebarStyles.navLabel}>{item.label}</Text>
                                    {item.sublabel && (
                                        <Text style={sidebarStyles.navSublabel}>{item.sublabel}</Text>
                                    )}
                                </View>
                            </View>
                            <ChevronRight size={16} color={colors.text.tertiary} />
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Provider CTA Banner — Glassmorphism */}
                <View style={sidebarStyles.ctaBanner}>
                    <View style={sidebarStyles.ctaGlow} />
                    <Users size={20} color="#0F0F0F" strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                        <Text style={sidebarStyles.ctaTitle}>Join the ResQ Provider Network</Text>
                        <Text style={sidebarStyles.ctaSub}>Earn by helping drivers in need</Text>
                    </View>
                    <ChevronRight size={16} color="#0F0F0F" />
                </View>

                {/* Footer */}
                <View style={sidebarStyles.footer}>
                    <Pressable style={({ pressed }) => [sidebarStyles.logoutBtn, pressed && { backgroundColor: 'rgba(255,61,61,0.1)' }]}
                        onPress={() => { onClose(); router.replace('/'); }}
                        accessibilityLabel="Sign out" accessibilityRole="button">
                        <LogOut size={20} color={colors.status.error} strokeWidth={2} />
                        <Text style={sidebarStyles.logoutText}>Sign Out</Text>
                    </Pressable>
                    <Text style={sidebarStyles.versionText}>Version 2.5.0</Text>
                </View>
            </Animated.View>
        </Modal>
    );
};

// ============================================================================
// SMART INTENT BAR
// ============================================================================
const SmartIntentBar = ({ onServiceMatch }: { onServiceMatch: (serviceId: string) => void }) => {
    const [query, setQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTextChange = useCallback((text: string) => {
        setQuery(text);

        // Clear any pending debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const lower = text.toLowerCase().trim();
        if (lower.length < 4) return;

        // Wait 600ms after user stops typing before matching
        debounceRef.current = setTimeout(() => {
            for (const svc of SERVICES) {
                if (svc.keywords.some(kw => lower.includes(kw))) {
                    setQuery('');
                    onServiceMatch(svc.id);
                    return;
                }
            }
        }, 600);
    }, [onServiceMatch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <View style={intentStyles.container}>
            <View style={intentStyles.searchIcon}>
                <Search size={18} color={colors.text.tertiary} strokeWidth={2} />
            </View>
            <TextInput
                style={intentStyles.input}
                value={query}
                onChangeText={handleTextChange}
                placeholder="What do you need? (e.g., Towing, Jumpstart)"
                placeholderTextColor={colors.text.tertiary}
                returnKeyType="search"
                accessibilityLabel="Search for emergency service"
            />
        </View>
    );
};

// ============================================================================
// BENTO SERVICE GRID (Expanded State)
// ============================================================================
const BentoGrid = ({ onSelect }: { onSelect: (id: string) => void }) => (
    <View style={bentoStyles.grid}>
        {SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
                <Pressable key={svc.id}
                    style={({ pressed }) => [
                        bentoStyles.card,
                        pressed && bentoStyles.cardPressed,
                    ]}
                    onPress={() => onSelect(svc.id)}
                    accessibilityLabel={`Request ${svc.name} service`}
                    accessibilityRole="button">
                    <View style={[bentoStyles.iconWrap, { backgroundColor: svc.bg }]}>
                        <Icon size={28} color={svc.color} strokeWidth={2} />
                    </View>
                    <Text style={bentoStyles.label}>{svc.name}</Text>
                </Pressable>
            );
        })}
    </View>
);

// ============================================================================
// HORIZONTAL ICON ROW (Half State)
// ============================================================================
const IconRow = ({ onSelect }: { onSelect: (id: string) => void }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={rowStyles.scroll}>
        {SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
                <Pressable key={svc.id}
                    style={({ pressed }) => [
                        rowStyles.item,
                        pressed && rowStyles.itemPressed,
                    ]}
                    onPress={() => onSelect(svc.id)}
                    accessibilityLabel={`Request ${svc.name}`}
                    accessibilityRole="button">
                    <View style={[rowStyles.iconCircle, { backgroundColor: svc.bg }]}>
                        <Icon size={22} color={svc.color} strokeWidth={2} />
                    </View>
                    <Text style={rowStyles.label}>{svc.name}</Text>
                </Pressable>
            );
        })}
    </ScrollView>
);

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function DashboardScreen() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sheetHeight = useRef(new Animated.Value(SHEET_EXPANDED)).current;
    const [sheetState, setSheetState] = useState<'expanded' | 'half' | 'collapsed'>('expanded');

    // SOS glow animation
    const sosGlow = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(sosGlow, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
                Animated.timing(sosGlow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Snap to nearest point
    const snapTo = useCallback((target: number) => {
        Animated.spring(sheetHeight, {
            toValue: target,
            tension: 180,
            friction: 16,
            useNativeDriver: false,
        }).start();

        if (target >= SHEET_EXPANDED - 20) setSheetState('expanded');
        else if (target >= SHEET_HALF - 20) setSheetState('half');
        else setSheetState('collapsed');
    }, []);

    // Find nearest snap point
    const findNearestSnap = useCallback((currentHeight: number) => {
        let nearest = SNAP_POINTS[0];
        let minDist = Math.abs(currentHeight - nearest);
        for (const sp of SNAP_POINTS) {
            const dist = Math.abs(currentHeight - sp);
            if (dist < minDist) {
                minDist = dist;
                nearest = sp;
            }
        }
        return nearest;
    }, []);

    // PanResponder for dragging
    const lastHeight = useRef(SHEET_EXPANDED);
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
            onPanResponderGrant: () => {
                // Capture the current animated value
                sheetHeight.stopAnimation((value) => {
                    lastHeight.current = value;
                });
            },
            onPanResponderMove: (_, gs: PanResponderGestureState) => {
                const newHeight = Math.max(
                    SHEET_COLLAPSED,
                    Math.min(SHEET_EXPANDED, lastHeight.current - gs.dy)
                );
                sheetHeight.setValue(newHeight);
            },
            onPanResponderRelease: (_, gs: PanResponderGestureState) => {
                const currentHeight = lastHeight.current - gs.dy;
                // Velocity-aware snapping
                if (Math.abs(gs.vy) > 0.5) {
                    // Fast fling — snap in direction of fling
                    if (gs.vy > 0) {
                        // Swiping down
                        const below = SNAP_POINTS.filter(sp => sp < currentHeight);
                        snapTo(below.length > 0 ? below[below.length - 1] : SNAP_POINTS[0]);
                    } else {
                        // Swiping up
                        const above = SNAP_POINTS.filter(sp => sp > currentHeight);
                        snapTo(above.length > 0 ? above[0] : SNAP_POINTS[SNAP_POINTS.length - 1]);
                    }
                } else {
                    snapTo(findNearestSnap(currentHeight));
                }
            },
        })
    ).current;

    // Navigate to service form
    const handleSelectService = useCallback((serviceId: string) => {
        router.push({
            pathname: '/(customer)/request/[service]',
            params: { service: serviceId },
        });
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <SidebarDrawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Full-screen Dark Map */}
            <View style={StyleSheet.absoluteFill}>
                <DarkMap />
            </View>

            {/* Top Bar Overlay */}
            <View style={styles.topBar}>
                <Pressable style={styles.topBtn}
                    onPress={() => setIsSidebarOpen(true)}
                    accessibilityLabel="Open menu" accessibilityRole="button">
                    <Menu size={22} color={colors.text.primary} strokeWidth={2} />
                </Pressable>
                <View style={styles.topRight}>
                    <Pressable style={styles.topBtn}
                        accessibilityLabel="Notifications" accessibilityRole="button">
                        <Bell size={22} color={colors.text.primary} strokeWidth={2} />
                        <View style={styles.notifDot} />
                    </Pressable>
                    <Pressable style={styles.topBtnProfile}
                        onPress={() => router.push('/(customer)/profile')}
                        accessibilityLabel="Profile" accessibilityRole="button">
                        <Text style={styles.profileInitials}>JM</Text>
                    </Pressable>
                </View>
            </View>

            {/* Floating SOS Button */}
            <View style={styles.sosArea}>
                <Animated.View style={[styles.sosGlow, { opacity: sosGlow }]} />
                <Pressable
                    style={({ pressed }) => [
                        styles.sosButton,
                        pressed && { transform: [{ scale: 0.92 }] },
                    ]}
                    accessibilityLabel="Emergency SOS"
                    accessibilityRole="button">
                    <Text style={styles.sosText}>SOS</Text>
                </Pressable>
            </View>

            {/* Location FAB */}
            <Pressable style={styles.locationFab}
                accessibilityLabel="Center on location" accessibilityRole="button">
                <Crosshair size={20} color={colors.background.primary} strokeWidth={2.5} />
            </Pressable>

            {/* 3-State Bottom Sheet */}
            <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
                {/* Drag Handle */}
                <View {...panResponder.panHandlers} style={styles.handleZone}>
                    <View style={styles.handleBar} />
                </View>

                {/* Smart Intent Bar (always visible) */}
                <View style={styles.intentWrap}>
                    <SmartIntentBar onServiceMatch={handleSelectService} />
                </View>

                {/* Expanded State: Bento Grid */}
                {sheetState === 'expanded' && (
                    <ScrollView showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 32 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Emergency Services</Text>
                            <Text style={styles.sectionSub}>Select the help you need</Text>
                        </View>
                        <BentoGrid onSelect={handleSelectService} />
                    </ScrollView>
                )}

                {/* Half State: Horizontal Icon Row */}
                {sheetState === 'half' && (
                    <View style={{ marginTop: 8 }}>
                        <IconRow onSelect={handleSelectService} />
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

// ============================================================================
// MAP STYLES
// ============================================================================
const mapStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.06,
    },
    gridLine: {
        position: 'absolute',
        left: 0, right: 0,
        height: 1,
        backgroundColor: '#3D3D3D',
    },
    gridLineV: {
        position: 'absolute',
        top: 0, bottom: 0,
        width: 1,
        backgroundColor: '#3D3D3D',
    },
    providerMarker: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 165, 0, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.voltage,
    },
    userMarker: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        marginLeft: -20,
        marginTop: -20,
        alignItems: 'center',
    },
    userPulseOuter: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 165, 0, 0.08)',
        left: -16,
        top: -16,
    },
    userPulseInner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 165, 0, 0.15)',
    },
    userDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0F0F0F',
        borderWidth: 4,
        borderColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userDotCore: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.voltage,
    },
    userLabel: {
        marginTop: 8,
        backgroundColor: 'rgba(15, 15, 15, 0.9)',
        borderWidth: 1,
        borderColor: '#2E2E2E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    userLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

// ============================================================================
// SIDEBAR STYLES
// ============================================================================
const sidebarStyles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    drawer: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0,
        width: 280,
        backgroundColor: '#0F0F0F',
        borderRightWidth: 1,
        borderRightColor: '#2E2E2E',
    },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        borderBottomWidth: 1,
        borderBottomColor: '#2E2E2E',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 8,
        borderRadius: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#252525',
        borderWidth: 1,
        borderColor: '#3D3D3D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.voltage,
    },
    ratingLabel: {
        fontSize: 11,
        color: colors.text.secondary,
        marginLeft: 2,
    },
    viewProfileLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 12,
        paddingLeft: 8,
    },
    viewProfileText: {
        fontSize: 13,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    navList: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 4,
    },
    navItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    navIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    navSublabel: {
        fontSize: 11,
        color: colors.text.tertiary,
        marginTop: 1,
    },
    ctaBanner: {
        marginHorizontal: 12,
        marginBottom: 8,
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.voltage,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        overflow: 'hidden',
    },
    ctaGlow: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    ctaTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F0F0F',
    },
    ctaSub: {
        fontSize: 11,
        color: 'rgba(15, 15, 15, 0.65)',
        marginTop: 1,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#2E2E2E',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FF3D3D',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 10,
        color: '#6B6B6B',
        marginTop: 16,
    },
});

// ============================================================================
// INTENT BAR STYLES
// ============================================================================
const intentStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2E2E2E',
        height: 48,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#FFFFFF',
        height: 48,
        paddingVertical: 0,
    },
});

// ============================================================================
// BENTO GRID STYLES
// ============================================================================
const CARD_WIDTH = (width - 24 * 2 - 12) / 2;  // 2 columns, 24px padding, 12px gap

const bentoStyles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 24,
    },
    card: {
        width: CARD_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2E2E2E',
        backgroundColor: 'rgba(26, 26, 26, 0.7)',
    },
    cardPressed: {
        borderColor: 'rgba(255, 165, 0, 0.5)',
        backgroundColor: '#252525',
        transform: [{ scale: 0.96 }],
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#A0A0A0',
    },
});

// ============================================================================
// HORIZONTAL ROW STYLES
// ============================================================================
const rowStyles = StyleSheet.create({
    scroll: {
        paddingHorizontal: 24,
        gap: 16,
    },
    item: {
        alignItems: 'center',
        width: 64,
    },
    itemPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.92 }],
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#2E2E2E',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#A0A0A0',
        textAlign: 'center',
    },
});

// ============================================================================
// MAIN STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F0F',
    },

    // Top Bar
    topBar: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 30,
    },
    topBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        borderWidth: 1,
        borderColor: '#2E2E2E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topRight: {
        flexDirection: 'row',
        gap: 8,
    },
    notifDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.voltage,
        borderWidth: 2,
        borderColor: '#1A1A1A',
    },
    topBtnProfile: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitials: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F0F0F',
    },

    // SOS
    sosArea: {
        position: 'absolute',
        right: 20,
        bottom: SHEET_EXPANDED + 24,
        zIndex: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF3D3D',
    },
    sosButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF3D3D',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 61, 61, 0.3)',
        ...shadows.emergencyGlow,
    },
    sosText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 3,
    },

    // Location FAB
    locationFab: {
        position: 'absolute',
        right: 20,
        bottom: SHEET_EXPANDED + 116,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 25,
        ...shadows.button,
    },

    // Bottom Sheet
    sheet: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(15, 15, 15, 0.92)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderTopColor: '#2E2E2E',
        zIndex: 20,
        overflow: 'hidden',
    },
    handleZone: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 6,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#3D3D3D',
    },

    // Intent bar wrapper
    intentWrap: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },

    // Section header
    sectionHeader: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    sectionSub: {
        fontSize: 13,
        color: '#6B6B6B',
    },
});
