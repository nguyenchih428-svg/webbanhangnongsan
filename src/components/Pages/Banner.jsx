import React, { useState, useEffect } from 'react';
import './Banner.css';
import ban1Image from '../../img/ban1.png';
import ban2Image from '../../img/ban2.png';

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const banners = [ban1Image, ban2Image];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 10000); // Chuyển đổi mỗi 10 giây
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="banner-carousel">
      <div className="banner-wrapper">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`banner-slide ${index === currentIndex ? 'active' : ''}`}
          >
            <img
              src={banner}
              alt={`Banner ${index + 1}`}
              className="banner-image"
            />
          </div>
        ))}
      </div>

      {/* Dots indicator (optional) */}
      <div className="banner-dots">
        {banners.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Banner;