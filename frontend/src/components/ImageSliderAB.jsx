import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders } from 'lucide-react';

export default function ImageSliderAB({ imageA, imageB, labelA = 'Cover A', labelB = 'Cover B' }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '360px',
        aspectRatio: '2/3',
        margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-glass-light)',
        cursor: 'col-resize',
        userSelect: 'none',
      }}
    >
      {/* Background Image B */}
      <img
        src={imageB}
        alt={labelB}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <span style={{ position: 'absolute', top: '10px', right: '10px', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(17, 24, 39, 0.8)', color: '#FFF', fontSize: '0.75rem', fontWeight: '700', zIndex: 5 }}>
        {labelB}
      </span>

      {/* Foreground Clipped Image A */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${sliderPosition}%`,
          overflow: 'hidden',
        }}
      >
        <img
          src={imageA}
          alt={labelA}
          style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: containerRef.current ? `${containerRef.current.clientWidth}px` : '360px', maxWidth: 'none', objectFit: 'cover' }}
        />
        <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(99, 102, 241, 0.9)', color: '#FFF', fontSize: '0.75rem', fontWeight: '700', zIndex: 5 }}>
          {labelA}
        </span>
      </div>

      {/* Interactive Divider Line & Handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: '3px',
          backgroundColor: 'var(--accent-primary)',
          boxShadow: '0 0 10px rgba(99, 102, 241, 0.8)',
          zIndex: 10,
          transform: 'translateX(-50%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.9)',
          }}
        >
          <Sliders size={16} />
        </div>
      </div>
    </div>
  );
}
