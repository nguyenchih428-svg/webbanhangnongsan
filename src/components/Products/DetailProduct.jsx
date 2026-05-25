import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { imageMap } from "../../utils/Productimage";
import './DetailProduct.css';

const DetailProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const stateProduct = location.state?.product;
    if (stateProduct && String(stateProduct.id) === String(id)) {
      setProduct({
        ...stateProduct,
        image: imageMap[stateProduct.imageKey] || stateProduct.image
      });
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch('/products.json');
        if (!response.ok) {
          throw new Error('Không thể tải thông tin sản phẩm');
        }

        const data = await response.json();
        const found = data.find((item) => String(item.id) === String(id));

        if (!found) {
          throw new Error('Sản phẩm không tồn tại');
        }

        setProduct({
          ...found,
          image: imageMap[found.imageKey] || found.image
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, location.state]);

  const handleAddToCart = () => {
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];

    const cartItemId = `${product.id}-${selectedSize}`;
    const existingItemIndex = cart.findIndex(item => item.cartId === cartItemId);

    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        ...product,
        cartId: cartItemId,
        selectedSize: selectedSize,
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    if (window.confirm("Đã thêm sản phẩm vào giỏ hàng! Bạn có muốn đi đến giỏ hàng ngay không?")) {
      navigate('/cart');
    }
  };

  const handleBuyNow = () => {
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];

    const cartItemId = `${product.id}-${selectedSize}`;
    const existingItemIndex = cart.findIndex(item => item.cartId === cartItemId);

    if (existingItemIndex < 0) {
      cart.push({
        ...product,
        cartId: cartItemId,
        selectedSize: selectedSize,
        quantity: 1
      });
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    }

    navigate('/cart');
  };

  if (isLoading) return <div className="detail-loading text-center py-5">Đang tải chi tiết sản phẩm...</div>;
  if (error) return <div className="detail-error text-center py-5 text-danger">Lỗi: {error}</div>;
  if (!product) return null;

  return (
    <div className="detail-container">
      <div className="detail-nav-header">
        <button className="back-btn-circle" onClick={() => navigate(-1)} title="Quay lại">
          <i className="bi bi-arrow-left"></i>
        </button>
        <div className="detail-breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span> / <span>Chi tiết sản phẩm</span>
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-image-section">
          <div className="main-image-wrapper">
            <img
              src={product.image || 'https://via.placeholder.com/500x500'}
              alt={product.name}
            />
            {product.discount && <span className="detail-badge-sale">{product.discount}</span>}
          </div>
        </div>

        <div className="detail-info-section">
          <h1 className="product-name">{product.name}</h1>

          <div className="product-meta">
            <span className="rating"><i className="bi bi-star-fill"></i> {product.rating || '5.0'}</span>
            <span className="divider">|</span>
            <span className="sold">Đã bán {product.sold || 0}</span>
          </div>

          <div className="product-price-box">
            <span className="price-current">{Number(product.price).toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="product-description">
            <p>Thưởng thức hương vị tuyệt hảo từ nguyên liệu tự nhiên, được chọn lọc kỹ lưỡng để mang đến trải nghiệm tốt nhất cho bạn.</p>
          </div>

          <div className="detail-selection">
            <label>Chọn kích thước (Size):</label>
            <div className="size-options">
              {['S', 'M', 'L'].map((size) => (
                <button
                  key={size}
                  className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-actions">
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <i className="bi bi-cart-plus"></i> THÊM VÀO GIỎ HÀNG
            </button>
            <button className="buy-now-btn" onClick={handleBuyNow}>
              MUA NGAY
            </button>
          </div>

          <div className="delivery-policy">
            <div className="policy-item">
              <i className="bi bi-truck"></i>
              <span>Giao hàng nhanh trong 2h</span>
            </div>
            <div className="policy-item">
              <i className="bi bi-check-circle-fill"></i>
              <span>Đảm bảo vệ sinh an toàn thực phẩm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailProduct;