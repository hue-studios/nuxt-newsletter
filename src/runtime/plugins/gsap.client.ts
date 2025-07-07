// src/runtime/plugins/gsap.client.ts
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

export default defineNuxtPlugin(() => {
  // Register GSAP plugins on client side only
  if (import.meta.client) {
    gsap.registerPlugin(
      Draggable,
      ScrollTrigger,
      ScrollSmoother,
      MorphSVGPlugin
    );

    // Make GSAP available globally for components that need it
    return {
      provide: {
        gsap: {
          gsap,
          Draggable,
          ScrollTrigger,
          ScrollSmoother,
          MorphSVGPlugin,
        },
      },
    };
  }
});
function defineNuxtPlugin(
  arg0: () =>
    | {
        provide: {
          gsap: {
            gsap: typeof globalThis.gsap;
            Draggable: typeof Draggable;
            ScrollTrigger: typeof ScrollTrigger;
            ScrollSmoother: typeof ScrollSmoother;
            MorphSVGPlugin: gsap.plugins.MorphSVGPlugin;
          };
        };
      }
    | undefined
) {
  throw new Error("Function not implemented.");
}
