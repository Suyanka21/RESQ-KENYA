# ResQ Phase 1: Cost Accounting & Financial Requirements
**For Non-Technical Stakeholders (CEO, Investors, Board)**

> **Prepared by:** Brian Njoroge (CTO)  
> **Date:** January 15, 2026  
> **Purpose:** Transparent accounting of costs required to complete Phase 1 development

---

## Executive Summary

**Can we start Phase 1 development today?** 

**YES** - Development can begin immediately with **$0 upfront costs** using free tiers of development tools.

**HOWEVER** - To launch a production app serving real customers, we will need to transition from free/development plans to paid production services. **Estimated Phase 1 production costs: $500-$1,500/month** depending on user volume.

---

## Cost Breakdown: Free vs. Paid

### ✅ What's FREE (Development Phase - Weeks 1-3)

| Service | Free Tier | What It Gives Us |
|---------|-----------|------------------|
| **Firebase (Spark Plan)** | $0/month | 1GB storage, 50K reads/day, 20K writes/day - enough for development and early testing |
| **GitHub** | $0/month | Code storage, version control, collaboration |
| **VS Code / Development Tools** | $0/month | All programming tools we need |
| **Expo Development** | $0/month | Mobile app testing and development |
| **Google Maps (Testing)** | $0/month | First $200/month credit covers ~28,000 map loads |
| **Sentry Error Tracking** | $0/month | Up to 5,000 error events/month |

**Bottom Line:** **Week 1-3 development = $0 cost**

We can build and test everything without spending money initially.

---

### 💳 What REQUIRES PAYMENT (Production Launch - Week 4+)

#### 1. Firebase Production Upgrade (REQUIRED)
**Cost:** $25-$500/month (scales with users)

**Why we need it:**
- Free tier limits will be exceeded with 100+ real users
- Production apps need guaranteed uptime and support
- Real-time location tracking requires higher quotas

**Cost Breakdown by Usage:**
- **100 active users:** ~$25/month
- **500 active users:** ~$100/month  
- **2,000 active users:** ~$300/month
- **5,000 active users:** ~$500/month

**When to pay:** Week 4 (before beta launch)

---

#### 2. M-Pesa Daraja API (REQUIRED for Kenya)
**Setup Cost:** KES 3,000 (~$20 USD) one-time registration  
**Transaction Fees:** 1.5% per transaction (industry standard)

**Example:**
- Customer pays KES 1,000 for towing
- M-Pesa fee: KES 15
- We receive: KES 985

**Why we need it:** Only way to accept mobile money payments in Kenya market.

**When to pay:** Week 2-3 (during payment integration development)

---

#### 3. Stripe Payment Processing (REQUIRED for Dubai)
**Setup Cost:** $0 (free account)  
**Transaction Fees:** 2.9% + AED 1.00 per transaction

**Example:**
- Customer pays AED 150 for towing
- Stripe fee: AED 5.35
- We receive: AED 144.65

**Why we need it:** Industry-standard for credit/debit card payments in UAE.

**When to pay:** Week 2-3 (during payment integration development)

---

#### 4. Google Maps API (REQUIRED)
**Cost:** $0 for first $200/month of usage, then pay-as-you-go

**What $200 covers:**
- ~28,000 map loads per month
- ~100 users using app 10 times/day
- ~40,000 geocoding requests

**Estimated costs by usage:**
- **100 users:** $0/month (covered by free credit)
- **500 users:** ~$50/month
- **2,000 users:** ~$200/month

**Why we need it:** Real-time provider tracking and navigation.

**When to pay:** Week 4+ (only when we exceed free tier)

---

### 🔧 What's OPTIONAL (Can Add Later)

| Service | Cost | Purpose | Priority |
|---------|------|---------|----------|
| **Custom Domain** | $12/year | e.g., resq.co.ke | Low |
| **SSL Certificate** | $0 | Firebase/Expo provides free | N/A |
| **Sentry Pro** | $80/month | Advanced error monitoring | Medium |
| **AWS (If needed)** | Variable | For AI features in Phase 4 | Phase 4 |
| **Twilio SMS** | Pay-per-use | Backup for OTP if Firebase fails | Low |

---

## Month-by-Month Cost Projection (Phase 1)

### Month 1: Development (Weeks 1-4)
| Item | Cost | Notes |
|------|------|-------|
| Development Tools | $0 | All free tier |
| Firebase (Free Tier) | $0 | Development only |
| M-Pesa Registration | $20 | One-time setup |
| **TOTAL MONTH 1** | **$20** | Just M-Pesa registration |

### Month 2: Beta Launch (100-500 users)
| Item | Cost | Notes |
|------|------|-------|
| Firebase Production | $100 | ~250 active users |
| M-Pesa Transaction Fees | ~$30 | 1.5% of ~$2,000 volume |
| Stripe Transaction Fees | ~$40 | 2.9% of ~$1,400 volume |
| Google Maps API | $0 | Within free tier |
| Error Monitoring | $0 | Free tier sufficient |
| **TOTAL MONTH 2** | **$170** | |

### Month 3: Growth (500-2,000 users)
| Item | Cost | Notes |
|------|------|-------|
| Firebase Production | $300 | ~1,000 active users |
| M-Pesa Transaction Fees | ~$150 | 1.5% of ~$10,000 volume |
| Stripe Transaction Fees | ~$200 | 2.9% of ~$7,000 volume |
| Google Maps API | $100 | Exceeding free tier |
| Error Monitoring | $80 | Upgraded for better monitoring |
| **TOTAL MONTH 3** | **$830** | |

---

## Critical Questions Answered

### 1. Can development start with $0?
**YES** - All development can happen on free tiers. We only pay when launching to real customers.

### 2. When do we need to have money ready?
**Week 4** - Before beta launch, we need:
- M-Pesa registration ($20) ✓ Already paid
- Firebase upgrade budget ($100-300/month)
- Payment processing fee budget (covered by revenue)

### 3. How much should we budget for Phase 1?
**Conservative:** $500/month for 3 months = **$1,500 total**  
**Realistic:** $300/month for 3 months = **$900 total**  
**Optimistic:** $200/month for 3 months = **$600 total**

### 4. Are these costs covered by revenue?
**Partially YES** - Transaction fees (M-Pesa, Stripe) are deducted from customer payments, so they're self-funding.

**Infrastructure costs** (Firebase, Maps, Monitoring) need to be budgeted separately: **$300-500/month**

### 5. What if we run out of free tier before we're ready?
We have monitoring in place. We'll get alerts before limits are hit, giving us time to:
- Upgrade services
- Optimize code to reduce costs
- Make business decisions

---

## Comparison: Our Costs vs. Industry

| Expense Category | ResQ (Phase 1) | Industry Average | Our Advantage |
|------------------|----------------|------------------|---------------|
| Infrastructure | $300/month | $2,000/month | Using Firebase vs custom servers |
| Payment Processing | 1.5-2.9% | 2-5% | Competitive rates |
| Development Tools | $0 | $500/month | Open-source stack |
| Total Monthly Overhead | $500 | $3,000+ | **83% cheaper** |

---

## Risk Mitigation

### What if costs exceed projections?

**Scenario 1: Viral growth (10,000 users Month 1)**
- Firebase costs could jump to $1,000/month
- **Mitigation:** Revenue from 10,000 users (~$60,000/month) covers costs easily

**Scenario 2: Low user adoption (50 users)**
- Stay on free tier or minimal costs ($50/month)
- **Mitigation:** Extend development phase, optimize before scaling

**Scenario 3: Payment processing fails**
- Could lose revenue temporarily
- **Mitigation:** Have backup payment method (manual bank transfer for B2B)

---

## Investor Perspective: Unit Economics

**Per-User Monthly Cost Breakdown (at 1,000 users):**

| Cost Item | Monthly Total | Per User |
|-----------|---------------|----------|
| Firebase | $300 | $0.30 |
| Google Maps | $100 | $0.10 |
| Monitoring | $80 | $0.08 |
| Payment Processing | Variable | ~$0.50* |
| **Total Infrastructure** | $480 | **$0.48** |

*Payment fees are % of transaction value, effectively paid by customer

**Revenue per user:** ~$60/month (based on 2-3 service requests)  
**Gross Margin:** ~99% on infrastructure (before provider costs)

---

## Recommendations for CEO & Investors

### For Phase 1 (Next 3 Months):

1. **Budget Required:** $1,500 for infrastructure (conservative)
2. **Payment Processing:** Self-funded through transaction revenue
3. **Risk Level:** LOW - Most costs scale with revenue
4. **ROI Timeline:** Break-even on infrastructure by Month 2 if we hit 500 users

### Red Flags to Watch:

- [ ] Firebase costs growing faster than user growth (indicates inefficiency)
- [ ] Payment processing fees exceeding 3% (need to renegotiate)
- [ ] Google Maps costs exceeding $200/month (optimize route queries)

### Green Lights:

- [x] All development tools are free
- [x] We control when to scale infrastructure
- [x] Payment fees are covered by revenue
- [x] Industry-leading cost efficiency

---

## Summary for Board Meeting

**Can we afford Phase 1?** YES

**Total required investment:** $1,500 over 3 months ($500/month average)

**What portion is at risk if app fails?** Only infrastructure costs (~$500/month). Payment processing fees only occur if we have revenue.

**When do costs require investor approval?** If monthly costs exceed $1,000 (indicates rapid growth needing capital).

**Best-case scenario:** Hit 2,000 users by Month 3, generating $120,000 revenue against $1,500 costs = **8,000% ROI on infrastructure investment**.

**Worst-case scenario:** 50 users by Month 3, $100 total costs incurred, minimal revenue = learning phase with negligible financial risk.

---

## Next Steps

1. ✅ **Immediate (This Week):** Start development on free tiers - $0 cost
2. 📋 **Week 2:** Set up M-Pesa account - $20 cost
3. 💳 **Week 4:** Upgrade Firebase for beta launch - $100-300/month
4. 📊 **Monthly:** Monitor costs vs. projections, report to leadership

---

**Questions?** Contact Brian Njoroge (CTO) for technical clarifications or Joe Mwirigi (CEO) for business decisions.
