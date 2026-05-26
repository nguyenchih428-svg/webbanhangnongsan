import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

function fmtNumber(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtCurrency(n) {
  return `${fmtNumber(Number(n) || 0)} đ`;
}

function checkAdminRole(user) {
  return user?.role === 'admin';
}

const emptyForm = () => ({
  id: '',
  name: '',
  imageKey: '',
  idcategory: '',
  price: '',
  oldPrice: '',
});

function productToForm(p) {
  return {
    id: String(p.id),
    name: p.name ?? '',
    imageKey: p.imageKey ?? '',
    idcategory:
      p.idcategory !== null && p.idcategory !== undefined
        ? String(p.idcategory)
        : '',
    price: p.price !== null && p.price !== undefined ? String(p.price) : '',
    oldPrice:
      p.oldPrice !== null && p.oldPrice !== undefined && p.oldPrice !== ''
        ? String(p.oldPrice)
        : '',
  };
}

function formToProduct(form, nextId) {
  const id = form.id ? Number(form.id) : nextId;
  const row = {
    id,
    name: form.name.trim(),
    imageKey: form.imageKey.trim(),
    idcategory: form.idcategory !== '' ? Number(form.idcategory) : 1,
    price: form.price !== '' ? Number(form.price) : 0,
    oldPrice: form.oldPrice !== '' ? Number(form.oldPrice) : null,
  };
  return row;
}

function Adminproduct({ embedded = false }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(embedded);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(emptyForm());
  const [isNew, setIsNew] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const categoryMap = useMemo(() => {
    const m = {};
    categories.forEach((c) => {
      m[c.id] = c.name;
    });
    return m;
  }, [categories]);

  const displayedProducts = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        String(p.id) === q ||
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.imageKey || '').toLowerCase().includes(q)
    );
  }, [products, appliedSearch]);

  const persistProducts = useCallback(async (nextList) => {
    setSaving(true);
    setSaveError('');
    try {
      await axios.put('/api/products', nextList, {
        headers: { 'Content-Type': 'application/json' },
      });
      setProducts(nextList);
      setView('list');
      setForm(emptyForm());
      setIsNew(false);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || err.response?.status === 404
          ? 'Chỉ lưu được khi chạy npm run dev hoặc npm run preview (API ghi file trên server).'
          : null) ||
        'Không lưu được dữ liệu.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (embedded) {
      setAllowed(true);
      return;
    }
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(raw);
      if (!checkAdminRole(u)) {
        navigate('/');
        return;
      }
      setAllowed(true);
    } catch {
      navigate('/login');
    }
  }, [navigate, embedded]);

  useEffect(() => {
    if (!allowed) return;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`${jsonBase}products.json`),
          fetch(`${jsonBase}category.json`),
        ]);
        if (!pRes.ok) throw new Error('Không tải được products.json');
        const pdata = await pRes.json();
        setProducts(Array.isArray(pdata) ? pdata : []);
        if (cRes.ok) {
          const cdata = await cRes.json();
          setCategories(Array.isArray(cdata) ? cdata : []);
        }
      } catch (e) {
        setLoadError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allowed]);

  const openCreate = () => {
    setIsNew(true);
    setForm(emptyForm());
    setView('form');
    setSaveError('');
  };

  const openEdit = (p) => {
    setIsNew(false);
    setForm(productToForm(p));
    setView('form');
    setSaveError('');
  };

  const cancelForm = () => {
    setView('list');
    setForm(emptyForm());
    setIsNew(false);
    setSaveError('');
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError('Vui lòng nhập tên sản phẩm');
      return;
    }
    const nextId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
    const built = formToProduct(form, nextId);
    let nextList;
    if (isNew) {
      nextList = [...products, built];
    } else {
      const idx = products.findIndex((p) => String(p.id) === String(form.id));
      if (idx === -1) {
        setSaveError('Không tìm thấy sản phẩm để cập nhật');
        return;
      }
      nextList = products.map((p) => (String(p.id) === String(form.id) ? built : p));
    }
    persistProducts(nextList);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    persistProducts(products.filter((p) => String(p.id) !== String(id)));
  };

  const bodyContent = (
    <>
      {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}
      {saveError && <div className="admin-msg admin-msg--error">{saveError}</div>}
      {loading ? (
        <p className="ruang-loading">Đang tải...</p>
      ) : view === 'list' ? (
        <>
          <div className="admin-toolbar admin-toolbar--row">
            <button type="button" className="admin-btn" onClick={openCreate} disabled={saving}>
              + Thêm sản phẩm
            </button>
            <div className="admin-toolbar-search">
              <label htmlFor="admin-product-search">Tìm kiếm:</label>
              <input
                id="admin-product-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setAppliedSearch(searchInput);
                  }
                }}
              />
              <button
                type="button"
                className="admin-btn"
                onClick={() => setAppliedSearch(searchInput)}
                disabled={saving}
              >
                Tìm
              </button>
              {appliedSearch.trim() !== '' && (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => {
                    setSearchInput('');
                    setAppliedSearch('');
                  }}
                  disabled={saving}
                >
                  Hiện tất cả
                </button>
              )}
            </div>
          </div>

          <div className="admin-table-wrap ruang-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Ảnh (key)</th>
                  <th>Giá</th>
                  <th>Giá cũ</th>
                  <th>Danh mục</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table__empty">
                      {appliedSearch.trim()
                        ? 'Không tìm thấy sản phẩm.'
                        : 'Chưa có sản phẩm.'}
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>
                        <code className="admin-code">{p.imageKey}</code>
                      </td>
                      <td>{fmtCurrency(p.price)}</td>
                      <td>
                        {p.oldPrice != null && p.oldPrice !== ''
                          ? fmtCurrency(p.oldPrice)
                          : '—'}
                      </td>
                      <td>{categoryMap[p.idcategory] || p.idcategory}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="admin-table__link"
                            onClick={() => openEdit(p)}
                            disabled={saving}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-table__link admin-table__link--danger"
                            onClick={() => handleDelete(p.id)}
                            disabled={saving}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form className="admin-form-card" onSubmit={handleSubmitForm}>
          <h2>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
          <div className="admin-form-grid">
            {!isNew && (
              <label>
                ID
                <input value={form.id} readOnly disabled />
              </label>
            )}
            <label>
              Tên (*)
              <input
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </label>
            <label>
              imageKey
              <input
                value={form.imageKey}
                onChange={(e) => handleFormChange('imageKey', e.target.value)}
                placeholder="vd: xoai_cat"
              />
            </label>
            <label>
              Danh mục
              <select
                value={form.idcategory}
                onChange={(e) => handleFormChange('idcategory', e.target.value)}
              >
                <option value="">-- Chọn --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Giá (VNĐ)
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
              />
            </label>
            <label>
              Giá cũ (để trống nếu không có)
              <input
                type="number"
                min="0"
                value={form.oldPrice}
                onChange={(e) => handleFormChange('oldPrice', e.target.value)}
              />
            </label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={cancelForm}
              disabled={saving}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </>
  );

  if (!allowed) {
    return <div className="ruang-loading">Đang kiểm tra quyền truy cập...</div>;
  }

  if (embedded) return bodyContent;

  return (
    <div className="admin-page">
      <div className="admin-body">{bodyContent}</div>
    </div>
  );
}

export default Adminproduct;
