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

  return (
    <div className="pc" onClick={handleViewDetail}>
      {product.discount && (
        <div className="pc__badge">-{product.discount}</div>
      )}

      <div className="pc__img-wrap">
        <img
          src={product.image || 'https://via.placeholder.com/300x200'}
          alt={product.name}
          className="pc__img"
          loading="lazy"
        />
      </div>

      <div className="pc__body">
        <h3 className="pc__name" title={product.name}>{product.name}</h3>

        <div className="pc__sizes">
          <span className="pc__size-label">Size:</span>
          <div className="pc__size-tags">
            {product.sizeS && <span className="pc__size-tag">S</span>}
            {product.sizeM && <span className="pc__size-tag">M</span>}
            {product.sizeL && <span className="pc__size-tag">L</span>}
          </div>
        </div>

        <div className="pc__pricing">
          <span className="pc__price">{product.currentPrice}</span>
          {product.originalPrice && (
            <span className="pc__price-old">{product.originalPrice}</span>
          )}
        </div>

        <div className="pc__meta">
          <span className="pc__rating">
            <i className="bi bi-star-fill" /> {product.rating}
          </span>
          <span className="pc__sold">Đã bán {product.sold}</span>
        </div>

        <div className="pc__actions">
          <button
            className="pc__btn-buy"
            onClick={(e) => { e.stopPropagation(); handleViewDetail(); }}
            disabled={isLoading}
          >
            {isLoading ? '...' : 'MUA NGAY'}
          </button>
          <button
            className="pc__btn-cart"
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