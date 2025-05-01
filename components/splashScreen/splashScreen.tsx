'use client';
import { useEffect, useState } from "react";
import styles from "@/styles/splashScreen.module.scss";

const SplashScreen = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3 seconds (adjust timing if needed)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) return null; // Remove from DOM when done

  return (

     <>
       <div className={styles.splashContainer}>
      <div className={styles.div}>
        <span>P</span><span>I</span><span>C</span><span>K</span><span>C</span><span>R</span><span>E</span>
        <span>A</span><span>T</span><span>O</span><span>R</span>
      </div>
    </div>
     </>

  );
};

export default SplashScreen;
