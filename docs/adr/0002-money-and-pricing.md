# ADR 0002: Monetary Representation and Budget Calculation

## Status
Accepted

## Context
Interior design project budgets in India require transparency, GST (Goods and Services Tax) breakdown, and exact monetary calculation in Indian Rupees (INR). Standard IEEE-754 floating-point numbers can introduce subtle binary representation and rounding errors (e.g., `0.1 + 0.2 != 0.3`). Furthermore, catalog prices change over time, and contractor/designer estimates must retain an unalterable audit trail.

## Decision
1. **Integer Minor Units (Paise)**: All monetary values in the database, backend calculations, and network APIs are represented as 64-bit integers in minor units (**paise**, where 1 INR = 100 paise).
   - Example: ₹1,250.00 is represented as `125000` paise.
2. **Authoritative Calculation**: All financial calculations (subtotals, discounts, taxes, logistics, and totals) are performed authoritatively by the backend pricing service using integer or decimal-safe arithmetic. Frontend budget displays only render backend calculations and never submit client-computed totals as authoritative.
3. **Immutable Snapshots**: Every generated estimate creates an immutable record tied to the specific `project_id` and canonical `scene_revision`. An estimate record stores the full line-item snapshot, applied tax rates, assumptions, and final total. Future catalog price changes never mutate historical estimates.
4. **GST Assumptions**: Tax calculations must explicitly document their assumptions (e.g., standard 18% GST or category-specific rates), separating base cost, CGST/SGST/IGST, and final payable amount. Estimates must be explicitly marked as preliminary.

## Consequences
- Guaranteed zero rounding discrepancies across platforms and databases.
- Full immutability and historical auditing of all estimates.
- Strict protection against client-side tampering of prices or totals.
