// ⚡ ResQ Kenya - Emergency Command Center Dashboard
// 3-State Bottom Sheet + Smart Intent Bar + Floating SOS
// Refactored: theme tokens, extracted components, centralized SERVICE_CATALOG
// Audit fixes: F-MED-2 (service data duplication), F-HIGH-1 (battery color)

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, Animated,
    Dimensions, Platform, TextInput, PanResponder,
    type PanResponderGestureState,
} from 'react-native';
import { router } from 'expo-router';
import { Menu, Bell, Crosshair, Search } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography, touchTargets } from '../../theme/voltage-premium';
import { StatusBar } from 'expo-status-bar';
import { SERVICE_LIST } from '../../constants/services';
import { SidebarDrawer } from '../../components/dashboard/SidebarDrawer';

const { width, height } = Dimensions.get('window');

// Sheet snap points (from bottom)
const SHEET_EXPANDED = height * 0.60;
const SHEET_HALF = height * 0.40;
const SHEET_COLLAPSED = 80;
const SNAP_POINTS = [SHEET_COLLAPSED, SHEET_HALF, SHEET_EXPANDED];

// Phase 4 (audit-v3 §MOCK-SWEEP) — the previous PROVIDER_MARKERS array
// painted eight fake dots onto the dark-map background, suggesting
// provider coverage that does not actually exist. For a fresh account
// the correct state is an empty map; a follow-up wires real markers
// from a future `subscribeToNearbyProviders(location)` service. The
// DarkMap component below still renders the grid + "You are here"
// puck, which is honest about what we know (the user is here, we are
// not yet showing where any provider is).
const PROVIDER_MARKERS: { top: string; left: string }[] = [];

// ============================================================================
// DARK MAP COMPONENT
// ============================================================================
const DarkMap = () => (
    <View style={mapStyles.container}>
        <View style={mapStyles.gridOverlay}>
            {[...Array(8)].map((_, i) => (
                <View key={`h${i}`} style={[mapStyles.gridLine, { top: `${10 + i * 12}%` }]} />
            ))}
            {[...Array(5)].map((_, i) => (
                <View key={`v${i}`} style={[mapStyles.gridLineV, { left: `${15 + i * 18}%` }]} />
            ))}
        </View>

        {PROVIDER_MARKERS.map((pos, i) => (
            <View key={`p${i}`} style={[mapStyles.providerMarker, { top: pos.top as any, left: pos.left as any }]}>
                <View style={mapStyles.providerDot} />
            </View>
        ))}

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
// SMART INTENT BAR
// ============================================================================
const SmartIntentBar = ({ onServiceMatch }: { onServiceMatch: (id: string) => void }) => {
    const [query, setQuery] = useState('');

    const handleChange = (text: string) => {
        setQuery(text);
        const lower = text.toLowerCase().trim();
        if (lower.length < 2) return;

        for (const svc of SERVICE_LIST) {
            if (svc.keywords.some(kw => lower.includes(kw))) {
                onServiceMatch(svc.id);
                setQuery('');
                return;
            }
        }
    };

    return (
        <View style={intentStyles.container}>
            <Search size={18} color={colors.text.tertiary} style={intentStyles.searchIcon} />
            <TextInput
                style={intentStyles.input}
                placeholder="What do you need help with?"
                placeholderTextColor={colors.text.tertiary}
                value={query}
                onChangeText={handleChange}
                returnKeyType="search"
                accessibilityLabel="Search for service"
            />
        </View>
    );
};

// ============================================================================
// BENTO GRID (Expanded State)
// ============================================================================
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md - 4) / 2;

const BentoGrid = ({ onSelect }: { onSelect: (id: string) => void }) => (
    <View style={bentoStyles.grid}>
        {SERVICE_LIST.map((svc) => {
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
        {SERVICE_LIST.map((svc) => {
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
                if (Math.abs(gs.vy) > 0.5) {
                    if (gs.vy > 0) {
                        const below = SNAP_POINTS.filter(sp => sp < currentHeight);
                        snapTo(below.length > 0 ? below[below.length - 1] : SNAP_POINTS[0]);
                    } else {
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

            {/* Floating SOS Button — primary action, ≥80px touch target */}
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
                <Crosshair size={20} color={colors.text.onBrand} strokeWidth={2.5} />
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
                        contentContainerStyle={{ paddingBottom: spacing.xl }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Emergency Services</Text>
                            <Text style={styles.sectionSub}>Select the help you need</Text>
                        </View>
                        <BentoGrid onSelect={handleSelectService} />
                    </ScrollView>
                )}

                {/* Half State: Horizontal Icon Row */}
                {sheetState === 'half' && (
                    <View style={{ marginTop: spacing.sm }}>
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
        backgroundColor: colors.background.primary,
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.06,
    },
    gridLine: {
        position: 'absolute',
        left: 0, right: 0,
        height: 1,
        backgroundColor: colors.charcoal[500],
    },
    gridLineV: {
        position: 'absolute',
        top: 0, bottom: 0,
        width: 1,
        backgroundColor: colors.charcoal[500],
    },
    providerMarker: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${colors.voltage}26`,
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
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${colors.status.info}15`,
    },
    userPulseInner: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${colors.status.info}25`,
        top: spacing.sm,
    },
    userDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.status.info,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        borderWidth: 3,
        borderColor: colors.text.primary,
    },
    userDotCore: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.text.primary,
    },
    userLabel: {
        marginTop: spacing.sm,
        backgroundColor: colors.background.secondary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    userLabelText: {
        fontSize: 10,
        color: colors.text.secondary,
        fontWeight: typography.fontWeight.medium as any,
    },
});

// ============================================================================
// INTENT BAR STYLES
// ============================================================================
const intentStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.background.border,
        height: touchTargets.standard,
        paddingHorizontal: spacing.md - 4,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        color: colors.text.primary,
        height: touchTargets.standard,
        paddingVertical: 0,
    },
});

// ============================================================================
// BENTO GRID STYLES
// ============================================================================
const bentoStyles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md - 4,
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: CARD_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.lg,
        borderRadius: borderRadius['2xl'] - 4,
        borderWidth: 1,
        borderColor: colors.background.border,
        backgroundColor: `${colors.background.secondary}B3`,
    },
    cardPressed: {
        borderColor: `${colors.voltage}80`,
        backgroundColor: colors.background.tertiary,
        transform: [{ scale: 0.96 }],
    },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm + 2,
    },
    label: {
        fontSize: 13,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.secondary,
    },
});

// ============================================================================
// HORIZONTAL ROW STYLES
// ============================================================================
const rowStyles = StyleSheet.create({
    scroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
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
        width: touchTargets.standard,
        height: touchTargets.standard,
        borderRadius: touchTargets.standard / 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs + 2,
        borderWidth: 1,
        borderColor: colors.background.border,
    },
    label: {
        fontSize: 11,
        fontWeight: typography.fontWeight.semibold as any,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});

// ============================================================================
// MAIN STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
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
        width: touchTargets.minimum,
        height: touchTargets.minimum,
        borderRadius: borderRadius.xl - 2,
        backgroundColor: `${colors.background.secondary}E6`,
        borderWidth: 1,
        borderColor: colors.background.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topRight: {
        flexDirection: 'row',
        gap: spacing.sm,
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
        borderColor: colors.background.secondary,
    },
    topBtnProfile: {
        width: touchTargets.minimum,
        height: touchTargets.minimum,
        borderRadius: borderRadius.xl - 2,
        backgroundColor: colors.voltage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitials: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.onBrand,
    },

    // SOS — primary action, minimum 80px (touchTargets.sos)
    sosArea: {
        position: 'absolute',
        right: 20,
        bottom: SHEET_EXPANDED + spacing.lg,
        zIndex: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.status.error,
    },
    sosButton: {
        width: touchTargets.sos,
        height: touchTargets.sos,
        borderRadius: touchTargets.sos / 2,
        backgroundColor: colors.status.error,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: `${colors.status.error}4D`,
        ...shadows.emergencyGlow,
    },
    sosText: {
        fontSize: typography.fontSize.xl - 4,
        fontWeight: typography.fontWeight.extrabold as any,
        color: colors.text.primary,
        letterSpacing: 3,
    },

    // Location FAB
    locationFab: {
        position: 'absolute',
        right: 20,
        bottom: SHEET_EXPANDED + 116,
        width: touchTargets.minimum,
        height: touchTargets.minimum,
        borderRadius: touchTargets.minimum / 2,
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
        backgroundColor: `${colors.background.primary}EB`,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderTopColor: colors.background.border,
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
        backgroundColor: colors.charcoal[500],
    },

    // Intent bar wrapper
    intentWrap: {
        paddingHorizontal: 20,
        paddingBottom: spacing.sm,
    },

    // Section header
    sectionHeader: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md - 4,
    },
    sectionTitle: {
        fontSize: typography.mobile.subsection.size,
        fontWeight: typography.fontWeight.bold as any,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    sectionSub: {
        fontSize: 13,
        color: colors.text.tertiary,
    },
});
