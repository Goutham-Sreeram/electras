"use client";

import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Simple text animation component
function TextAnimate({ children, className }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, [children]);

  return (
    <div
      className={`${className} transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      key={children}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showModel, setShowModel] = useState(false);
  const canvasRef = useRef(null);

  const words = ["smart", "bold", "connected"];

  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 300),
      setTimeout(() => setShowText(true), 600),
      setTimeout(() => setCurrentWordIndex(1), 1200),
      setTimeout(() => setCurrentWordIndex(2), 1800),
      setTimeout(() => setShowModel(true), 2400),
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

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
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
    let animationId = null;

    // Object to store scroll-controlled rotation
    const scrollRotation = { value: 0 };

    // ScrollTrigger for model rotation
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        scrollRotation.value = self.progress * Math.PI * 4; // 4 full rotations
      },
    });

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (model) {
        // Apply scroll-based rotation
        model.rotation.y = scrollRotation.value * 0.05;
        model.rotation.x = scrollRotation.value * 0.5;
        // model.rotation.z = scrollRotation.value;
      }

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

        // Material + shadow setup
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

  // Horizontal scroll for text
  useEffect(() => {
    if (!showModel) return;

    const textContainer = document.querySelector("#text-container > div");
    if (!textContainer) return;

    gsap.to(textContainer, {
      x: () => -(textContainer.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === document.body) {
          trigger.kill();
        }
      });
    };
  }, [showModel]);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.cdnfonts.com/css/pp-neue-montreal");
        body {
          font-family: "PP Neue Montreal", sans-serif;
          background-color: black;
          margin: 0;
        }
      `}</style>

      {/* Add scrollable height */}
      <div className="h-[400vh] bg-black">
        <div className="sticky top-0 w-full h-screen bg-black overflow-hidden">
          {/* Top & Bottom Bars */}
          <div
            className="absolute left-0 right-0 top-0 bg-white transition-all duration-[4000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{
              height: open ? "0%" : "50%",
            }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-white transition-all duration-[4000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-10"
            style={{
              height: open ? "0%" : "50%",
            }}
          />

          {/* 3D Canvas */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-15 transition-opacity duration-1000 ${
              showModel ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Text Layer with horizontal scroll */}
          <div
            id="text-container"
            className={`absolute inset-0 flex flex-col items-center justify-center text-white z-0 transition-all duration-[1500ms] ${
              showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <div className="flex gap-[5vw] text-[10vw] font-medium leading-none tracking-tight">
              {words.map((word, i) => (
                <span key={i} className="word-item whitespace-nowrap">
                  {word}
                </span>
              ))}
            </div>

            {/* Labels */}
            <span className="absolute bottom-8 left-8 text-xs opacity-70">002</span>
            <span className="absolute top-8 right-8 text-xs opacity-70">©2025</span>
          </div>
        </div>
      </div>
    </>
  );
}