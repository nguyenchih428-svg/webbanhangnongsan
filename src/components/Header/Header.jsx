import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Header.css";
import logo from "../../img/logo.png";
import { imageMap } from "../../utils/Productimage";
import { rankProductsBySearch } from "../../utils/productSearch";

const jsonBase = import.meta.env.BASE_URL || "/";

const Header = () => {
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [q, setQ] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchBoxRef = useRef(null);
  const userMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const searchMatches = rankProductsBySearch(products, q, 5);
  const isActive = path => location.pathname === path;

  const updateCartCount = () => {
    const savedCart = localStorage.getItem("cart");
    if (!savedCart) {
      setCartCount(0);
      return;
    }
    try {
      const cart = JSON.parse(savedCart);
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 0), 0));
    } catch {
      setCartCount(0);
    }
  };

  const updateCurrentUser = () => {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
      setCurrentUser(null);
      return;
    }
    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    updateCartCount();
    updateCurrentUser();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("userUpdated", updateCurrentUser);

    const handleStorageChange = () => {
      updateCartCount();
      updateCurrentUser();
    };
    window.addEventListener("storage", handleStorageChange);

    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const header = document.querySelector(".raucu-header");
          if (header) {
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
              header.classList.add("header-hidden");
            } else {
              header.classList.remove("header-hidden");
            }
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("userUpdated", updateCurrentUser);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${jsonBase}products.json`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProducts(data);
      } catch (err) {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!searchFocused) return;
    const onPointerDown = e => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [searchFocused]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!currentUser) setUserMenuOpen(false);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUserMenuOpen(false);
    window.dispatchEvent(new Event("userUpdated"));
    navigate("/");
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
    setSearchFocused(false);
  };

  const goToProduct = product => {
    setQ("");
    setSearchFocused(false);
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const rauCuItems = [
    { label: "Rau lá xanh", href: "/rau-cu/rau-la-xanh" },
    { label: "Củ quả tươi", href: "/rau-cu/cu-qua" },
    { label: "Nấm các loại", href: "/rau-cu/nam" },
    { label: "Rau gia vị", href: "/rau-cu/rau-gia-vi" },
  ];

  const traiCayItems = [
    { label: "Trái cây nội địa", href: "/trai-cay/noi-dia" },
    { label: "Trái cây nhập khẩu", href: "/trai-cay/nhap-khau" },
    { label: "Trái cây sấy", href: "/trai-cay/say" },
  ];

  return (
    <>
      <header className="raucu-header">
        <div className="header-top-bar">
          <div className="header-top-content">
            <Link to="/" className="header-logo-link">
              <img src={logo} alt="Logo" className="header-logo-image" />
            </Link>

            <div className="header-search" ref={searchBoxRef}>
              <form className="header-search-form" onSubmit={handleSearchSubmit}>
                <i className="bi bi-search header-search-icon" />
                <input
                  className="header-search-input"
                  type="text"
                  placeholder="Tìm kiếm nông sản..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  autoComplete="off"
                />
                <button className="header-search-btn" type="submit">
                  Tìm kiếm
                </button>
              </form>

              {searchFocused && q.trim() && (
                <ul className="header-search-dropdown">
                  {searchMatches.length === 0 ? (
                    <li className="header-search-empty">Không tìm thấy sản phẩm.</li>
                  ) : (
                    searchMatches.map(p => (
                      <li key={p.id}>
                        <button className="header-search-option" type="button" onClick={() => goToProduct(p)}>
                          <img className="header-search-thumb" src={imageMap[p.imageKey] || "https://dummyimage.com/40x40/e8f8ef/27ae60&text=?"} alt={p.name} />
                          <span className="header-search-meta">
                            <span className="header-search-name">{p.name}</span>
                            {p.price && <span className="header-search-price">{p.price.toLocaleString('vi-VN')}đ</span>}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <div className="header-actions">
              <button className="cart-btn" onClick={() => navigate("/cart")}>
                <i className="bi bi-cart3" />
                <span className="cart-badge">{cartCount}</span>
              </button>

              <span className="action-sep">|</span>

              <div className="lang-switcher">
                <span className="lang-switcher-active">VN</span>
                <span className="lang-switcher-sep">|</span>
                <span className="lang-switcher-opt">EN</span>
              </div>

              {currentUser ? (
                <div className="user-menu" ref={userMenuRef}>
                  <button className="user-btn" onClick={() => setUserMenuOpen(o => !o)}>
                    <i className="bi bi-person-circle" />
                    <span>{currentUser.name || currentUser.email || currentUser.user}</span>
                    <i className={`bi bi-chevron-down user-btn-chevron${userMenuOpen ? " open" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="user-dropdown">
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        Hồ sơ
                      </button>

                      {["admin"].includes(currentUser.role) && (
                        <button
                          className="user-dropdown-item"
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/admin");
                          }}
                        >
                          Quản trị
                        </button>
                      )}

                      <button className="user-dropdown-item user-dropdown-item-logout" onClick={handleLogout}>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button className="user-btn" onClick={() => navigate("/login")}>
                  <i className="bi bi-person-circle" />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <nav className="header-nav">
          <div className="header-nav-inner">
            <ul className="nav-list">
              <li className="nav-list-item">
                <Link className={`nav-list-link${isActive("/") ? " nav-list-link-active" : ""}`} to="/">
                  Trang chủ
                </Link>
              </li>

              <li className="nav-list-item nav-list-item-has-sub">
                <Link className={`nav-list-link${isActive("/rau-cu") ? " nav-list-link-active" : ""}`} to="/rau-cu">
                  Rau củ
                </Link>
                <ul className="nav-sub">
                  {rauCuItems.map(i => (
                    <li key={i.href}>
                      <Link className="nav-sub-link" to={i.href}>
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className="nav-list-item nav-list-item-has-sub">
                <Link className={`nav-list-link${isActive("/trai-cay") ? " nav-list-link-active" : ""}`} to="/trai-cay">
                  Trái cây
                </Link>
                <ul className="nav-sub">
                  {traiCayItems.map(i => (
                    <li key={i.href}>
                      <Link className="nav-sub-link" to={i.href}>
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className="nav-list-item">
                <Link className={`nav-list-link${isActive("/about") ? " nav-list-link-active" : ""}`} to="/about">
                  Giới thiệu
                </Link>
              </li>

              <li className="nav-list-item">
                <Link className={`nav-list-link${isActive("/contact") ? " nav-list-link-active" : ""}`} to="/contact">
                  Liên hệ
                </Link>
              </li>
              <li className="nav-list-item">
                <Link className={`nav-list-link${isActive("/news") ? " nav-list-link-active" : ""}`} to="/news">
                  Tin tức
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <div className="header-placeholder" />
    </>
  );
};

export default Header;