"use client";

import { useEffect } from "react";
import { useAnimate, useInView, useReducedMotion } from "motion/react";

export const HOME_EASE = [0.22, 1, 0.36, 1];

export function HomeReveal({ as = "div", delay = 0, children, ...props }) {
  const reducedMotion = useReducedMotion();
  const [scope, animate] = useAnimate();
  const inView = useInView(scope, { once: true, margin: "0px 0px -24px 0px" });
  const Element = as;

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion || scope.current.contains(document.activeElement)) {
      animate(scope.current, { opacity: 1, y: 0 }, { duration: 0 });
      return;
    }
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const controls = animate(scope.current, { opacity: [0, 1], y: [mobile ? 4 : 8, 0] }, {
      duration: mobile ? 0.3 : 0.4, delay: Math.min(delay, 0.24), ease: HOME_EASE,
    });
    return () => {
      controls.stop();
      // Cleanup must never leave content partially transparent.
      if (scope.current) {
        scope.current.style.opacity = "1";
        scope.current.style.transform = "none";
      }
    };
  }, [inView, reducedMotion, delay, animate, scope]);

  return (
    <Element
      {...props}
      ref={scope}
      className={`home-reveal ${props.className || ""}`}
    >
      {children}
    </Element>
  );
}
