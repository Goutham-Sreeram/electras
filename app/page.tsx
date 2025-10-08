"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Optimized text animation component with memoization
function TextAnimate({ children, className }) {
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
  
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const nextSectionRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const modelRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const mixerRef = useRef(null);

  const words = ["smart", "bold", "connected"];
  const scrollWords = ["innovative", "creative", "dynamic", "future"];

  // Reset scroll position
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  // Initial sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 100),
      setTimeout(() => setShowText(true), 1200),
      setTimeout(() => setCurrentWordIndex(1), 1800),
      setTimeout(() => setCurrentWordIndex(2), 2400),
      setTimeout(() => {
        setShowText(false);
        setTimeout(() => {
          setShowModel(true);
          setShowBackgroundText(true);
        }, 800);
      }, 3000),
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
    const tl = gsap.timeline({
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

    let animationId = null;

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

    // Load model
    (async () => {
      try {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const loader = new GLTFLoader();

        const gltf = await loader.loadAsync("/model2/scene.gltf");
        const model = gltf.scene;
        modelRef.current = model;

        model.traverse((child) => {
          if (child.isMesh) {
            if (window.innerWidth > 768) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
            if (child.material?.isMeshStandardMaterial) {
              child.material.roughness = 0.7;
              child.material.metalness = 0.3;
              child.material.needsUpdate = true;
            }
          }
        });

        // Center & scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (window.innerWidth < 768 ? 3 : 4) / maxDim;
        model.scale.setScalar(scale);
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;

        scene.add(model);

        // Animations
        if (gltf.animations && gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
            action.timeScale = 0.5;
          });
        }

        animate();
      } catch (err) {
        console.error("Model load error:", err);
      }
    })();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
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
            className="absolute left-0 right-0 top-0 bg-black transition-all duration-[4000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{ height: open ? "0%" : "50%" }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-black transition-all duration-[4000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{ height: open ? "0%" : "50%" }}
          />

          {/* 3D Canvas */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-45 transition-opacity duration-1000 ${
              showModel ? "opacity-100" : "opacity-0"
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

          {/* Initial Text Layer */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center text-black z-20 transition-all duration-800 px-4 ${
              showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <TextAnimate className="text-[10vw] md:text-[10vw] text-responsive font-medium leading-none tracking-[-0.02em]">
              {words[currentWordIndex]}
            </TextAnimate>

            <span className="absolute bottom-4 md:bottom-8 left-4 md:left-8 text-[10px] md:text-xs opacity-70">002</span>
            <span className="absolute top-4 md:top-8 right-4 md:right-8 text-[10px] md:text-xs opacity-70">©2025</span>
          </div>

          {/* Horizontal Scroll Text Layer */}
          <div
            id="text-container"
            className={`absolute inset-0 flex flex-col items-center justify-center z-25 transition-all duration-500 px-4 ${
              showBackgroundText ? "opacity-100" : "opacity-0"
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
        className={`next-section min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center ${
          showNextSection ? 'visible' : ''
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <TextAnimate className="text-4xl md:text-6xl font-medium mb-6 md:mb-8">
            Welcome to the Next Chapter
          </TextAnimate>
          <TextAnimate className="text-lg md:text-xl text-gray-300 mb-8 md:mb-12 px-4">
            Where innovation meets execution and creativity transforms into reality.
          </TextAnimate>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="p-4 md:p-6">
              <h3 className="text-xl md:text-2xl font-medium mb-3 md:mb-4">Innovation</h3>
              <p className="text-sm md:text-base text-gray-300">Pushing boundaries with cutting-edge technology and forward-thinking solutions.</p>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xl md:text-2xl font-medium mb-3 md:mb-4">Creativity</h3>
              <p className="text-sm md:text-base text-gray-300">Transforming ideas into visually stunning and functionally brilliant experiences.</p>
            </div>
            <div className="p-4 md:p-6">
              <h3 className="text-xl md:text-2xl font-medium mb-3 md:mb-4">Excellence</h3>
              <p className="text-sm md:text-base text-gray-300">Delivering exceptional quality and performance in every project we undertake.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}