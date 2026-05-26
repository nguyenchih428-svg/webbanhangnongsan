import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "./ProductCard";
import { imageMap } from "../../utils/Productimage";
import { rankProductsBySearch } from "../../utils/productSearch";
import "./ProductList.css";

const PRODUCTS_PER_PAGE = 10;
const jsonBase = import.meta.env.BASE_URL || "/";

const CATEGORY_ICONS = {
  default: "bi-tag",
  1:  "bi-geo-alt-fill",
  2:  "bi-airplane-fill",
  3:  "bi-recycle",
  4:  "bi-gift-fill",
  5:  "bi-thermometer-sun",
  6:  "bi-cup-straw",
  7:  "bi-droplet-half",
  8:  "bi-scissors",
  9:  "bi-droplet-fill",
  10: "bi-snow",
  11: "bi-box-seam-fill",
  12: "bi-leaf-fill",
};

const ProductList = () => {
  const location = useLocation();
  const [products, setProducts]           = useState([]);
  const [categories, setCategories]       = useState([]);
  const [selectedidcategory, setSelected] = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("q");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${jsonBase}products.json`),
          fetch(`${jsonBase}category.json`),
        ]);
        if (!productsRes.ok) throw new Error("Không thể tải dữ liệu");

        const data = await productsRes.json();
        setProducts(data.map(item => ({ ...item, image: imageMap[item.imageKey] || item.image })));

        if (categoriesRes.ok) {
          const catData = await categoriesRes.json();
          setCategories(Array.isArray(catData) ? catData : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith("/trai-cay/noi-dia")) {
      setSelected(1);
    } else if (path.startsWith("/trai-cay/nhap-khau")) {
      setSelected(2);
    } else if (path.startsWith("/trai-cay/say")) {
      setSelected(5);
    } else if (path.startsWith("/rau-cu/rau-la-xanh")) {
      setSelected(11);
    } else if (path.startsWith("/rau-cu/cu-qua")) {
      setSelected(12);
    } else if (path.startsWith("/rau-cu/nam")) {
      setSelected(13);
    } else if (path.startsWith("/rau-cu/rau-gia-vi")) {
      setSelected(14);
    } else if (path.startsWith("/rau-cu")) {
      setSelected(11);
    } else {
      setSelected(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedidcategory, searchQuery]);

  const filteredProducts = searchQuery
    ? rankProductsBySearch(products, searchQuery, 9999)
    : selectedidcategory == null
      ? products
      : products.filter(p => p.idcategory === selectedidcategory);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safePage        = Math.min(currentPage, totalPages);
  const start           = (safePage - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);

  if (isLoading) return <div className="pl-loading">Đang tải...</div>;
  if (error)     return <div className="pl-error">Lỗi: {error}</div>;

  return (
    <div className="product-list-container">
      <h2 className="section-title">
        {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : "Danh mục sản phẩm"}
      </h2>

      {!searchQuery && (
        <div className="category-grid-container">
          <div
            className={`category-item-card${selectedidcategory == null ? " active" : ""}`}
            onClick={() => setSelected(null)}
          >
            <div className="category-icon-box">
              <i className="bi bi-grid-fill" />
            </div>
            <p className="category-title">Tất cả</p>
          </div>

          {categories.map(cat => (
            <div
              key={cat.id}
              className={`category-item-card${selectedidcategory === cat.id ? " active" : ""}`}
              onClick={() => setSelected(cat.id)}
            >
              <div className="category-icon-box">
                <i className={`bi ${CATEGORY_ICONS[cat.id] || CATEGORY_ICONS.default}`} />
              </div>
              <p className="category-title">{cat.name}</p>
            </div>
          ))}
        </div>
      )}

      <div className="products-grid-view">
        {filteredProducts.length === 0 ? (
          <div className="pl-empty">Không có sản phẩm nào phù hợp.</div>
        ) : (
          <>
            <div className="product-grid">
              {visibleProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                <span className="page-info">Trang {safePage} / {totalPages}</span>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductList;