"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal";
import PrismaticBurst from "@/components/prism";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
function TextAnimate({ children, className }) {
  return <div className={`animate-fade-in ${className}`}>{children}</div>;
}

export default function GalleryPage() {
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null); // For modal

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setLoaded(true), 400);
  }, []);

  const images = [
    {
      src: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=800&h=1200&fit=crop",
      desc: "A serene landscape at dawn",
    },
    {
      src: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&h=800&fit=crop",
      desc: "Urban streets full of energy",
    },
    {
      src: "https://images.unsplash.com/photo-1517817748493-6f36569e5f5b?w=800&h=1000&fit=crop",
      desc: "Calm waves hitting the shore",
    },
    {
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&h=800&fit=crop",
      desc: "Golden hour over the mountains",
    },
    {
      src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&h=1200&fit=crop",
      desc: "Misty forest in the morning",
    },
    {
      src: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=900&fit=crop",
      desc: "Night city lights reflecting",
    },
    {
      src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop",
      desc: "Desert dunes under the sun",
    },
    {
      src: "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1000&h=1000&fit=crop",
      desc: "Snowy peaks at sunset",
    },
  ];

  return (
    <>
      {/* Global Styles */}
      <style jsx global>{`
        @import url("https://fonts.cdnfonts.com/css/pp-neue-montreal");
        * { box-sizing: border-box; }
        body { font-family: "PP Neue Montreal", sans-serif; background: black; color: white; margin: 0; overflow-x: hidden; }
        body::-webkit-scrollbar { display: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .masonry { column-count: 1; column-gap: 16px; }
        @media (min-width: 640px) { .masonry { column-count: 2; } }
        @media (min-width: 768px) { .masonry { column-count: 3; } }
        @media (min-width: 1024px) { .masonry { column-count: 4; } }
        .masonry-item { break-inside: avoid; margin-bottom: 16px; opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out; position: relative; cursor: pointer; }
        .masonry-item.loaded { opacity: 1; transform: translateY(0); }
        .masonry-item img { width: 100%; height: auto; display: block; border-radius: 1rem; }
        .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; text-align: center; padding: 1rem; }
        .masonry-item:hover .overlay { opacity: 1; }
      `}</style>

      {/* Hero Section */}
      <section className="relative w-full h-[100vh] flex flex-col items-center justify-center text-center overflow-hidden">
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={1.0}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={24}
          mixBlendMode="lighten"
          colors={['#ff007a', '#9d3dff', '#ffffff']}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
          <VerticalCutReveal
            splitBy="characters"
            staggerDuration={0.05}
            staggerFrom="center"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.3,
            }}
            className="text-[12vw] md:text-[8vw] font-medium leading-none tracking-[-0.02em] mb-6"
          >
            Gallery
          </VerticalCutReveal>

          <TextAnimate className="text-gray-300 text-lg md:text-xl max-w-2xl">
            A curated collection of moments, visuals, and creative energy.
          </TextAnimate>

          <div className="mt-10">
            <Link href="/" className="inline-block">
              <button className="bg-white text-black px-8 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl">
                Back Home
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Masonry Grid Section */}
      <section className="bg-black text-white py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <TextAnimate className="text-4xl md:text-6xl font-semibold mb-4">
            Explore More Works
          </TextAnimate>
          <p className="text-gray-400 text-base md:text-lg">
            Every image captures a story — explore, feel, and imagine.
          </p>
        </div>

        <div className="masonry">
          {images.map((item, i) => (
            <motion.div
              key={i}
              className="masonry-item rounded-2xl shadow-2xl overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onClick={() => setSelected(item)}
            >
              <img src={item.src} alt={`Gallery ${i + 1}`} />
              <div className="overlay text-white text-lg md:text-xl font-medium">
                {item.desc}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/">
            <button className="bg-white text-black px-8 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl font-medium hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              Return Home
            </button>
          </Link>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="relative max-w-3xl w-full mx-4 md:mx-0 p-4 md:p-6 bg-black rounded-2xl shadow-2xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selected.src} alt="Selected" className="w-full h-auto rounded-xl mb-4" />
              <p className="text-white text-center text-lg md:text-xl">{selected.desc}</p>
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 text-white text-2xl font-bold hover:text-gray-300"
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
