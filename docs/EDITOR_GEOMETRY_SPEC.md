# Editor Geometry Specification — InteriorAI Studio

## 1. Units and Bounds
- Units: Meters ($m$).
- Room dimensions: $W_{\text{room}} > 0$, $L_{\text{room}} > 0$, $H_{\text{room}} > 0$.
- Rectangular floor boundary in $XZ$ plane:
  $$X \in [0, W_{\text{room}}], \quad Z \in [0, L_{\text{room}}]$$

## 2. Object Footprint & Oriented Bounding Box (OBB)
- An unrotated furniture item placed at center position $(x_c, z_c)$ with dimensions $(w, d)$ occupies:
  $$[x_c - w/2, x_c + w/2] \times [z_c - d/2, z_c + d/2]$$
- For arbitrary rotation angle $\theta = \text{rotation\_y\_deg} \times \frac{\pi}{180}$, the 4 corner points $(x'_i, z'_i)$ in the $XZ$ plane are:
  $$x'_i = x_c + (\Delta x_i \cos\theta - \Delta z_i \sin\theta)$$
  $$z'_i = z_c + (\Delta x_i \sin\theta + \Delta z_i \cos\theta)$$
  where $\Delta x_i \in \{-w/2, +w/2\}$ and $\Delta z_i \in \{-d/2, +d/2\}$.

## 3. Boundary Containment Rule
For an object to be strictly inside the room:
$$\forall i \in \{1, 2, 3, 4\}: \quad 0 \le x'_i \le W_{\text{room}} \quad \text{and} \quad 0 \le z'_i \le L_{\text{room}}$$
If any corner violates this condition, a `BOUNDARY_VIOLATION` is triggered.

## 4. Collision Detection Rule
Between any two objects $A$ and $B$, 2D polygon intersection is performed using the Separating Axis Theorem (SAT):
- If all 4 projection axes (2 from $A$'s edges, 2 from $B$'s edges) exhibit overlapping intervals, the objects collide, triggering a `COLLISION_VIOLATION`.
