import React from 'react';
import "@/app/globals.css";
import styles from '@/styles/myComponent.module.css';

const Navbar: React.FC = () => {
  return (
   <>
    <div className='sticky top-0 z-50'>
      <div className='z-50 backdrop-blur-md bg-white/50 border-b border-slate-200 py-2 flex items-center justify-between overflow-hidden px-6 relative'>
        {/* Bubble background */}
        <div className="bubble-container absolute inset-0 overflow-hidden">
          <div className="bubble b1"></div>
          <div className="bubble b2"></div>
          <div className="bubble b3"></div>
          <div className="bubble b4"></div>
          <div className="bubble b5"></div>
          <div className="bubble b6"></div>
          <div className="bubble b7"></div>
          <div className="bubble b8"></div>
          <div className="bubble b9"></div>
          <div className="bubble b10"></div>
          <div className="bubble b11"></div>
          <div className="bubble b12"></div>
        </div>
        
        {/* Bright gradient accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>
        
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
      .bubble-container {
        pointer-events: none;
        z-index: -1;
      }
      
      .bubble {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(255, 255, 255, 0.6),
          rgba(255, 255, 255, 0.1)
        );
        box-shadow: 0 0 5px rgba(0, 238, 255, 0.5),
                    inset 0 0 10px rgba(255, 0, 128, 0.3);
        backdrop-filter: blur(1px);
        animation: float 8s infinite ease-in-out;
      }
      
      .b1 {
        width: 15px;
        height: 15px;
        left: 10%;
        top: 100%;
        animation-duration: 6s;
        animation-delay: 0.2s;
      }
      
      .b2 {
        width: 10px;
        height: 10px;
        left: 20%;
        top: 100%;
        animation-duration: 9s;
        animation-delay: 0.8s;
      }
      
      .b3 {
        width: 8px;
        height: 8px;
        left: 30%;
        top: 100%;
        animation-duration: 7s;
        animation-delay: 1.5s;
      }
      
      .b4 {
        width: 12px;
        height: 12px;
        left: 40%;
        top: 100%;
        animation-duration: 10s;
        animation-delay: 0.5s;
      }
      
      .b5 {
        width: 7px;
        height: 7px;
        left: 50%;
        top: 100%;
        animation-duration: 8s;
        animation-delay: 2s;
      }
      
      .b6 {
        width: 13px;
        height: 13px;
        left: 60%;
        top: 100%;
        animation-duration: 6.5s;
        animation-delay: 0.7s;
      }
      
      .b7 {
        width: 9px;
        height: 9px;
        left: 70%;
        top: 100%;
        animation-duration: 8.5s;
        animation-delay: 1.3s;
      }
      
      .b8 {
        width: 11px;
        height: 11px;
        left: 80%;
        top: 100%;
        animation-duration: 7.5s;
        animation-delay: 2.1s;
      }
      
      .b9 {
        width: 8px;
        height: 8px;
        left: 90%;
        top: 100%;
        animation-duration: 9s;
        animation-delay: 0.3s;
      }
      
      .b10 {
        width: 14px;
        height: 14px;
        left: 15%;
        top: 100%;
        animation-duration: 7s;
        animation-delay: 1.7s;
      }
      
      .b11 {
        width: 9px;
        height: 9px;
        left: 55%;
        top: 100%;
        animation-duration: 8s;
        animation-delay: 2.5s;
      }
      
      .b12 {
        width: 12px;
        height: 12px;
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
          opacity: 0.6;
        }
        70% {
          opacity: 0.3;
        }
        100% {
          transform: translateY(-80px) rotate(360deg);
          opacity: 0;
        }
      }
    `}</style>
   </>
  );
};

export default Navbar;