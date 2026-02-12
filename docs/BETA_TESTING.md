# ResQ Kenya - Beta Testing Guide

> Guide for onboarding and managing beta testers.

## Overview

The ResQ beta program targets **100 initial users** in Nairobi to validate:
- Core service request flow
- M-Pesa payment integration (sandbox)
- Provider matching and ETA accuracy
- Overall user experience

---

## Beta User Segments

| Segment | Count | Purpose |
|---------|-------|---------|
| **Customers** | 70 | Test service requests, payments, tracking |
| **Providers** | 25 | Test job acceptance, navigation, earnings |
| **Corporate** | 5 | Test fleet management (future) |

---

## Onboarding Process

### For Customers

1. **Download App**
   - Android: APK via direct link (TestFlight alternative)
   - iOS: TestFlight invitation

2. **Registration**
   - Phone number verification (Firebase Auth)
   - Basic profile setup

3. **Test Credits**
   - Each beta user receives KES 5,000 test credits
   - Valid for sandbox M-Pesa testing only

### For Providers

1. **Application**
   - Fill registration form
   - Submit documents (ID, driving license, vehicle registration)

2. **Verification**
   - Manual review by ResQ team
   - Vehicle inspection (optional for beta)

3. **Onboarding**
   - Install Provider app
   - Training on app usage
   - Test job completion

---

## Test Scenarios

### Customer Test Cases

| # | Scenario | Expected Outcome |
|---|----------|------------------|
| 1 | Request towing service | Provider matched, tracked on map |
| 2 | Request battery jumpstart | Quick ETA (<15 min typical) |
| 3 | Request fuel delivery | Fuel type selection, amount entry |
| 4 | Complete M-Pesa payment | STK push received, payment confirmed |
| 5 | Cancel request (pending) | Request cancelled, no charge |
| 6 | Rate completed service | Rating saved, shown to provider |

### Provider Test Cases

| # | Scenario | Expected Outcome |
|---|----------|------------------|
| 1 | Go online | Location broadcast starts |
| 2 | Accept request | Customer notified, navigation available |
| 3 | Update status (en route) | Customer sees ETA |
| 4 | Arrive at location | Status updates correctly |
| 5 | Complete service | Payment prompt sent to customer |
| 6 | View earnings | Today/week/month totals accurate |

---

## M-Pesa Sandbox Testing

### Test Credentials (Safaricom Sandbox)

```
Test Phone Number: 254708374149
Test PIN: Any 4 digits (e.g., 1234)
```

### Expected Behavior

1. **STK Push**: Prompt appears on test phone
2. **PIN Entry**: Enter any 4-digit PIN
3. **Confirmation**: Success callback received
4. **Receipt**: M-Pesa receipt number generated

> ⚠️ **Note**: Sandbox transactions are not real. No actual money is transferred.

---

## Bug Reporting

### How to Report

Beta testers should report issues via:

1. **In-App Feedback** (preferred)
   - Shake device to trigger feedback form
   - Automatic screenshot and logs attached

2. **WhatsApp Group**
   - ResQ Beta Testers group
   - Share screenshots and steps to reproduce

3. **Email**
   - beta@resq.co.ke
   - Include: Device, OS version, steps, screenshots

### Bug Priority Levels

| Priority | Description | Response Time |
|----------|-------------|---------------|
| **P0 - Critical** | App crash, payment failure | 24 hours |
| **P1 - High** | Major feature broken | 48 hours |
| **P2 - Medium** | Minor feature issue | 1 week |
| **P3 - Low** | UI/UX suggestion | Backlog |

---

## Feedback Collection

### Weekly Surveys

- Google Form sent every Friday
- 5-minute completion time
- Covers: Satisfaction, usability, suggestions

### Key Metrics to Track

| Metric | Target | How Measured |
|--------|--------|--------------|
| Request completion rate | >90% | Completed/Total requests |
| Average ETA accuracy | ±3 min | Actual vs Predicted |
| Payment success rate | >95% | Successful/Total payments |
| App crash rate | <1% | Firebase Crashlytics |
| NPS Score | >50 | Weekly survey |

---

## Beta Timeline

### Week 1: Soft Launch
- 20 customers, 5 providers
- Focus on core flow bugs
- Daily check-ins with testers

### Week 2: Expanded Testing
- 50 customers, 15 providers
- Stress test matching algorithm
- M-Pesa edge cases

### Week 3: Full Beta
- 70 customers, 25 providers
- All service types enabled
- Performance monitoring

### Week 4: Analysis & Fixes
- Analyze feedback
- Fix critical bugs
- Prepare for production

---

## Success Criteria

Beta is successful when:

- [ ] **100 service requests** completed without critical bugs
- [ ] **95%+ payment success** rate on M-Pesa sandbox
- [ ] **<5% cancellation** rate after provider assigned
- [ ] **NPS score >50** from beta testers
- [ ] **Zero P0 bugs** unresolved
- [ ] **Provider app** rated usable by 20+ providers

---

## Communication Plan

### Channels

| Channel | Purpose | Frequency |
|---------|---------|-----------|
| WhatsApp Group | Quick updates, bug reports | Daily |
| Email Newsletter | Weekly summary, tips | Weekly |
| In-App Notifications | Feature updates | As needed |

### Key Messages

1. **Welcome Message**
   > Welcome to ResQ Beta! You're helping us build Kenya's #1 roadside assistance app. Your feedback is invaluable.

2. **Weekly Update Template**
   > This week: X requests completed, Y bugs fixed. New features: [list]. Thanks for being a beta tester!

3. **Thank You Message**
   > Thank you for being a ResQ beta tester! As a token of appreciation, you'll receive 3 months free premium membership at launch.

---

## Legal & Compliance

### Beta Agreement

All testers must accept:
- Terms of Service
- Privacy Policy
- Beta Program Agreement (no real money, test data only)

### Data Privacy

- Test data is not used for commercial purposes
- Testers can request data deletion
- No personal data shared with third parties

---

## Support Contacts

| Role | Contact |
|------|---------|
| Beta Program Manager | beta@resq.co.ke |
| Technical Support | support@resq.co.ke |
| Emergency (app down) | +254 XXX XXX XXX |

---

## Appendix: Beta Tester Signup Form

### Customer Application
- Full Name
- Phone Number (254...)
- Location (Nairobi area)
- Vehicle Type (optional)
- How did you hear about ResQ?

### Provider Application
- Full Name
- Phone Number
- Service Types (Towing/Tire/Battery/Fuel)
- Vehicle Details
- Years of Experience
- ID/License Upload

---

*Document Version: 1.0 | Last Updated: January 2026*
