import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logo from '../../img/logo.png';

const Footer = () => {
  /* Nhóm link điều hướng */
  const shopLinks = [
    { label: 'Nguồn gốc',   href: '/origin'  },
    { label: 'Dịch vụ',     href: '/services' },
    { label: 'Nghề nghiệp', href: '/careers'  },
    { label: 'Liên hệ',     href: '/contact'  },
  ];

  const storeLinks = [
    { label: 'Tìm cửa hàng gần nhất', href: '/find-store' },
  ];

  const newsLinks = [
    { label: 'Sự kiện mới', href: '/news' },
    { label: 'Blog chia sẻ', href: '/blog' },
  ];

  /* Mạng xã hội — dùng Bootstrap Icons */
  const socialLinks = [
    { icon: 'bi-facebook',  href: 'https://facebook.com',  label: 'Facebook'  },
    { icon: 'bi-instagram', href: 'https://instagram.com', label: 'Instagram' },
    { icon: 'bi-youtube',   href: 'https://youtube.com',   label: 'YouTube'   },
    { icon: 'bi-tiktok',    href: 'https://tiktok.com',    label: 'TikTok'    },
  ];

  return (
    <>
      <footer className="site-footer">
        {/* Dải màu trang trí */}
        <div className="footer__strip" />

        <div className="footer__body">
          {/* Logo + bản quyền */}
          <div className="footer__brand">
            <Link to="/">
              <img src={logo} alt="Shop Tươi" className="footer__logo-img" />
            </Link>
            <p className="footer__copy">©2026 Tươi.<br />All rights reserved.</p>
          </div>

          {/* Ba nhóm link */}
          <div className="footer__links-grid">
            <div>
              <h4 className="footer__col-title">Thông tin shop</h4>
              <ul className="footer__link-list">
                {shopLinks.map(l => (
                  <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="footer__col-title">Hệ thống cửa hàng</h4>
              <ul className="footer__link-list">
                {storeLinks.map(l => (
                  <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="footer__col-title">Tin tức</h4>
              <ul className="footer__link-list">
                {newsLinks.map(l => (
                  <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social + bản đồ */}
          <div className="footer__right">
            <h4 className="footer__col-title">Theo dõi chúng tôi</h4>

            <div className="footer__social">
              {socialLinks.map(s => (
                <a
                  key={s.href}
                  href={s.href}
                  className="footer__social-btn"
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={`bi ${s.icon}`} />
                </a>
              ))}
            </div>

            <iframe
              title="Bản đồ cửa hàng"
              className="footer__map-iframe"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.66!2d106.634!3d10.7439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752e7c31d45151%3A0x66f6885368a1837c!2zSOG7kyBDaMOtIE1pbmgsIFRowG3mgZtuZyBI4buFdQ!5e0!3m2!1svi!2s!4v1715000000000"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              className="footer__map-link"
              href="https://maps.app.goo.gl/6RuUrqKaYAFspPe57"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở trong Google Maps ↗
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer__bottom">
          Thiết kế bởi <strong>Tươi</strong> · Mọi quyền được bảo lưu
        </div>
      </footer>

      {/* Nút chat floating */}
      <a
        href="https://m.me/"
        className="chat-float"
        aria-label="Chat với chúng tôi"
        target="_blank"
        rel="noopener noreferrer"
        title="Chat với chúng tôi"
      >
        <i className="bi bi-chat-dots-fill" />
      </a>
    </>
  );
};

export default Footer;