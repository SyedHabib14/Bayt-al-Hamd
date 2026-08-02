export const ambientGlowConfig = {
  layers: [
    {
      color: "oklch(0.86 0.10 76 / 0.72)",   // warm gold — primary
      size: "clamp(20rem, 34vw, 34rem)",
      blur: "136px",
      duration: "100s",
      offsetTop: "5rem",
      offsetLeft: "min(12vw, 7rem)",
    },
    {
      color: "oklch(0.78 0.11 36 / 0.32)",   // terracotta — secondary
      size: "clamp(38rem, 30vw, 30rem)",
      blur: "104px",
      duration: "100s",
      offsetTop: "8%",
      offsetRight: "clamp(1rem, 8vw, 4rem)",
    },
    {
      color: "oklch(0.93 0.06 90 / 0.40)",   // pale champagne — accent
      size: "clamp(16rem, 26vw, 26rem)",
      blur: "120px",
      duration: "100s",
      offsetTop: "32%",
      offsetLeft: "32%",
    },
    {
      color: "oklch(0.62 0.09 250 / 0.16)",  // cool indigo — depth layer
      size: "clamp(24rem, 40vw, 40rem)",
      blur: "50px",
      duration: "100s",
      offsetTop: "27%",
      offsetLeft: "43%",
    },
  ],
  easing: "cubic-bezier(0.45, 0, 0.55, 1)",
  blendMode: "screen",
  opacity: 0.95,
} as const;