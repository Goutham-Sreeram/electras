"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Floating, { FloatingElement } from "@/components/fancy/image/parallax-floating";
import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const nextSectionRef = useRef<HTMLDivElement>(null);
  const finalSectionRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<{ rotation: number; circleScale: number; textX: number; } | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const scrollWords = ["","design", "innovate", "develop", "create", "engineer", "build", "transform", "lead", "inspire"];

  // Reset scroll position
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  //inital bars
  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 250), // start opening
      setTimeout(() => setShowText(true), 1800), // text fades in slowly
      setTimeout(() => setCurrentWordIndex(1), 2500),
      setTimeout(() => setCurrentWordIndex(2), 3500),
      setTimeout(() => {
        setShowText(false);
        setTimeout(() => {
          setShowModel(true);
          setShowBackgroundText(true);
        }, 800); // Match the transition duration of the vertical text
      }, 4500),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Auto-scroll to welcome section after intro animation
  useEffect(() => {
    if (!showModel || !nextSectionRef.current) return;

    const scrollTimer = setTimeout(() => {
      const targetElement = nextSectionRef.current;
      if (!targetElement) return;

      const targetPosition = targetElement.offsetTop;
      
      // Animate scroll using GSAP for smooth natural scrolling
      gsap.to(window, {
        scrollTo: targetPosition,
        duration: 4, // 4 seconds for smooth natural scroll
        ease: "power2.inOut"
      });
    }, 200); // Scroll after 0.2 seconds

    return () => clearTimeout(scrollTimer);
  }, [showModel]);


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
        scrub: 3,
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

    // Horizontal text scroll animation
    const textContainer = document.querySelector("#text-container > div");
    if (textContainer) {
      // Create a seamless loop by duplicating content
      const words = textContainer.innerHTML;
      textContainer.innerHTML = words + words; // Duplicate content
      
      const totalScroll = textContainer.scrollWidth / 2; // Half because we duplicated

      gsap.to(textContainer, {
  x: -totalScroll,
  duration: 24, // Smoother horizontal scroll
  ease: "none",
  repeat: -1
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
      antialias: false,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(2); // Lower pixel ratio for better performance
    renderer.shadowMap.enabled = false; // Disable shadows for better performance
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    // Optimized lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(10, 10, 10);
    keyLight.castShadow = false;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.0);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    camera.position.z = window.innerWidth < 768 ? 10 : 8; // Adjust camera for mobile

    // Load Raspberry Pi model
    const loader = new GLTFLoader();
    loader.load('/raspberry.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.05, 0.05, 0.05);
      
      // Center the model around its bounding box center
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -center.y, -center.z);
      
      // Create a group to hold the centered model
      const group = new THREE.Group();
      group.add(model);
      group.position.set(0, 0, 0);
      
      modelRef.current = group;
      scene.add(group);

      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      }
    });

    let animationId: number | null = null;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Diagonal spinning - rotate on both Y and X axes simultaneously
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.3 * delta;
        modelRef.current.rotation.x += 0.2 * delta;
      }

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.position.z = width < 768 ? 10 : 8;

      renderer.setSize(width, height);
      renderer.setPixelRatio(1);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      renderer.dispose();
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
          animation: fadeIn 0.5s ease-out forwards;
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
            font-size: 8vw !important;
            line-height: 1.1 !important;
          }
          
          .text-responsive-lg {
            font-size: 6vw !important;
            line-height: 1.1 !important;
          }
        }
        
        @media (max-width: 480px) {
          .text-responsive {
            font-size: 7vw !important;
          }
          
          .text-responsive-lg {
            font-size: 5vw !important;
          }
        }
      `}</style>

      <div className="h-[400vh] bg-white" ref={sectionRef}>
        <div className="sticky top-0 w-full h-screen bg-[#F9F9F7] overflow-hidden">
          {/* Top & Bottom Bars */}
          <div
            className="absolute left-0 right-0 top-0 bg-black transition-all duration-[5000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{ height: open ? "0%" : "50%" }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-black transition-all duration-[5000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{ height: open ? "0%" : "50%" }}
          />

          {/* 3D Canvas */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-[50] transition-opacity duration-1000 ${showModel ? "opacity-100" : "opacity-0"
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
                containerClassName="text-[8vw] sm:text-[10vw] md:text-[10vw] text-responsive font-medium leading-tight tracking-[-0.02em]"
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
                containerClassName="text-[8vw] sm:text-[10vw] md:text-[10vw] text-responsive font-medium leading-tight tracking-[-0.02em]"
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
                containerClassName="text-[8vw] sm:text-[10vw] md:text-[10vw] text-responsive font-medium leading-tight tracking-[-0.02em]"
              >
                connected
              </VerticalCutReveal>
            )}

            
            <span className="absolute top-4 md:top-8 right-4 md:right-8 text-[10px] md:text-xs opacity-70">
              ©2025
            </span>
          </div>


          {/* Horizontal Scroll Text Layer */}
          <div
            id="text-container"
            className={`absolute inset-0 flex flex-col items-center justify-center z-25 transition-all duration-500 px-4 overflow-hidden ${
              showBackgroundText ? "opacity-100" : "opacity-0"
            }`}
            style={{ color: textColor }}
          >
            {/* Create two sets of words for seamless looping */}
            <div className="flex whitespace-nowrap">
              <div className="flex gap-[3vw] sm:gap-[4vw] md:gap-[5vw] text-[6vw] sm:text-[8vw] md:text-[10vw] text-responsive-lg font-medium leading-none tracking-tight">
                {scrollWords.map((word, i) => (
                  <TextAnimate key={`word-${i}`} className="word-item">
                    {word}
                  </TextAnimate>
                ))}
              </div>
              <div className="flex gap-[3vw] sm:gap-[4vw] md:gap-[5vw] text-[6vw] sm:text-[8vw] md:text-[10vw] text-responsive-lg font-medium leading-none tracking-tight">
                {scrollWords.map((word, i) => (
                  <TextAnimate key={`word-copy-${i}`} className="word-item">
                    {word}
                  </TextAnimate>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Section */}
      <div
        ref={nextSectionRef}
        className={`next-section min-h-screen bg-black text-white px-4 md:p-8 ${showNextSection ? 'visible' : ''}`}
      >
        {/* Reduced top padding here */}
        <div className="max-w-4xl mx-auto text-center pt-4 md:pt-8">
          <TextAnimate className="text-4xl sm:text-5xl md:text-7xl font-medium mb-2">
            Welcome to
          </TextAnimate>
          <TextAnimate className="bg-white text-black text-6xl sm:text-7xl md:text-9xl font-medium mb-4">
            ELECTRAS
          </TextAnimate>
          <TextAnimate className="text-sm sm:text-lg md:text-3xl text-gray-300 mb-4 md:mb-8 px-2">
            Department Association of Electronics and Computer Engineering.
          </TextAnimate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 px-0 md:px-4">
            <div className="p-3 sm:p-4 md:p-6 bg-black/20 rounded-lg">
              <h3 className="text-xl sm:text-2xl md:text-4xl font-medium mb-2 md:mb-4">Vision</h3>
              <p className="text-sm sm:text-base md:text-xl text-gray-300">Develop into a centre of excellence in Electronics and Computer Engineering by producing technically competent professionals catering to the needs for Industry, Academia and Society.</p>
            </div>
            <div className="p-3 sm:p-4 md:p-6 bg-black/20 rounded-lg">
              <h3 className="text-xl sm:text-2xl md:text-4xl font-medium mb-2 md:mb-4">Mission</h3>
              <p className="text-sm sm:text-base md:text-xl text-gray-300">To pursue continuous improvement in learning, creativity and innovation among both faculty and students by enhanced infrastructure, state-of-the art laboratories and a unique learning environment. To inculcate in both faculty and students technical and entrepreneurial skills by professional activities to create socially relevant and sustainable solutions in the electronics and computer domain.</p>
            </div>
          </div>
        </div>
        <br/>
        <br/>
        <br/>
        <br/>

        <div className="flex flex-col gap-8 md:gap-16 max-w-6xl mx-auto py-8 md:py-16 px-3 sm:px-4 md:px-8">
          {/* First section */}
          <div className="flex flex-col gap-12 md:gap-32 max-w-6xl mx-auto py-8 md:py-16 px-0 md:px-0">
  <div>
    <TextAnimate className="text-2xl sm:text-3xl md:text-6xl font-medium mb-3 md:mb-6">
      About ELECTRAS
    </TextAnimate>
    <div className="mt-2 md:mt-4">
      <p className="text-sm sm:text-base md:text-2xl text-gray-300 leading-relaxed">
        ELECTRAS is a dynamic student organization driving innovation and leadership in Electronics and Computer Science Engineering. Our vision is to build a powerhouse community of engineers who challenge limits, redefine technology, and shape a smarter, more connected future. At ELECTRAS, creativity meets expertise. We empower students to transform ideas into reality through hands-on projects, transformative workshops, impactful research, and collaborations with industry leaders. By bridging theory and practice, we prepare our members to become innovators who lead change and create lasting impact. Rooted in collaboration, curiosity, and excellence, ELECTRAS nurtures a new generation of problem-solvers ready to tackle global challenges with sustainable, socially responsible, and forward-thinking solutions. ELECTRAS — where ambition, innovation, and engineering excellence converge to define tomorrow.
      </p>
    </div>
  </div>
  
  {/* Second section */}
  <div>
    <TextAnimate className="text-2xl sm:text-3xl md:text-6xl font-medium mb-3 md:mb-6">
      About Electronics and Computer Engineering
    </TextAnimate>
    <div className="mt-2 md:mt-4 mb-2 md:mb-4">
      <p className="text-sm sm:text-base md:text-2xl text-gray-300 leading-relaxed">
        Electronics and Computer Engineering  is an integrated discipline that bridges the worlds of hardware and software, preparing students to meet the evolving demands of modern technology industries. By merging these two dynamic fields, the program offers a strong foundation in both electronics and computing, enabling students to develop versatile skills and a deep understanding of cutting-edge technologies. This cross-disciplinary approach empowers aspiring engineers to pursue diverse career paths across sectors—ranging from core electronics to software development and emerging tech innovations. The result is a new generation of multi-skilled, forward-thinking professionals equipped to design intelligent systems, drive innovation, and shape the future of technology with creativity and precision.
      </p>
    </div>
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
          <FloatingElement depth={0.5} className="top-[12%] left-[5%] sm:top-[8%] sm:left-[8%]">
            <Image
              src="/content/p1.jpg"
              alt="Team member"
              width={128}
              height={128}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={1} className="top-[8%] right-[8%] sm:top-[12%] sm:left-[75%] hidden sm:block">
            <Image
              src="/content/p2.jpg"
              alt="Team member"
              width={160}
              height={160}
              className="w-16 h-16 sm:w-24 sm:h-24 md:w-40 md:h-40 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={2} className="top-[28%] left-[50%] -translate-x-1/2 sm:top-[5%] sm:left-[40%] sm:translate-x-0">
            <Image
              src="/content/p3.jpg"
              alt="Team member"
              width={176}
              height={240}
              className="w-20 h-28 sm:w-32 sm:h-48 md:w-44 md:h-60 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={1} className="bottom-[28%] left-[5%] sm:top-[45%] sm:left-[5%]">
            <Image
              src="/content/p4.jpg"
              alt="Team member"
              width={160}
              height={160}
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={3} className="bottom-[12%] right-[8%] sm:top-[60%] sm:left-[70%] hidden sm:block">
            <Image
              src="/content/p5.jpg"
              alt="Team member"
              width={192}
              height={256}
              className="w-24 h-36 sm:w-36 sm:h-52 md:w-48 md:h-64 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
          
          <FloatingElement depth={1.5} className="bottom-[5%] left-[50%] -translate-x-1/2 sm:top-[70%] sm:left-[25%] sm:translate-x-0">
            <Image
              src="/content/p6.jpg"
              alt="Team member"
              width={144}
              height={144}
              className="w-16 h-16 sm:w-24 sm:h-24 md:w-36 md:h-36 object-cover rounded-2xl hover:scale-105 duration-200 cursor-pointer transition-transform shadow-2xl"
            />
          </FloatingElement>
        </Floating>

        <div className="relative z-50 flex flex-col items-center justify-center min-h-screen p-4">
          <div className="max-w-4xl mx-auto text-center mb-12 md:mb-24">
            <TextAnimate className="text-3xl sm:text-4xl md:text-7xl font-bold mb-4 md:mb-8 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              View our Team
            </TextAnimate>
          </div>

          <div className="text-center">
          <Link href="/gallery">
  <button className="bg-white text-black px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-full text-sm sm:text-base md:text-xl font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl">
    View
  </button>
</Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mb-8 md:mb-12">
            <div className="col-span-1 sm:col-span-2 md:col-span-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">ELECTRAS</h3>
              <p className="text-gray-400 mb-4 md:mb-6 text-xs sm:text-sm md:text-base">
                made with ❤️ by ER.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-xs sm:text-sm md:text-base">Navigation</h4>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs sm:text-sm md:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Work</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-xs sm:text-sm md:text-base">Social</h4>
              <ul className="space-y-1 md:space-y-2 text-gray-400 text-xs sm:text-sm md:text-base">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dribbble</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">©2025 All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-gray-400 text-[10px] sm:text-xs md:text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}