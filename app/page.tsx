"use client";

import { useState, useEffect } from "react";
import { TextAnimate } from "@/components/ui/text-animate";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const words = ["smart", "bold", "connected"];

  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 300),
      setTimeout(() => setShowText(true), 600),
      setTimeout(() => setCurrentWordIndex(1), 1200),  // Change to "bold"
      setTimeout(() => setCurrentWordIndex(2), 1800),  // Change to "connected"
    ];

    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.cdnfonts.com/css/pp-neue-montreal");
        body {
          font-family: "PP Neue Montreal", sans-serif;
          background-color: black;
          overflow: hidden;
          margin: 0;
        }
      `}</style>

      <div className="relative w-full h-screen bg-black overflow-hidden">
        {/* Top bar */}
        <div
          className="absolute left-0 right-0 top-0 bg-white transition-all duration-[4000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
          style={{
            height: open ? "0%" : "50%",
          }}
        />

        {/* Bottom bar */}
        <div
          className="absolute left-0 right-0 bottom-0 bg-white transition-all duration-[4000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
          style={{
            height: open ? "0%" : "50%",
          }}
        />

        {/* Text Layer */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-white z-20 transition-all duration-[1500ms] ${
            showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {/* Center word */}
          <TextAnimate
            className="text-[10vw] font-bold leading-none tracking-tight"
            by="character"
            duration={0.5}
          >
            {words[currentWordIndex]}
          </TextAnimate>

          {/* Bottom-left label */}
          <span className="absolute bottom-8 left-8 text-xs opacity-70">
            002
          </span>

          {/* Top-right label */}
          <span className="absolute top-8 right-8 text-xs opacity-70">
            ©2025
          </span>
        </div>
      </div>
    </>
  );
}