'use client';

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { 
  ChartBarIcon, 
  HeartIcon, 
  ChatBubbleBottomCenterTextIcon, 
  MusicalNoteIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { Engine } from "tsparticles-engine";

const headlines = [
  "Discover Your Music Personality",
  "Visualize Your Musical Story",
  "Track Your Musical Moods",
  "Explore Your Music Taste",
  "Connect With Your Music"
];

const features = [
  {
    icon: ChartBarIcon,
    title: "Music Analytics",
    description: "Get deep insights into your listening habits with beautiful visualizations",
    delay: "0"
  },
  {
    icon: HeartIcon,
    title: "Mood Tracking",
    description: "Understand how music influences your emotions over time",
    delay: "600"
  },
  {
    icon: ChatBubbleBottomCenterTextIcon,
    title: "AI Music Journal",
    description: "Chat with Melodi about your musical journey and get personalized insights",
    delay: "1200"
  },
  {
    icon: MusicalNoteIcon,
    title: "Genre Analysis",
    description: "Discover your music taste through detailed genre breakdowns",
    delay: "1800"
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.04, 0.62, 0.23, 0.98]
    }
  }
};

const FloatingSparkle = ({ delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ 
        opacity: [0, 1, 0],
        y: -20,
        transition: {
          duration: 2,
          delay,
          repeat: Infinity,
          repeatDelay: 3
        }
      }}
      className="absolute"
    >
      <SparklesIcon className="w-4 h-4 text-purple-300/40" />
    </motion.div>
  );
};

const MusicWave = () => {
  const controls = useAnimation();
  
  useEffect(() => {
    controls.start({
      height: [4, 20, 4],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
        repeatType: "reverse",
      }
    });
  }, [controls]);

  return (
    <div className="flex items-end space-x-1 h-6">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-purple-400/30 rounded-full"
          animate={controls}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
};

const headlineVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentHeadline, setCurrentHeadline] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState<number | null>(null);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesConfig = {
    particles: {
      number: { value: 30, density: { enable: true, value_area: 800 } },
      color: { value: "#ffffff" },
      opacity: {
        value: 0.1,
        random: true,
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.1,
          sync: false
        }
      },
      size: {
        value: 3,
        random: true,
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 0.1,
          sync: false
        }
      },
      move: {
        enable: true,
        speed: 0.5,
        direction: "none" as const,
        random: true,
        straight: false,
        outModes: "out" as const
      }
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
        onClick: { enable: true, mode: "push" }
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { quantity: 4 }
      }
    },
    background: {
      color: "transparent"
    }
  };

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      // Wait for exit animation to complete before changing the headline
      setTimeout(() => {
        setCurrentHeadline((current) => (current + 1) % headlines.length);
        
        // Reset transitioning state after a small delay to allow new content to animate in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 1000);
    }, 6000); // Increased from 5000ms to 6000ms to allow for longer transitions
    
    return () => clearInterval(interval);
  }, []);

  const handleSpotifySignIn = async () => {
    try {
      console.log('Starting Spotify sign in...');
      const result = await signIn("spotify", { 
        callbackUrl: "/",
        redirect: true,
      });
      
      if (result?.error) {
        console.error('Spotify sign in error:', result.error);
      }
    } catch (error) {
      console.error('Spotify sign in error:', error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="h-12 w-12 border-t-2 border-b-2 border-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 relative overflow-hidden">
      <Particles
        className="absolute inset-0"
        init={particlesInit}
        options={particlesConfig}
      />
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 gap-16 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-3xl space-y-12 text-center lg:text-left"
        >
          <div className="space-y-8">
            <motion.div 
              className="flex flex-col items-center lg:items-start gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <Image
                  src="/melodi.png"
                  alt="Melodi"
                  width={56}
                  height={56}
                  className="w-14 h-14"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-purple-400 rounded-full blur-xl -z-10"
                />
              </div>
              <motion.h1 
                className="text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                melodi
              </motion.h1>
            </motion.div>
            <div className="h-[72px] flex items-center justify-center lg:justify-start overflow-hidden relative">
              <AnimatePresence mode="crossfade">
                <motion.h2 
                  key={currentHeadline}
                  className="text-4xl sm:text-5xl font-bold tracking-tight text-white absolute left-0 right-0 mx-auto lg:mx-0 text-center lg:text-left"
                  variants={headlineVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ 
                    duration: 1.5,
                    ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier curve for smoother easing
                  }}
                >
                  {headlines[currentHeadline]}
                </motion.h2>
              </AnimatePresence>
            </div>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Melodi transforms your Spotify listening history into a beautiful, 
              AI-powered experience that helps you understand your musical taste 
              and emotional connection to music.
            </motion.p>
          </div>
          
          {/* Enhanced Sign In Button */}
          <motion.button
            onClick={handleSpotifySignIn}
            className="group relative w-full sm:w-auto min-w-[260px] py-4 px-8 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-white font-semibold text-lg rounded-xl overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.1) 0%, transparent 50%)"
              }}
            />
            <div className="flex items-center justify-center space-x-3 z-10">
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <div className="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-700 ease-in-out">
                  <Image
                    src="/spotify-icon.png"
                    alt="Spotify"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
              </div>
              <span>Connect with Spotify</span>
            </div>
          </motion.button>
        </motion.div>

        {/* Features Grid with Enhanced Hover */}
        <motion.div 
          className="w-full max-w-2xl grid sm:grid-cols-2 gap-7"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title}
              variants={item}
              className="group relative bg-white/10 backdrop-blur-lg rounded-xl p-7 cursor-default"
              onMouseEnter={() => setIsHovered(index)}
              onMouseLeave={() => setIsHovered(null)}
              whileHover={{ 
                scale: 1.02,
                backgroundColor: "rgba(255,255,255,0.15)" 
              }}
            >
              <motion.div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.1) 0%, transparent 70%)"
                }}
              />
              <motion.div 
                className="relative w-10 h-10 mb-5"
                whileHover={{ rotate: 5 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-purple-500/20 rounded-lg"
                  animate={isHovered === index ? {
                    rotate: [0, 12, -12, 0],
                    scale: [1, 1.1, 1.1, 1],
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <div className="relative bg-purple-500 rounded-lg p-2.5 z-10">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
              </motion.div>
              <div className="space-y-2 relative">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  {isHovered === index && <MusicWave />}
                </div>
                <p className="text-base text-gray-300 group-hover:text-white transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.footer 
        className="text-center py-6 text-gray-400 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <p>Your data is private and secure. Melodi only accesses your Spotify listening history.</p>
      </motion.footer>
    </div>
  );
} 