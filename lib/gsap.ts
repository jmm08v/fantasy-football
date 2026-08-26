"use client";

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// SplitText became free in GSAP 3.13, so it needs no license key or CDN shim.
gsap.registerPlugin(SplitText, useGSAP);

export { gsap, SplitText, useGSAP };
