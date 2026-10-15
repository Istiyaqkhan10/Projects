# Budget and Pricing Specification — InteriorAI Studio

## 1. Monetary Unit & Precision
- Monetary values are represented in **paise** ($1\text{ INR} = 100\text{ paise}$).
- All arithmetic operations on financial sums are integer-only. Division for tax rates uses integer round-half-up:
  $$\text{tax\_paise} = \left\lfloor \frac{\text{taxable\_amount\_paise} \times \text{tax\_rate\_basis\_points} + 5000}{10000} \right\rfloor$$
  where $18\% \text{ GST} = 1800 \text{ basis points}$.

## 2. Calculation Pipeline
1. **Scene Aggregation**: Map each object instance in the scene to its verified catalog price in paise.
2. **Subtotal**: Sum of (quantity $\times$ catalog item unit price in paise).
3. **Logistics & Assembly**: Optional configured flat rate or percentage in paise.
4. **GST (Goods & Services Tax)**:
   - Default GST rate assumption: 18% (standard furniture GST in India).
   - Displayed with transparent CGST (9%) + SGST (9%) or IGST (18%) breakdown.
5. **Estimate Snapshot**:
   - The computed snapshot contains itemized lines, quantity, unit price, total, tax, and assumption notes.
   - Saved as an immutable entity linked to `project_id` and `scene_revision`.
