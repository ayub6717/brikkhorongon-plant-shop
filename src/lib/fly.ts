/**
 * Animates a small product thumbnail from `from` to the header cart icon, then bumps the icon.
 * Uses the Web Animations API, so it needs no CSS. Resolves when finished (immediately if motion is reduced or no target exists).
 */
export function flyToCart(from: DOMRect, src: string): Promise<void> {
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

  const to = target.getBoundingClientRect();
  const size = 56;
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - size / 2 - startX;
  const dy = to.top + to.height / 2 - size / 2 - startY;

  const el = document.createElement("img");
  el.src = src;
  el.alt = "";
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed", left: `${startX}px`, top: `${startY}px`, width: `${size}px`, height: `${size}px`,
    borderRadius: "9999px", objectFit: "cover", zIndex: "9999", pointerEvents: "none", boxShadow: "0 8px 24px rgba(0,0,0,.25)",
  });
  document.body.appendChild(el);

  // Arc: rise a little above the straight line, then drop into the cart.
  const lift = Math.min(120, Math.abs(dy) * 0.4 + 40);
  const anim = el.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(0.85)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.6 },
    ],
    { duration: 650, easing: "cubic-bezier(0.5, 0, 0.75, 0.4)", fill: "forwards" },
  );

  return anim.finished.then(
    () => {
      el.remove();
      target.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 350, easing: "ease-out" });
    },
    () => el.remove(),
  );
}
