---
description: Revenue Operations (RevOps) — analyze sales pipeline health, forecast accuracy, and GTM efficiency for SaaS revenue optimization
---

# Revenue Operations

Pipeline analysis, forecast accuracy tracking, and GTM efficiency measurement for sales and revenue teams.

> All scripts support `--format text` (human-readable) and `--format json` (dashboards/integrations).

---

## When to Use
Invoke this skill when:
- Analyzing sales pipeline coverage or stage health
- Forecasting revenue with accuracy tracking (MAPE)
- Evaluating go-to-market (GTM) efficiency
- Preparing for board meetings or QBRs
- User mentions: pipeline, forecast, GTM, Magic Number, LTV:CAC, CAC payback, RevOps, sales efficiency

---

## Tool 1: Pipeline Analyzer

Analyzes sales pipeline health including coverage ratios, stage conversion rates, deal velocity, aging risks, and concentration risks.

**Key Metrics:**
| Metric | Healthy Target | Description |
|--------|---------------|-------------|
| Pipeline Coverage Ratio | 3–4x quota | Total pipeline value ÷ quota target |
| Stage Conversion Rate | Varies by stage | Stage-to-stage progression rates |
| Sales Velocity | Growing QoQ | (Opportunities × Avg Deal Size × Win Rate) ÷ Avg Sales Cycle |
| Deal Aging | < 2x avg cycle | Flags stale deals exceeding 2× average cycle time |
| Concentration Risk | No deal > 40% | Warns when a single deal dominates pipeline |

**Input Schema:**
```json
{
  "quota": 500000,
  "stages": ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won"],
  "average_cycle_days": 45,
  "deals": [
    {
      "id": "D001", "name": "Acme Corp", "stage": "Proposal",
      "value": 85000, "age_days": 32, "close_date": "2025-03-15", "owner": "rep_1"
    }
  ]
}
```

```bash
python scripts/pipeline_analyzer.py --input pipeline.json --format text
```

---

## Tool 2: Forecast Accuracy Tracker

Tracks forecast accuracy using MAPE, detects systematic bias, and analyzes trends by rep, product, or segment.

**Accuracy Ratings:**
| Rating | MAPE Range | Interpretation |
|--------|-----------|----------------|
| Excellent | < 10% | Highly predictable, data-driven process |
| Good | 10–15% | Reliable forecasting with minor variance |
| Fair | 15–25% | Needs process improvement |
| Poor | > 25% | Significant forecasting methodology gaps |

**Key Metrics:**
- **MAPE**: mean(|actual − forecast| ÷ |actual|) × 100
- **Forecast Bias**: Over-forecasting (positive) vs under-forecasting (negative)
- **Weighted Accuracy**: MAPE weighted by deal value for materiality
- **Category Breakdown**: Accuracy by rep, product, or segment

```bash
python scripts/forecast_accuracy_tracker.py forecast_data.json --format text
```

---

## Tool 3: GTM Efficiency Calculator

Calculates core SaaS GTM efficiency metrics with industry benchmarking and improvement recommendations.

**Key Metrics:**
| Metric | Formula | Target |
|--------|---------|--------|
| Magic Number | Net New ARR ÷ Prior Period S&M Spend | > 0.75 |
| LTV:CAC | (ARPA × Gross Margin ÷ Churn Rate) ÷ CAC | > 3:1 |
| CAC Payback | CAC ÷ (ARPA × Gross Margin) | < 18 months |
| Burn Multiple | Net Burn ÷ Net New ARR | < 2× |
| Rule of 40 | Revenue Growth % + FCF Margin % | > 40% |
| Net Dollar Retention | (Begin ARR + Expansion − Contraction − Churn) ÷ Begin ARR | > 110% |

```bash
python scripts/gtm_efficiency_calculator.py gtm_data.json --format text
```

---

## Standard Workflows

### Weekly Pipeline Review
1. Export current pipeline from CRM (confirm stage, value, close_date, owner are populated)
2. Run: `python scripts/pipeline_analyzer.py --input current_pipeline.json --format text`
3. Review key indicators: coverage ratio (>3x?), aging deals, concentration risk, funnel shape
4. Document findings in `assets/pipeline_review_template.md`
5. Action items: address aging deals, fill coverage gaps, redistribute concentration

### Monthly Forecast Accuracy Review
1. Confirm all forecast periods have corresponding actuals in CRM
2. Run: `python scripts/forecast_accuracy_tracker.py forecast_history.json --format text`
3. Analyze: Is MAPE trending down? Which reps have highest error rates? Systematic bias?
4. Coach high-bias reps, adjust methodology, improve data hygiene

### Quarterly GTM Efficiency Audit
1. Verify revenue, cost, and customer figures match finance records
2. Run: `python scripts/gtm_efficiency_calculator.py quarterly_data.json --format text`
3. Benchmark against targets: Magic Number, LTV:CAC, CAC Payback, Rule of 40
4. Adjust spend allocation, optimize channels, improve retention strategy

### Quarterly Business Review (QBR)
1. Run pipeline analyzer for forward-looking coverage
2. Run forecast tracker for backward-looking accuracy
3. Run GTM calculator for efficiency benchmarks
4. Cross-reference pipeline health with forecast accuracy
5. Align GTM efficiency metrics with growth targets

---

## Red Flags to Surface Immediately
- Pipeline coverage below 3× entering the quarter → forecast at risk
- MAPE above 25% → forecasting methodology is broken
- Magic Number below 0.5 → fix unit economics before increasing spend
- CAC Payback above 24 months → sales motion is not viable at scale
- LTV:CAC below 2:1 → customer acquisition is not profitable

---

## Reference Documentation
| Reference | Description |
|-----------|-------------|
| RevOps Metrics Guide | Complete metrics hierarchy, definitions, formulas, interpretation |
| Pipeline Management Framework | Pipeline best practices, stage definitions, conversion benchmarks |
| GTM Efficiency Benchmarks | SaaS benchmarks by stage, industry standards, improvement strategies |
