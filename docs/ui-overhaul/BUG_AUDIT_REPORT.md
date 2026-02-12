# ResQ Kenya - Comprehensive Bug Audit Report

**Audit Date:** January 2026  
**Auditor:** Agent 2 (Bug Exterminator)  
**Design System Reference:** `design-system/MASTER.md`, `design-system/resq-kenya/MASTER.md`

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 12 |
| 🟡 Medium | 18 |
| 🔵 Low | 8 |
| **Total** | **41** |

### Top Issues
1. **Emoji Usage as Icons** - Violates design system rule: "Never use emojis as icons"
2. **Styling Inconsistency** - Mix of StyleSheet and NativeWind across app
3. **Non-functional Buttons/Links** - Multiple UI elements that don't trigger actions
4. **Static Mock Data** - All screens use hardcoded demo data

---

## 🔴 Critical Issues

### C-001: Inconsistent Styling Architecture
| Field | Details |
|-------|---------|
| **Files** | `app/(provider)/*.tsx`, `app/(customer)/request/*.tsx`, `app/(customer)/vehicles.tsx` |
| **Description** | Mix of NativeWind `className` and StyleSheet.create() across the app. NativeWind requires babel config and may not render correctly. |
| **Impact** | Styles may not apply on native devices; maintenance nightmare |
| **Severity** | 🔴 Critical |
| **Suggested Fix** | Standardize on StyleSheet.create() throughout OR properly configure NativeWind with babel preset in `babel.config.js` |

---

### C-002: SOS Button Size Below Accessibility Minimum
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:763-771` |
| **Description** | SOS button touch target is ~48px (via padding), but design system requires **80x80px minimum** for SOS buttons |
| **Impact** | Emergency button may be missed in crisis situations |
| **Severity** | 🔴 Critical |
| **Suggested Fix** | Update SOS button to `minHeight: 80, minWidth: 200` per design system |

---

### C-003: Photo/Camera Features Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:298-303` |
| **Description** | "Take Photo" and "Choose from Gallery" show toast "coming soon" instead of actual functionality |
| **Impact** | Users cannot update profile photos |
| **Severity** | 🔴 Critical |
| **Suggested Fix** | Implement expo-image-picker integration for camera/gallery |

---

## 🟠 High Severity Issues

### H-001: Emoji Icons Throughout App (Design System Violation)

Per design system: **"Never use emojis as icons. Always use Lucide React Native."**

| File | Line | Emoji | Should Replace With |
|------|------|-------|---------------------|
| `app/index.tsx` | ~185 | ⚡ (logo) | SVG bolt icon or brand logo |
| `app/(auth)/register.tsx` | ~88 | 👤 | Lucide `User` icon |
| `app/(customer)/wallet.tsx` | 14 | 💰 | Lucide `Wallet` icon |
| `app/(customer)/wallet.tsx` | 55 | ⭐ | Lucide `Star` icon |
| `app/(customer)/wallet.tsx` | 93 | ⚡ | Lucide `Zap` icon |
| `app/(customer)/profile.tsx` | 92 | ⚙️ | Lucide `Settings` icon |
| `app/(customer)/profile.tsx` | 105 | 👤 | Lucide `User` icon |
| `app/(customer)/profile.tsx` | 151 | 🚗 | Lucide `Car` icon |
| `app/(customer)/profile.tsx` | 158 | 🚙 | Lucide `Car` icon |
| `app/(customer)/profile.tsx` | 183 | 🔔 | Lucide `Bell` icon |
| `app/(customer)/profile.tsx` | 225 | 🆘 | Lucide `AlertCircle` icon |
| `app/(customer)/profile.tsx` | 250 | 💬 | Lucide `MessageCircle` icon |
| `app/(customer)/profile.tsx` | 274 | 🚪 | Lucide `LogOut` icon |
| `app/(customer)/history.tsx` | 63 | 📋 | Lucide `ClipboardList` icon |
| `app/(customer)/history.tsx` | 17-53 | 🚛⚡⛽🔧🔍 | Use `ServiceIcon` component |
| `app/(customer)/index.tsx` | 218 | 🚛 | `ServiceIcon` type="towing" |
| `app/(customer)/index.tsx` | 247 | 👤 | Lucide `User` icon |
| `app/(customer)/index.tsx` | 316 | 💳 | Lucide `CreditCard` icon |
| `app/(customer)/index.tsx` | 326 | 🚨 | Lucide `Siren` icon |
| `app/(customer)/index.tsx` | 388 | 🔍 | Lucide `Search` icon |
| `app/(customer)/index.tsx` | 407 | 👤 | Lucide `User` icon |
| `app/(customer)/index.tsx` | 412 | ⭐ | Lucide `Star` icon |
| `app/(customer)/index.tsx` | 422-428 | 📞💬📍 | Lucide `Phone`, `MessageCircle`, `MapPin` |
| `app/(provider)/index.tsx` | 111-200 | ✅💰📍⭐📋💵📊💬🔔 | Lucide equivalents |
| `app/(provider)/index.tsx` | 244-253 | 🚛🔧⚡⛽🔍🚑 | Use `ServiceIcon` component |

**Severity:** 🟠 High  
**Suggested Fix:** Replace all emojis with Lucide React Native icons or the existing `ServiceIcon` component for service types.

---

### H-002: Terms of Service / Privacy Policy Links Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(auth)/register.tsx:~270-280` |
| **Description** | Links to Terms of Service and Privacy Policy are just Text components, not clickable |
| **Impact** | Legal compliance issue; users can't review terms |
| **Severity** | 🟠 High |
| **Suggested Fix** | Wrap in `Pressable` with `Linking.openURL()` to actual policy pages |

---

### H-003: Wallet Top Up Button Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/wallet.tsx:32-34` |
| **Description** | "Top Up" button has no onPress handler |
| **Impact** | Core wallet functionality missing |
| **Severity** | 🟠 High |
| **Suggested Fix** | Implement M-Pesa STK push integration for top-up |

---

### H-004: Wallet History Button Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/wallet.tsx:35-37` |
| **Description** | "History" button has no onPress handler |
| **Impact** | Users can't view transaction history |
| **Severity** | 🟠 High |
| **Suggested Fix** | Navigate to history screen or show history modal |

---

### H-005: Add Payment Method Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/wallet.tsx:79-84` |
| **Description** | "Add Payment Method" has no onPress handler |
| **Impact** | Users can't add new payment methods |
| **Severity** | 🟠 High |
| **Suggested Fix** | Implement payment method addition flow |

---

### H-006: Upgrade to Platinum Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/wallet.tsx:110-112` |
| **Description** | "Upgrade to Platinum" button has no onPress handler |
| **Impact** | Users can't upgrade membership |
| **Severity** | 🟠 High |
| **Suggested Fix** | Implement membership upgrade flow |

---

### H-007: Support Menu Items Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:254-269` |
| **Description** | Help Center, Contact Support, Terms, Privacy links have no onPress handlers |
| **Impact** | Support inaccessible |
| **Severity** | 🟠 High |
| **Suggested Fix** | Add navigation or Linking.openURL() for each item |

---

### H-008: Profile Fields Non-editable
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:122-143` |
| **Description** | All profile fields (Name, Phone, Location) have `editable={false}` |
| **Impact** | Users cannot update their profile information |
| **Severity** | 🟠 High |
| **Suggested Fix** | Add edit mode toggle with save functionality |

---

### H-009: History Items Not Tappable
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/history.tsx:84-133` |
| **Description** | Order cards are Pressable but have no onPress navigation to details |
| **Impact** | Users can't view rescue details |
| **Severity** | 🟠 High |
| **Suggested Fix** | Navigate to order details screen on press |

---

### H-010: Provider Quick Actions Partially Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(provider)/index.tsx:193-202` |
| **Description** | "Stats" and "Support" buttons have no onPress handlers |
| **Impact** | Provider features incomplete |
| **Severity** | 🟠 High |
| **Suggested Fix** | Implement stats screen and support functionality |

---

### H-011: Message/Chat Button Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:424-426` |
| **Description** | Chat button (💬) in tracking view has no functionality |
| **Impact** | Users can't communicate with provider |
| **Severity** | 🟠 High |
| **Suggested Fix** | Implement in-app messaging or SMS integration |

---

### H-012: Track Button Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:436-438` |
| **Description** | "TRACK" button has no onPress handler |
| **Impact** | Redundant UI element |
| **Severity** | 🟠 High |
| **Suggested Fix** | Either remove or implement expanded tracking view |

---

## 🟡 Medium Severity Issues

### M-001: All Data is Static/Mock
| Field | Details |
|-------|---------|
| **Files** | All screens |
| **Description** | Wallet balance (KES 4,500), transactions, history, stats are hardcoded |
| **Impact** | App not production-ready |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Connect to Firebase/Supabase for real data |

---

### M-002: Development Mode OTP Bypass
| Field | Details |
|-------|---------|
| **File** | `app/(auth)/verify-otp.tsx` |
| **Description** | OTP "123456" always passes verification |
| **Impact** | Security vulnerability if not removed for production |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add `__DEV__` check or environment variable guard |

---

### M-003: Missing Loading States in Wallet
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/wallet.tsx` |
| **Description** | No loading indicators when fetching wallet data |
| **Impact** | Poor UX; users don't know if data is loading |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add loading skeleton or spinner |

---

### M-004: Missing Error States in Wallet
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/wallet.tsx` |
| **Description** | No error handling UI for failed data fetch |
| **Impact** | Users see stale/no data without explanation |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add error state with retry button |

---

### M-005: Missing Loading States in History
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/history.tsx` |
| **Description** | No loading indicators when fetching history |
| **Impact** | Poor UX |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add loading skeleton |

---

### M-006: Missing Error States in History
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/history.tsx` |
| **Description** | No error handling UI for failed data fetch |
| **Impact** | Poor UX |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add error state with retry button |

---

### M-007: Details Button Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:433-435` |
| **Description** | "DETAILS" button in tracking view has no onPress |
| **Impact** | Users can't see service details during tracking |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Show bottom sheet with service breakdown |

---

### M-008: Map Location Pin Button Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:427-429` |
| **Description** | Location pin button (📍) has no functionality |
| **Impact** | Users can't share/copy location |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Implement share location or copy coordinates |

---

### M-009: Missing Accessibility Labels on Buttons
| Field | Details |
|-------|---------|
| **Files** | Most screens |
| **Description** | Buttons lack `accessibilityLabel` and `accessibilityRole` |
| **Impact** | Screen reader users can't navigate |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add ARIA labels to all interactive elements |

---

### M-010: Profile Button in Header Non-functional
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:246-248` |
| **Description** | Profile button in map header has no onPress |
| **Impact** | Users can't access profile from map |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Navigate to profile screen |

---

### M-011: Back Button Goes to Wrong Route
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:237` |
| **Description** | Menu button uses `router.back()` which may exit app |
| **Impact** | Confusing navigation |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Replace with drawer/menu toggle or remove |

---

### M-012: Toast Uses Plain Emoji
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:60, 298-302` |
| **Description** | Toast notifications use emojis (✅, 📷, 🖼️) |
| **Impact** | Inconsistent with design system |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Use Lucide icons or remove emoji prefix |

---

### M-013: Modal Uses Emoji in Title
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:294, 315` |
| **Description** | Modal titles use emojis (📸, 🚗) |
| **Impact** | Design system violation |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Replace with Lucide icons |

---

### M-014: Fuel Type Toggle Uses Emojis
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:344, 350` |
| **Description** | Fuel type buttons use ⛽ and 🛢️ emojis |
| **Impact** | Design system violation |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Use Lucide `Fuel` icon or `ServiceIcon` |

---

### M-015: Provider Online Status Uses Emoji
| Field | Details |
|-------|---------|
| **File** | `app/(provider)/index.tsx:129` |
| **Description** | Status badge uses 🟢 and ⚫ circle emojis |
| **Impact** | Design system violation; may render differently across devices |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Use View with colored background |

---

### M-016: Missing Pull-to-Refresh on Lists
| Field | Details |
|-------|---------|
| **Files** | `history.tsx`, `wallet.tsx` |
| **Description** | ScrollViews don't have RefreshControl |
| **Impact** | Users can't manually refresh data |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add RefreshControl with refresh handler |

---

### M-017: Hardcoded Emergency Numbers
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:231-243` |
| **Description** | Emergency numbers (999, 112) hardcoded without call functionality |
| **Impact** | Numbers displayed but not callable |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Make tappable with `Linking.openURL('tel:999')` |

---

### M-018: Vehicle Delete Not Implemented
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx` |
| **Description** | No way to delete or edit saved vehicles |
| **Impact** | Users can add but not manage vehicles |
| **Severity** | 🟡 Medium |
| **Suggested Fix** | Add swipe-to-delete or edit functionality |

---

## 🔵 Low Severity Issues

### L-001: Platform-specific Font Fallback
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/wallet.tsx:222` |
| **Description** | Uses `Platform.OS === 'ios' ? 'Menlo' : 'monospace'` instead of design system font |
| **Impact** | Inconsistent typography |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Use `typography.mono` from theme |

---

### L-002: Missing Version Update Check
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:279` |
| **Description** | Version "v1.0.0" is hardcoded |
| **Impact** | Won't reflect actual app version |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Import from `expo-constants` or `app.json` |

---

### L-003: Unused Import Warning Risk
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/history.tsx:6` |
| **Description** | Imports `PRICES` but doesn't use it |
| **Impact** | Code cleanliness |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Remove unused import |

---

### L-004: Magic Number for SafeArea Padding
| Field | Details |
|-------|---------|
| **Files** | Multiple screens |
| **Description** | Uses hardcoded `paddingTop: 70` for iOS, `50` for Android |
| **Impact** | May not work on all device sizes |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Use `SafeAreaView` or `useSafeAreaInsets()` |

---

### L-005: Arrow Characters Instead of Icons
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/profile.tsx:256-268` |
| **Description** | Menu items use "→" text character for arrow |
| **Impact** | Not consistent with icon system |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Use Lucide `ChevronRight` icon |

---

### L-006: Back Button Uses Arrow Character
| Field | Details |
|-------|---------|
| **File** | `app/(customer)/index.tsx:238, 338` |
| **Description** | Uses "←" text character for back button |
| **Impact** | Not consistent with icon system |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Use Lucide `ArrowLeft` icon |

---

### L-007: Check Mark Uses Character
| Field | Details |
|-------|---------|
| **Files** | `profile.tsx:98,102,106`, `index.tsx:447,484` |
| **Description** | Uses "✓" character for checkmarks |
| **Impact** | May render differently across fonts |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Use Lucide `Check` icon |

---

### L-008: Plus Sign as Add Icon
| Field | Details |
|-------|---------|
| **Files** | `wallet.tsx:81`, `profile.tsx:174` |
| **Description** | Uses "+" text for add button icon |
| **Impact** | Minor inconsistency |
| **Severity** | 🔵 Low |
| **Suggested Fix** | Use Lucide `Plus` icon |

---

## Components That Are Correct ✅

| Component | Path | Notes |
|-----------|------|-------|
| `Button.tsx` | `components/ui/Button.tsx` | Properly styled with variants, loading states, accessibility |
| `ServiceIcon.tsx` | `components/ui/ServiceIcon.tsx` | Uses proper SVG-like pictograms, not emojis |
| `voltage-premium.ts` | `theme/voltage-premium.ts` | Complete design tokens |

---

## Recommended Prioritization

### Week 1: Critical & High Blockers
1. Standardize styling (NativeWind vs StyleSheet)
2. Replace all emojis with Lucide icons  
3. Fix SOS button size
4. Implement camera/gallery for profile photos
5. Make Terms/Privacy links functional

### Week 2: High Priority Features
6. Connect wallet to real data
7. Implement wallet top-up (M-Pesa STK)
8. Make support links functional
9. Enable profile editing
10. Add history item details navigation

### Week 3: Medium Polish
11. Add loading/error states everywhere
12. Add accessibility labels
13. Implement pull-to-refresh
14. Make emergency numbers callable
15. Add vehicle edit/delete

### Week 4: Low Priority Cleanup
16. Standardize typography
17. Replace arrow/check characters with icons
18. Remove unused imports
19. Use SafeAreaInsets properly
20. Dynamic version display

---

## Notes

- **Good architecture**: `ServiceIcon` component exists and should be used throughout
- **Theme is complete**: `voltage-premium.ts` has all necessary tokens
- **Button component ready**: Already has all variants needed
- **NativeWind is configured**: `tailwind.config.js` exists and has preset

---

*Report generated by Agent 2 (Bug Exterminator) for UI Overhaul Phase 4.5*
