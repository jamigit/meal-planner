import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Firework particle component
const FireworkParticle = ({ delay = 0, color = '#ffd700' }) => {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        x: [0, Math.random() * 200 - 100],
        y: [0, Math.random() * 200 - 100],
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: "easeOut"
      }}
    />
  )
}

// Confetti component
const Confetti = ({ delay = 0 }) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd']
  const color = colors[Math.floor(Math.random() * colors.length)]
  
  return (
    <motion.div
      className="absolute w-3 h-3"
      style={{ backgroundColor: color }}
      initial={{ opacity: 0, y: -20, rotate: 0 }}
      animate={{
        opacity: [0, 1, 0],
        y: [0, 300],
        rotate: [0, 360],
        x: Math.random() * 400 - 200,
      }}
      transition={{
        duration: 3,
        delay,
        ease: "easeOut"
      }}
    />
  )
}

// Streamer component
const Streamer = ({ delay = 0, direction = 'left' }) => {
  return (
    <motion.div
      className={`absolute top-0 w-1 bg-gradient-to-b from-white to-transparent ${
        direction === 'left' ? 'left-1/4' : 'right-1/4'
      }`}
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: ['0px', '200px', '150px'],
        opacity: [0, 1, 0.7],
      }}
      transition={{
        duration: 2,
        delay,
        ease: "easeOut"
      }}
    />
  )
}

// Main illustration component
const CelebrationIllustration = () => {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto mb-8">
      {/* Main celebration icon */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.6 }}
      >
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-green-200">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        </div>
      </motion.div>

      {/* Fireworks around the icon */}
      {[...Array(12)].map((_, i) => (
        <FireworkParticle
          key={`firework-${i}`}
          delay={0.8 + i * 0.1}
          color={['#ffd700', '#ffffff', '#ffff00', '#f0f8ff'][i % 4]}
        />
      ))}

      {/* Confetti particles */}
      {[...Array(20)].map((_, i) => (
        <Confetti key={`confetti-${i}`} delay={0.4 + i * 0.1} />
      ))}

      {/* Streamers */}
      <Streamer delay={0.2} direction="left" />
      <Streamer delay={0.4} direction="right" />
    </div>
  )
}

function SavePlanTransition({ isVisible, onComplete, message = "Well done!" }) {
  useEffect(() => {
    if (isVisible) {
      // Auto-complete after animation sequence
      const timer = setTimeout(() => {
        onComplete()
      }, 4000) // 4 seconds total

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Screen wipe animation - expanding circle from center */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600"
            initial={{ 
              clipPath: "circle(0% at 50% 50%)",
              opacity: 0
            }}
            animate={{ 
              clipPath: "circle(150% at 50% 50%)",
              opacity: 1
            }}
            transition={{ 
              duration: 1.2, 
              ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth expansion
            }}
          />
          <div className="text-center px-8 max-w-lg relative z-10">
            {/* Celebration illustration with animations - appears after wipe */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3, duration: 0.8, type: "spring", bounce: 0.6 }}
            >
              <CelebrationIllustration />
            </motion.div>

            {/* Main message - appears after wipe */}
            <motion.h1
              className="text-6xl font-black text-white mb-4 font-heading drop-shadow-lg"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              {message}
            </motion.h1>

            {/* Secondary message */}
            <motion.p
              className="text-xl text-green-100 mb-8 drop-shadow"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              Your meal plan has been saved successfully!
            </motion.p>

            {/* Loading indicator */}
            <motion.div
              className="flex items-center justify-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.5 }}
            >
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </motion.div>

            <motion.p
              className="text-sm text-green-100 mt-4 drop-shadow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 0.5 }}
            >
              Taking you to your saved plans...
            </motion.p>
          </div>

          {/* Additional background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating bubbles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`bubble-${i}`}
                className="absolute w-4 h-4 bg-white bg-opacity-50 rounded-full shadow-lg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  delay: 2 + i * 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SavePlanTransition
