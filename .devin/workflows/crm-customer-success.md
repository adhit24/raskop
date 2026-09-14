---
description: Customer Success Manager — monitor customer health, predict churn risk, and identify expansion/upsell opportunities using weighted scoring models
---

# Customer Success Manager

Production-grade customer success analytics with multi-dimensional health scoring, churn risk prediction, and expansion opportunity identification.

---

## When to Use
Invoke this skill when:
- Analyzing customer accounts or reviewing retention metrics
- Scoring at-risk customers or identifying churn signals
- Finding upsell/expansion revenue opportunities
- Preparing QBRs (Quarterly Business Reviews)
- User mentions: churn, customer health scores, NPS, CSAT, upsell, expansion revenue, retention analysis

---

## Input Requirements
All analysis uses a JSON file per customer with these key fields:
- `customer_id`, `name`, `segment`, `arr`
- `usage`: login_frequency, feature_adoption, dau_mau_ratio
- `engagement`: support_ticket_volume, meeting_attendance, nps_score, csat_score
- `support`: open_tickets, escalation_rate, avg_resolution_hours
- `relationship`: executive_sponsor_engagement, multi_threading_depth, renewal_sentiment
- `contract_end_date`, usage_decline signals, commercial_factors

---

## Tool 1: Health Score Calculator

**Dimensions & Weights:**
| Dimension | Weight | Metrics |
|-----------|--------|---------|
| Usage | 30% | Login frequency, feature adoption, DAU/MAU ratio |
| Engagement | 25% | Support ticket volume, meeting attendance, NPS/CSAT |
| Support | 20% | Open tickets, escalation rate, avg resolution time |
| Relationship | 25% | Executive sponsor engagement, multi-threading, renewal sentiment |

**Classification:**
- 🟢 Green (75–100): Healthy — customer achieving value
- 🟡 Yellow (50–74): Needs attention — monitor closely
- 🔴 Red (0–49): At risk — immediate intervention required

```bash
python scripts/health_score_calculator.py customer_data.json
python scripts/health_score_calculator.py customer_data.json --format json
```

---

## Tool 2: Churn Risk Analyzer

**Risk Signal Weights:**
| Signal Category | Weight | Indicators |
|----------------|--------|------------|
| Usage Decline | 30% | Login trend, feature adoption change, DAU/MAU change |
| Engagement Drop | 25% | Meeting cancellations, response time, NPS change |
| Support Issues | 20% | Open escalations, unresolved critical, satisfaction trend |
| Relationship Signals | 15% | Champion left, sponsor change, competitor mentions |
| Commercial Factors | 10% | Contract type, pricing complaints, budget cuts |

**Risk Tiers:**
- 🔴 Critical (80–100): Immediate executive escalation
- 🟠 High (60–79): Urgent CSM intervention
- 🟡 Medium (40–59): Proactive outreach
- 🟢 Low (0–39): Standard monitoring

```bash
python scripts/churn_risk_analyzer.py customer_data.json
python scripts/churn_risk_analyzer.py customer_data.json --format json
```

---

## Tool 3: Expansion Opportunity Scorer

Identifies upsell, cross-sell, and seat expansion opportunities with revenue estimates and priority ranking.

**Expansion Types:**
- **Upsell**: Upgrade to higher tier or more of existing product
- **Cross-sell**: Add new product modules
- **Expansion**: Additional seats or departments

```bash
python scripts/expansion_opportunity_scorer.py customer_data.json
python scripts/expansion_opportunity_scorer.py customer_data.json --format json
```

---

## Workflow Integration

```bash
# 1. Score customer health across portfolio
python scripts/health_score_calculator.py customer_portfolio.json --format json > health_results.json

# 2. Identify at-risk accounts
python scripts/churn_risk_analyzer.py customer_portfolio.json --format json > risk_results.json

# 3. Find expansion opportunities in healthy accounts
python scripts/expansion_opportunity_scorer.py customer_portfolio.json --format json > expansion_results.json

# 4. Prepare QBR using assets/qbr_template.md
```

---

## Intervention Playbooks by Risk Tier

| Risk Tier | Immediate Action | Owner | Timeline |
|-----------|-----------------|-------|----------|
| Critical | Executive escalation call, recovery plan | CSM + VP CS | 24 hours |
| High | CSM intervention, success plan review | CSM | 1 week |
| Medium | Proactive health check, value review | CSM | 2 weeks |
| Low | Standard cadence, expansion discovery | CSM | Monthly |

---

## QBR Structure (use `assets/qbr_template.md`)
1. Executive Summary — health score trend, key wins
2. Value Delivered — ROI, outcomes achieved vs. goals
3. Usage & Adoption — metrics vs. benchmarks
4. Risks & Mitigations — at-risk signals and plans
5. Roadmap Alignment — upcoming features, expansion opportunities
6. Next Period Goals — mutual success plan

---

## Key Metrics to Track
- **NRR** (Net Revenue Retention): target > 110%
- **GRR** (Gross Revenue Retention): target > 85%
- **Health Score Distribution**: % Green / Yellow / Red
- **Churn Rate**: Monthly & annual by segment
- **Time-to-Value**: Days from contract sign to first value milestone
- **Expansion Rate**: Expansion ARR / Beginning ARR

---

## Best Practices
1. **Combine signals**: Use all three tools together for a complete picture
2. **Act on trends, not snapshots**: A declining Green is more urgent than a stable Yellow
3. **Calibrate thresholds**: Adjust benchmarks for your product and industry
4. **Prepare with data**: Run scripts before every QBR and executive meeting

---

## Limitations
- No real-time data — scripts analyze point-in-time JSON snapshots
- No CRM integration — data must be exported manually from your CRM/CS platform
- Scoring is algorithmic (weighted signals), not predictive ML
- Expansion revenue estimates are approximations based on usage patterns
