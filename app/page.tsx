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
  const [showCube, setShowCube] = useState(false);
  const canvasRef = useRef(null);
  
  const words = ["smart", "bold", "connected"];

  useEffect(() => {
    const timers = [
      setTimeout(() => setOpen(true), 300),
      setTimeout(() => setShowText(true), 600),
      setTimeout(() => setCurrentWordIndex(1), 1200),
      setTimeout(() => setCurrentWordIndex(2), 1800),
      setTimeout(() => setShowCube(true), 2400), // Show cube after text animations
    ];

    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Three.js cube setup
  useEffect(() => {
    if (!showCube || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create cube with wireframe
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const cube = new THREE.LineSegments(edges, material);
    scene.add(cube);

    camera.position.z = 5;

    // Animation
    let animationId;
    function animate() {
      animationId = requestAnimationFrame(animate);
      cube.rotation.x += 0.005;
      cube.rotation.y += 0.005;
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      geometry.dispose();
      edges.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [showCube]);

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
            showCube ? "opacity-100" : "opacity-0"
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