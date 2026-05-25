import React, { useState, useEffect } from "react";
import "./Banner.css";
import { bannerList } from "../../utils/bannerImages";

const Banner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const banners = bannerList;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };
  useEffect(() => {
    if (isHovered || banners.length === 0) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isHovered, banners.length]);
  if (banners.length === 0) return null;
  return (
    <div
      className="banner-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="banner-wrapper">
        {banners.map((banner, index) => (
          <div key={index} className={`banner-slide ${index === currentIndex ? "active" : ""}`}>
            <img src={banner} alt={`Banner ${index + 1}`} className="banner-image" />
          </div>
        ))}
      </div>

      <button className="banner-control prev" onClick={prevSlide}>
        &#10094;
      </button>
      <button className="banner-control next" onClick={nextSlide}>
        &#10095;
      </button>

      <div className="banner-dots">
        {banners.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Banner;