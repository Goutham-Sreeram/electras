"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, ReactNode } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Floating, { FloatingElement } from "@/components/fancy/image/parallax-floating";
import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal";

gsap.registerPlugin(ScrollTrigger);

// Optimized text animation component with memoization
function TextAnimate({ children, className }: { children: ReactNode, className: string }) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showModel, setShowModel] = useState(false);
  const [showBackgroundText, setShowBackgroundText] = useState(false);
  const [circleScale, setCircleScale] = useState(0);
  const [textColor, setTextColor] = useState("black");
  const [showNextSection, setShowNextSection] = useState(false);
  const [showFinalSection, setShowFinalSection] = useState(false);

  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const nextSectionRef = useRef(null);
  const finalSectionRef = useRef(null);
  const scrollAnimationRef = useRef<{ rotation: number; circleScale: number; textX: number; } | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const scrollWords = ["<<<<<<<<<<<<<<<<<<<<", "create", "forever", ">>>>>>>>>>>>>>>>>>>>"];

  // Reset scroll position
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  //inital bars
  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 300), // start opening
      setTimeout(() => setShowText(true), 2500), // text fades in slowly
      setTimeout(() => setCurrentWordIndex(1), 3500),
      setTimeout(() => setCurrentWordIndex(2), 5000),
      setTimeout(() => {
        setShowText(false);
        setTimeout(() => {
          setShowModel(true);
          setShowBackgroundText(true);
        }, 1200);
      }, 6500),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);


  // Unified scroll animation using GSAP ScrollTrigger
  useEffect(() => {
    if (!showModel) return;

    const scrollState = {
      rotation: 0,
      circleScale: 0,
      textX: 0
    };

    // Main scroll timeline
    gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          // Model rotation (0-80% of scroll)
          if (progress <= 0.8) {
            scrollState.rotation = (progress / 0.8) * Math.PI * 4;
          }

          // Circle expansion (50-80% of scroll)
          if (progress >= 0.5 && progress <= 0.8) {
            scrollState.circleScale = (progress - 0.5) / 0.3;
            setCircleScale(scrollState.circleScale);

            // Update text color based on circle scale
            if (scrollState.circleScale > 0.3) {
              setTextColor("white");
            } else {
              setTextColor("black");
            }
          } else if (progress > 0.8) {
            scrollState.circleScale = 1;
            setCircleScale(1);
            setTextColor("white");

            // Trigger next section
            if (!showNextSection) {
              setShowNextSection(true);
            }
          } else {
            scrollState.circleScale = 0;
            setCircleScale(0);
            setTextColor("black");
          }
        }
      }
    });

    // Horizontal text scroll
    const textContainer = document.querySelector("#text-container > div");
    if (textContainer) {
      gsap.to(textContainer, {
        x: () => -(textContainer.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "80%",
          scrub: 1,
        }
      });
    }

    scrollAnimationRef.current = scrollState;

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [showModel, showNextSection]);

  // Trigger final section when next section is scrolled through
  useEffect(() => {
    if (!showNextSection || !nextSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When next section is scrolled past (exiting viewport from top)
          if (entry.boundingClientRect.top < 0 && entry.boundingClientRect.bottom < window.innerHeight / 2) {
            if (!showFinalSection) {
              setShowFinalSection(true);
            }
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: '0px'
      }
    );

    observer.observe(nextSectionRef.current);

    return () => observer.disconnect();
  }, [showNextSection, showFinalSection]);

  // Optimized THREE.js setup
  useEffect(() => {
    if (!showModel || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 768,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = window.innerWidth > 768; // Disable shadows on mobile
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    // Optimized lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(10, 10, 10);
    if (window.innerWidth > 768) {
      keyLight.castShadow = true;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.0);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    camera.position.z = window.innerWidth < 768 ? 7 : 5; // Adjust camera for mobile

    let animationId: number | null = null;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (modelRef.current && scrollAnimationRef.current) {
        const rotation = scrollAnimationRef.current.rotation;
        modelRef.current.rotation.y = rotation * 0.05;
        modelRef.current.rotation.x = rotation * 0.5;
      }

      if (mixerRef.current) {
        mixerRef.current.update(0.016);
      }

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.position.z = width < 768 ? 7 : 5;

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Toggle shadows based on screen size
      keyLight.castShadow = width > 768;
      renderer.shadowMap.enabled = width > 768;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [showModel]);


  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.cdnfonts.com/css/pp-neue-montreal");
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: "PP Neue Montreal", sans-serif;
          background-color: white;
          margin: 0;
          color: black;
          overflow-x: hidden;
        }
        
        body::-webkit-scrollbar,
        html::-webkit-scrollbar {
          display: none;
        }
        
        body,
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .next-section {
          opacity: 0;
          transform: translateY(50px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .next-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .final-section {
          opacity: 1;
          
          
        }

        .final-section.visible {
          opacity: 1;
          
        }

        /* Responsive text sizing */
        @media (max-width: 768px) {
          .text-responsive {
            font-size: 12vw !important;
          }
          
          .text-responsive-lg {
            font-size: 10vw !important;
          }
        }
      `}</style>

      <div className="h-[400vh] bg-white" ref={sectionRef}>
        <div className="sticky top-0 w-full h-screen bg-[#F9F9F7] overflow-hidden">
          {/* Top & Bottom Bars */}
          <div
            className="absolute left-0 right-0 top-0 bg-black transition-all duration-[7000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{ height: open ? "0%" : "50%" }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-black transition-all duration-[7000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{ height: open ? "0%" : "50%" }}
          />

          {/* 3D Canvas */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-45 transition-opacity duration-1000 ${showModel ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* Circular Expanding Background */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-5"
          >
            <div
              className="bg-black rounded-full transition-transform duration-100 ease-linear will-change-transform"
              style={{
                width: "400vh",
                height: "400vh",
                transform: `scale(${circleScale})`,
              }}
            />
          </div>

          {/* Initial Text Layer with VerticalCutReveal animation */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center text-black z-20 transition-all duration-800 px-4 ${showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
          >
            {currentWordIndex === 0 && (
              <VerticalCutReveal
                splitBy="characters"
                staggerDuration={0.05}
                staggerFrom="center"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 21,
                  delay: 0.3,
                }}
                containerClassName="text-[10vw] md:text-[10vw] text-responsive font-medium leading-none tracking-[-0.02em]"
              >
                smart
              </VerticalCutReveal>
            )}
            {currentWordIndex === 1 && (
              <VerticalCutReveal
                splitBy="characters"
                staggerDuration={0.05}
                staggerFrom="center"
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 21,
                  delay: 0.3,
                }}
                containerClassName="text-[10vw] md:text-[10vw] text-responsive font-medium leading-none tracking-[-0.02em]"
              >
                bold
              </VerticalCutReveal>
            )}
            {currentWordIndex === 2 && (
              <VerticalCutReveal
                splitBy="characters"
                staggerDuration={0.05}
                staggerFrom="center"
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 21,
                  delay: 0.3,
                }}
                containerClassName="text-[10vw] md:text-[10vw] text-responsive font-medium leading-none tracking-[-0.02em]"
              >
                connected
              </VerticalCutReveal>
            )}

            <span className="absolute bottom-4 md:bottom-8 left-4 md:left-8 text-[10px] md:text-xs opacity-70">
              002
            </span>
            <span className="absolute top-4 md:top-8 right-4 md:right-8 text-[10px] md:text-xs opacity-70">
              ©2025
            </span>
          </div>


          {/* Horizontal Scroll Text Layer */}
          <div
            id="text-container"
            className={`absolute inset-0 flex flex-col items-center justify-center z-25 transition-all duration-500 px-4 ${showBackgroundText ? "opacity-100" : "opacity-0"
              }`}
            style={{
              color: textColor,
            }}
          >
            <div className="flex gap-[5vw] text-[10vw] md:text-[10vw] text-responsive-lg font-medium leading-none tracking-tight">
              {scrollWords.map((word, i) => (
                <TextAnimate key={i} className="word-item whitespace-nowrap">
                  {word}
                </TextAnimate>
              ))}
            </div>

            <span className="absolute bottom-4 md:bottom-8 left-4 md:left-8 text-[10px] md:text-xs opacity-70">002</span>
            <span className="absolute top-4 md:top-8 right-4 md:right-8 text-[10px] md:text-xs opacity-70">©2025</span>
          </div>
        </div>
      </div>

      {/* Next Section */}
      <div
        ref={nextSectionRef}
        className={`next-section min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center ${showNextSection ? 'visible' : ''
          }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <TextAnimate className="text-4xl md:text-6xl font-medium mb-6 md:mb-8">
            Welcome to ELECTRAS
          </TextAnimate>
          <TextAnimate className="text-lg md:text-xl text-gray-300 mb-8 md:mb-12 px-4">
            Department Association of Electronics and Computer Engineering.
          </TextAnimate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="p-4 md:p-6">
              <h3 className="text-xl md:text-2xl font-medium mb-3 md:mb-4">Vision</h3>
              <p className="text-sm md:text-base text-gray-300">Develop into a centre of excellence in Electronics and Computer Engineering by producing technically competent professionals catering to the needs for Industry, Academia and Society.</p>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xl md:text-2xl font-medium mb-3 md:mb-4">Mission</h3>
              <p className="text-sm md:text-base text-gray-300">To pursue continuous improvement in learning, creativity and innovation among both faculty and students by enhanced infrastructure, state-of-the art laboratories and a unique learning environment. To inculcate in both faculty and students technical and entrepreneurial skills by professional activities to create socially relevant and sustainable solutions in the electronics and computer domain.</p>
            </div>
          </div>
        </div>
        
      </div>



      {/* Final Section - Appears after next section */}
      <div
        ref={finalSectionRef}
        className={`final-section relative min-h-screen bg-black text-white overflow-hidden ${showFinalSection ? 'visible' : ''
          }`}
      >
        <Floating sensitivity={-1} className="overflow-hidden">
          <FloatingElement depth={0.5} className="top-[8%] left-[8%]">
            <Image
              src="/content/p1.jpg"
              alt="Team member"
              width={128}
              height={128}
              className="w-20 h-20 md:w-32 md:h-32 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={1} className="top-[12%] left-[75%]">
            <Image
              src="/content/p2.jpg"
              alt="Team member"
              width={160}
              height={160}
              className="w-24 h-24 md:w-40 md:h-40 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={2} className="top-[5%] left-[40%]">
            <Image
              src="/content/p3.jpg"
              alt="Team member"
              width={176}
              height={240}
              className="w-32 h-48 md:w-44 md:h-60 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={1} className="top-[45%] left-[5%]">
            <Image
              src="/content/p4.jpg"
              alt="Team member"
              width={160}
              height={160}
              className="w-28 h-28 md:w-40 md:h-40 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={3} className="top-[60%] left-[70%]">
            <Image
              src="/content/p5.jpg"
              alt="Team member"
              width={192}
              height={256}
              className="w-36 h-52 md:w-48 md:h-64 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={1.5} className="top-[70%] left-[25%]">
            <Image
              src="/content/p6.jpg"
              alt="Team member"
              width={144}
              height={144}
              className="w-24 h-24 md:w-36 md:h-36 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
        </Floating>

        <div className="relative z-50 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
          <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
            <TextAnimate className="text-5xl md:text-7xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              View our Team
            </TextAnimate>
            <TextAnimate className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto px-4">
              pee pee poo poo
            </TextAnimate>
          </div>

          <div className="text-center">
          <Link href="/gallery">
  <button className="bg-white text-black px-8 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl">
    View
  </button>
</Link>
            <p className="mt-6 text-gray-500 text-sm md:text-base">
              placeholder 
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">ELECTRAS.er</h3>
              <p className="text-gray-400 mb-6 text-sm md:text-base">
                made with ❤️ by ER.
              </p>
              <a href="mailto:hello@example.com" className="text-lg md:text-xl hover:text-gray-300 transition-colors">
                hello@example.com
              </a>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Navigation</h4>
              <ul className="space-y-2 text-gray-400 text-sm md:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Work</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Social</h4>
              <ul className="space-y-2 text-gray-400 text-sm md:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dribbble</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs md:text-sm">©2025 All rights reserved.</p>
            <div className="flex gap-6 text-gray-400 text-xs md:text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}