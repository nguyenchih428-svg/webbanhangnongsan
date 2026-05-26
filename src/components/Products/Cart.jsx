import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (Array.isArray(savedCart)) {
          setCartItems(savedCart);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error(error);
        setCartItems([]);
      }
    };

    loadCart();
    window.addEventListener('cartUpdated', loadCart);

    return () => {
      window.removeEventListener('cartUpdated', loadCart);
    };
  }, []);

  const saveCart = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const parsePrice = (price) => {
    if (typeof price === 'number') return price;
    if (!price) return 0;
    const numericString = price.toString().replace(/[^\d]/g, '');
    return numericString ? Number(numericString) : 0;
  };

  const formatPrice = (price) => {
    if (isNaN(price)) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const updateQuantity = (uniqueId, delta) => {
    const newCart = cartItems.map((item) => {
      const currentId = item.cartId || item.id;
      if (currentId === uniqueId) {
        const newQty = (item.quantity || 1) + delta;
        return {
          ...item,
          quantity: newQty > 0 ? newQty : 1,
        };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeItem = (uniqueId) => {
    if (window.confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      const newCart = cartItems.filter(
        (item) => (item.cartId || item.id) !== uniqueId
      );
      saveCart(newCart);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parsePrice(item.currentPrice || item.price);
      return total + price * (item.quantity || 1);
    }, 0);
  };

  const handleCheckout = () => {
    navigate("/");
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h2>Giỏ hàng đang trống</h2>
          <p>Hãy chọn thêm sản phẩm và quay lại đây nhé!</p>
          <Link to="/" className="continue-shopping-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Quay lại mua hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2 className="cart-title">Giỏ hàng của bạn</h2>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => {
            const uniqueKey = item.cartId || item.id;
            const numericUnitPrice = parsePrice(item.currentPrice || item.price);
            const numericLineTotal = numericUnitPrice * (item.quantity || 1);

            return (
              <div className="cart-item" key={uniqueKey}>
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="cart-item-info">
                  <h5 className="cart-item-name">{item.name}</h5>
                  <div className="cart-item-size">Size: {item.selectedSize || 'M'}</div>
                  <div className="cart-item-price">{formatPrice(numericUnitPrice)}</div>
                </div>

                <div className="cart-item-quantity">
                  <button className="quantity-btn minus" onClick={() => updateQuantity(uniqueKey, -1)}>-</button>
                  <div className="quantity-value">{item.quantity || 1}</div>
                  <button className="quantity-btn plus" onClick={() => updateQuantity(uniqueKey, 1)}>+</button>
                </div>

                <div className="cart-item-total">
                  <span className="item-total-price">{formatPrice(numericLineTotal)}</span>
                </div>

                <button className="remove-item-btn" onClick={() => removeItem(uniqueKey)} title="Xóa">
                  <i className="bi bi-trash3"></i>
                </button>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h4 className="summary-title">Hóa đơn</h4>

          <div className="summary-row">
            <span>Tạm tính:</span>
            <span style={{ fontWeight: '600' }}>{formatPrice(calculateTotal())}</span>
          </div>

          <div className="summary-row">
            <span>Phí ship:</span>
            <span style={{ color: '#059669', fontWeight: '600' }}>Miễn phí</span>
          </div>

          <div className="summary-row" style={{ borderTop: '2px solid #e2e8f0', marginTop: '10px' }}>
            <span style={{ fontWeight: '700' }}>Tổng cộng:</span>
            <span className="total-price">{formatPrice(calculateTotal())}</span>
          </div>

          <button className="checkout-btn" onClick={handleCheckout}>
            Thanh toán
          </button>

          <button className="continue-shopping-btn" onClick={() => navigate('/')}>
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;