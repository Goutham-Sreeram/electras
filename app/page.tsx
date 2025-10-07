"use client";

import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal";
import { FlickeringGrid } from "@/components/ui/flickering-grid"

gsap.registerPlugin(ScrollTrigger);

// Simple text animation component
function TextAnimate({ children, className }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, [children]);

  return (
    <VerticalCutReveal
      splitBy="characters"
      staggerDuration={0.025}
      staggerFrom="first"
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 21,
      }}
      containerClassName={className}
      key={children}
    >
      {children}
    </VerticalCutReveal>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showModel, setShowModel] = useState(false);
  const [showBackgroundText, setShowBackgroundText] = useState(false);
  const [circleScale, setCircleScale] = useState(0);
  const [showNextSection, setShowNextSection] = useState(false);
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const nextSectionRef = useRef(null);

  const words = ["smart", "bold", "connected"];
  const scrollWords = ["innovative", "creative", "dynamic", "future"];

  // Reset scroll position to top on refresh
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    
    // Prevent scroll restoration on page navigation
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 100),
      setTimeout(() => setShowText(true), 1200),
      setTimeout(() => setCurrentWordIndex(1), 1800),
      setTimeout(() => setCurrentWordIndex(2), 2400),
      // After text animation completes, fade out text then show model and background text
      setTimeout(() => {
        setShowText(false);
        // Wait for text fade out to complete before showing model and background text
        setTimeout(() => {
          setShowModel(true);
          setShowBackgroundText(true);
        }, 800); // Match this with the CSS transition duration
      }, 3000),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // THREE + GSAP ScrollTrigger integration
  useEffect(() => {
    if (!showModel || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(10, 10, 10);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.0);
    fillLight.position.set(-10, 5, -10);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.0, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;

    let model = null;
    let mixer: THREE.AnimationMixer | null = null; // Animation mixer
    let animationId = null;

    // Scroll-based rotation with smooth easing - End when circle is fully expanded
    const scrollRotation = { value: 0 };
    const targetRotation = { value: 0 };

    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "+=300%", // Match the total scroll distance
      scrub: 1,
      onUpdate: (self) => {
        // Calculate progress based on when circle expansion completes (around 80% of total scroll)
        const totalScrollDistance = 4; // 400vh total
        const circleCompleteAt = 0.8; // Circle completes at 80% of total scroll
        
        if (self.progress <= circleCompleteAt) {
          // Normalize progress to 0-1 range for the active animation period
          const normalizedProgress = self.progress / circleCompleteAt;
          targetRotation.value = normalizedProgress * Math.PI * 4; // 4 full rotations
        } else {
          // Keep rotation at final value after circle completes
          targetRotation.value = Math.PI * 4;
        }
      },
    });

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Smooth catch-up easing - same easing as circle expansion
      const ease = 0.04;
      scrollRotation.value += (targetRotation.value - scrollRotation.value) * ease;

      if (model) {
        model.rotation.y = scrollRotation.value * 0.05;
        model.rotation.x = scrollRotation.value * 0.5;
      }

      // Update mixer for GLTF animations
      if (mixer) mixer.update(0.016); // ~60fps delta

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Load model
    (async () => {
      try {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const loader = new GLTFLoader();

        const gltf = await loader.loadAsync("/model2/scene.gltf");
        model = gltf.scene;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
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
        const scale = 4 / maxDim;
        model.scale.setScalar(scale);
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;

        scene.add(model);

        // Play animations if available
        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
            action.timeScale = 0.5; // slow down to 20% speed
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
      renderer.dispose();
      ScrollTrigger.killAll();
    };
  }, [showModel]);

  // Horizontal scroll text animation - End when circle is fully expanded
  useEffect(() => {
    if (!showBackgroundText) return;

    const textContainer = document.querySelector("#text-container > div");
    if (!textContainer) return;

    gsap.to(textContainer, {
      x: () => -(textContainer.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "+=300%", // Match total scroll distance
        scrub: 1,
        onUpdate: (self) => {
          // Stop horizontal movement when circle expansion completes
          const circleCompleteAt = 0.8;
          if (self.progress > circleCompleteAt) {
            // Keep the text at its final position
            textContainer.style.transform = `translateX(${-(textContainer.scrollWidth - window.innerWidth)}px)`;
          }
        },
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === document.body) {
          trigger.kill();
        }
      });
    };
  }, [showBackgroundText]);

  // Circle expansion animation and next section trigger - with same easing as 3D model
  useEffect(() => {
    const circleScaleRef = { value: 0 };
    const targetCircleScale = { value: 0 };
    let animationId = null;

    const animateCircle = () => {
      animationId = requestAnimationFrame(animateCircle);
      
      // Apply the same easing as the 3D model (0.04 ease factor)
      const ease = 0.04;
      circleScaleRef.value += (targetCircleScale.value - circleScaleRef.value) * ease;
      
      setCircleScale(circleScaleRef.value);
    };

    animateCircle();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY / scrollHeight;

      // Circle expands from 50% to 80% of total scroll
      if (scrolled >= 0.5 && scrolled <= 0.7) {
        const progress = (scrolled - 0.5) / 0.2; // Normalize to 0-1 range between 50%-80%
        targetCircleScale.value = progress;
      } else if (scrolled > 0.7) {
        targetCircleScale.value = 1; // Keep it fully expanded after 80%
        
        // Trigger next section only when circle is fully expanded
        if (!showNextSection) {
          setShowNextSection(true);
          // Smooth scroll to next section after a brief delay
          setTimeout(() => {
            gsap.to(window, {
              duration: 1,
              scrollTo: nextSectionRef.current,
              ease: "power2.inOut"
            });
          }, 300);
        }
      } else {
        targetCircleScale.value = 0;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [showNextSection]);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.cdnfonts.com/css/pp-neue-montreal");
        body {
          font-family: "PP Neue Montreal", sans-serif;
          background-color: white;
          margin: 0;
          color: black;
          overflow-x: hidden;
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        body::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        body {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        html {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        html::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .next-section {
          opacity: 0;
          transform: translateY(50px);
          
          background-color: black;
          color: white;
        }

        .next-section.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <div className="h-[400vh] bg-white" ref={sectionRef}>
        <div className="sticky top-0 w-full h-screen bg-{#F9F9F7} overflow-hidden">
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
            className={`absolute inset-0 z-45 transition-opacity duration-1000 ${showModel ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* Circular Expanding Background */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-5"
            style={{
              transform: `scale(${Math.max(circleScale, 0)})`,
              // Remove transition since we're handling animation in JS with the same easing
            }}
          >
            <div
              className="bg-black rounded-full"
              style={{
                width: "400vh",
                height: "400vh",
              }}
            />
          </div>

          {/* Initial Text Layer - Fades out after animation */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center text-black z-20 transition-all duration-800 ${showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
          >
            <TextAnimate className="text-[10vw] font-medium leading-none tracking-[-0.02em]">
              {words[currentWordIndex]}
            </TextAnimate>

            <span className="absolute bottom-8 left-8 text-xs opacity-70">002</span>
            <span className="absolute top-8 right-8 text-xs opacity-70">©2025</span>
          </div>

          {/* Horizontal Scroll Text Layer - Only appears after initial text fades out */}
          <div
            id="text-container"
            className={`absolute inset-0 flex flex-col items-center justify-center z-25 transition-opacity duration-1000 ${showBackgroundText ? "opacity-100" : "opacity-0"
              }`}
            style={{
              color: circleScale > 0.3 ? "white" : "black",
              transition: "color 0.5s ease",
            }}
          >
            <div className="flex gap-[5vw] text-[10vw] font-medium leading-none tracking-tight">
              {scrollWords.map((word, i) => (
                <TextAnimate key={i} className="word-item whitespace-nowrap">
                  {word}
                </TextAnimate>
              ))}
            </div>

            <span className="absolute bottom-8 left-8 text-xs opacity-70">002</span>
            <span className="absolute top-8 right-8 text-xs opacity-70">©2025</span>
          </div>
        </div>
      </div>

      {/* Next Section - Black background with white text */}
      <div 
        ref={nextSectionRef}
        className={`next-section min-h-screen bg-black text-white p-8 flex items-center justify-center ${showNextSection ? 'visible' : ''}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <TextAnimate className="text-6xl font-medium mb-8">
            Welcome to the Next Chapter
          </TextAnimate>
          <TextAnimate className="text-xl text-gray-300 mb-12">
            Where innovation meets execution and creativity transforms into reality.
          </TextAnimate>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <h3 className="text-2xl font-medium mb-4">Innovation</h3>
              <p className="text-gray-300">Pushing boundaries with cutting-edge technology and forward-thinking solutions.</p>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-medium mb-4">Creativity</h3>
              <p className="text-gray-300">Transforming ideas into visually stunning and functionally brilliant experiences.</p>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-medium mb-4">Excellence</h3>
              <p className="text-gray-300">Delivering exceptional quality and performance in every project we undertake.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}