import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const productsUrl = `${import.meta.env.BASE_URL}products.json`;

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDetail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(productsUrl);
      if (!response.ok) throw new Error('Lỗi kết nối');
      const data = await response.json();
      const matchedProduct = data.find((item) => String(item.id) === String(product.id));
      if (matchedProduct) {
        navigate(`/product/${product.id}`, {
          state: { product: { ...matchedProduct, image: product.image } }
        });
      }
    } catch (err) {
      navigate(`/product/${product.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    const cartItemId = `${product.id}-M`;
    const existingItemIndex = cart.findIndex(item => item.cartId === cartItemId);
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({ ...product, cartId: cartItemId, selectedSize: 'M', quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    alert(`Đã thêm ${product.name} (Size M) vào giỏ hàng!`);
  };

  const calculatedDiscount = product.oldPrice && product.price && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) + '%'
    : null;

  return (
    <div className="pc" onClick={handleViewDetail}>
      {calculatedDiscount && (
        <div className="pc-badge">-{calculatedDiscount}</div>
      )}

      <div className="pc-img-wrap">
        <img
          src={product.image || 'https://via.placeholder.com/300x200'}
          alt={product.name}
          className="pc-img"
          loading="lazy"
        />
      </div>

      <div className="pc-body">
        <h3 className="pc-name" title={product.name}>{product.name}</h3>

        <div className="pc-sizes">
          <span className="pc-size-label">Size:</span>
          <div className="pc-size-tags">
            <span className="pc-size-tag">S</span>
            <span className="pc-size-tag">M</span>
            <span className="pc-size-tag">L</span>
          </div>
        </div>

        <div className="pc-pricing">
          <span className="pc-price">{(product.price || 0).toLocaleString('vi-VN')}đ</span>
          {product.oldPrice && (
            <span className="pc-price-old">{product.oldPrice.toLocaleString('vi-VN')}đ</span>
          )}
        </div>

        <div className="pc-meta">
          <span className="pc-rating">
            <i className="bi bi-star-fill" /> {product.rating || '5.0'}
          </span>
          <span className="pc-sold">Đã bán {product.sold || (product.id * 3 + 12)}</span>
        </div>

        <div className="pc-actions">
          <button
            className="pc-btn-buy"
            onClick={(e) => { e.stopPropagation(); handleViewDetail(); }}
            disabled={isLoading}
          >
            {isLoading ? '...' : 'MUA NGAY'}
          </button>
          <button
            className="pc-btn-cart"
            onClick={handleQuickAdd}
            title="Thêm nhanh vào giỏ"
          >
            <i className="bi bi-cart-plus" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;