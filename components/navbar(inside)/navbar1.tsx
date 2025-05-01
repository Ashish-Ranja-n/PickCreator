import React from 'react';
import "@/app/globals.css";
import styles from '@/styles/myComponent1.module.css';
import { motion } from 'framer-motion';

const Navbar1: React.FC = () => {
  return (
   <>
    <div className='fixed top-0 left-0 right-0 z-50'>
      <div className='z-50 backdrop-blur-md bg-black/95 border-b border-zinc-800/50 py-3 flex items-center justify-between overflow-hidden px-6 relative'>
        {/* Particle background */}
        <div className="particle-container absolute inset-0 overflow-hidden">
          <div className="particle p1"></div>
          <div className="particle p2"></div>
          <div className="particle p3"></div>
          <div className="particle p4"></div>
          <div className="particle p5"></div>
          <div className="particle p6"></div>
          <div className="particle p7"></div>
          <div className="particle p8"></div>
          <div className="particle p9"></div>
          <div className="particle p10"></div>
          <div className="particle p11"></div>
          <div className="particle p12"></div>
        </div>

        {/* Glowing gradient accent */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500"
          initial={{ opacity: 0.7, backgroundPosition: "0% 50%" }}
          animate={{
            opacity: [0.7, 0.9, 0.7],
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className={styles.deconstructed}>
          PICKCREATOR
          <div>PICKCREATOR</div>
          <div>PICKCREATOR</div>
          <div>PICKCREATOR</div>
          <div>PICKCREATOR</div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .particle-container {
        pointer-events: none;
        z-index: -1;
      }

      .particle {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(139, 92, 246, 0.6),
          rgba(192, 38, 211, 0.1)
        );
        box-shadow: 0 0 8px rgba(192, 38, 211, 0.6),
                    inset 0 0 12px rgba(139, 92, 246, 0.4);
        filter: blur(0.5px);
        animation: float 8s infinite ease-in-out;
      }

      .p1 {
        width: 4px;
        height: 4px;
        left: 10%;
        top: 100%;
        animation-duration: 6s;
        animation-delay: 0.2s;
      }

      .p2 {
        width: 3px;
        height: 3px;
        left: 20%;
        top: 100%;
        animation-duration: 9s;
        animation-delay: 0.8s;
      }

      .p3 {
        width: 2px;
        height: 2px;
        left: 30%;
        top: 100%;
        animation-duration: 7s;
        animation-delay: 1.5s;
      }

      .p4 {
        width: 3px;
        height: 3px;
        left: 40%;
        top: 100%;
        animation-duration: 10s;
        animation-delay: 0.5s;
      }

      .p5 {
        width: 2px;
        height: 2px;
        left: 50%;
        top: 100%;
        animation-duration: 8s;
        animation-delay: 2s;
      }

      .p6 {
        width: 4px;
        height: 4px;
        left: 60%;
        top: 100%;
        animation-duration: 6.5s;
        animation-delay: 0.7s;
      }

      .p7 {
        width: 3px;
        height: 3px;
        left: 70%;
        top: 100%;
        animation-duration: 8.5s;
        animation-delay: 1.3s;
      }

      .p8 {
        width: 2px;
        height: 2px;
        left: 80%;
        top: 100%;
        animation-duration: 7.5s;
        animation-delay: 2.1s;
      }

      .p9 {
        width: 3px;
        height: 3px;
        left: 90%;
        top: 100%;
        animation-duration: 9s;
        animation-delay: 0.3s;
      }

      .p10 {
        width: 4px;
        height: 4px;
        left: 15%;
        top: 100%;
        animation-duration: 7s;
        animation-delay: 1.7s;
      }

      .p11 {
        width: 2px;
        height: 2px;
        left: 55%;
        top: 100%;
        animation-duration: 8s;
        animation-delay: 2.5s;
      }

      .p12 {
        width: 3px;
        height: 3px;
        left: 75%;
        top: 100%;
        animation-duration: 6.8s;
        animation-delay: 1s;
      }

      @keyframes float {
        0% {
          transform: translateY(0);
          opacity: 0;
        }
        5% {
          opacity: 0.8;
        }
        70% {
          opacity: 0.4;
        }
        100% {
          transform: translateY(-60px) rotate(180deg);
          opacity: 0;
        }
      }
    `}</style>
   </>
  );
};

export default Navbar1;