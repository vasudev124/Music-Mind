import React, { useEffect, useRef } from "react";
import "./HeroSection.css";

const HeroSection = () => {
  const heroRef = useRef(null);

  // Subtle mouse parallax (micro-interaction)
  useEffect(() => {
    const hero = heroRef.current;

    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 10;
      const y = (e.clientY / innerHeight - 0.5) * 10;

      hero.style.setProperty("--mx", `${x}px`);
      hero.style.setProperty("--my", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section ref={heroRef} className="hero-minimal">
      <div className="hero-glass">
        <h1 className="hero-title">
          Welcome back to <br />
          <span>your music journey.</span>
        </h1>

        <div className="hero-scroll">
          Scroll to explore
          <span className="arrow">↓</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
