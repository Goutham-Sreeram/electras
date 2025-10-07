"use client";

import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// Simple text animation component
function TextAnimate({ children, className }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    setVisible(true);
  }, [children]);

  return (
    <div 
      className={`${className} transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
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

  // Three.js GLTF model setup
  useEffect(() => {
    if (!showModel || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lighting for the model
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // Main directional light with shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(1, 2, 3);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.001;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    
    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 0, -2);
    scene.add(fillLight);

    camera.position.z = 5;

    let model = null;
    let animationId = null;

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (model) {
        model.rotation.x += 0.005;
        model.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // Load GLTF model
    (async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader = new GLTFLoader();
        
        const gltf = await loader.loadAsync('/model/scene.gltf', (progress) => {
          console.log('Loading:', (progress.loaded / progress.total * 100) + '%');
        });
        
        model = gltf.scene;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.setScalar(scale);
        
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;
        
        scene.add(model);
        
        // Start animation
        animate();
        window.addEventListener('resize', handleResize);
        
      } catch (error) {
        console.error('Error loading model:', error);
      }
    })();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId !== null) cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, [showModel]);

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

        {/* 3D Canvas Layer */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-15 transition-opacity duration-1000 ${
            showModel ? "opacity-100" : "opacity-0"
          }`}
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