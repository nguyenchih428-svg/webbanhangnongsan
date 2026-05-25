import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

// Định nghĩa giá trị mặc định cho form trống
const emptyForm = () => ({
    id: '',
    name: '',
    imageKey: 'sp1',
    sizes: 'S',
    sizeM: 'M',
    sizeL: 'L',
    currentPrice: '',
    originalPrice: '',
    discount: '',
    rating: '',
    sold: '',
    categoryid: '',
});

// Chuyển đổi dữ liệu từ Product sang dữ liệu Form
function productToForm(p) {
    return {
        id: String(p.id),
        name: p.name ?? '',
        imageKey: p.imageKey ?? '',
        sizes: p.sizeS ?? 'S',
        sizeM: p.sizeM ?? 'M',
        sizeL: p.sizeL ?? 'L',
        currentPrice: p.currentPrice ?? '',
        originalPrice: p.originalPrice ?? '',
        discount: p.discount ?? '',
        rating: p.rating ?? '',
        sold: p.sold ?? '',
        categoryid: p.categoryid !== null && p.categoryid !== undefined ? String(p.categoryid) : '',
    };
}

// Chuyển đổi dữ liệu từ Form sang Object sản phẩm để lưu trữ
function formToProduct(form, nextId) {
    const id = form.id ? Number(form.id) : nextId;
    const o = {
        id,
        name: form.name.trim(),
        imageKey: form.imageKey.trim() || 'sp1',
        sizeS: form.sizes.trim() || 'S', 
        sizeM: form.sizeM.trim() || 'M',
        sizeL: form.sizeL.trim() || 'L',
        currentPrice: form.currentPrice.trim(),
        originalPrice: form.originalPrice.trim(),
        discount: form.discount.trim(),
        rating: form.rating.trim(),
        sold: form.sold.trim(),
    };
    
    if (form.categoryid !== '' && form.categoryid !== null && form.categoryid !== undefined) {
        o.categoryid = Number(form.categoryid);
    }
    return o; 
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
    
    /** Ô nhập ID; chỉ áp dụng lọc bảng khi nhấn Tìm / Enter */
    const [searchIdInput, setSearchIdInput] = useState('');
    const [appliedSearchId, setAppliedSearchId] = useState('');

    // Lọc danh sách sản phẩm hiển thị theo ID tìm kiếm
    const displayedProducts = useMemo(() => {
        const q = appliedSearchId.trim();
        if (!q) return products;
        return products.filter((p) => String(p.id) === q);
    }, [products, appliedSearchId]);

    // Gửi cập nhật dữ liệu lên server backend
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
                ((err.code === 'ERR_NETWORK' || err.response?.status === 404)
                    ? 'Chỉ lưu được khi chạy npm run dev hoặc npm run preview (API ghi file trên server).'
                    : null) ||
                'Không lưu được dữ liệu.';
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    }, []);

    // Kiểm tra phân quyền truy cập hợp lệ (Authentication)
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
            if (u.role !== 'staff') {
                navigate('/');
                return;
            }
            setAllowed(true);
        } catch {
            navigate('/login');
        }
    }, [navigate, embedded]);

    // Tải dữ liệu từ tệp json khi component được cấp quyền chạy
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

    const goHome = () => navigate('/');
    
    const logout = () => {
        localStorage.removeItem('currentUser');
        window.dispatchEvent(new Event('userUpdated'));
        navigate('/login');
    };

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
        const nextList = products.filter((p) => String(p.id) !== String(id));
        persistProducts(nextList);
    };

    const applyIdSearch = () => {
        setAppliedSearchId(searchIdInput.trim());
    };

    const clearIdSearch = () => {
        setSearchIdInput('');
        setAppliedSearchId('');
    };

    const bodyContent = (
        <>
            {loadError && <div className="admin-msg admin-msg--error">{loadError}</div>}
            {saveError && <div className="admin-msg admin-msg--error">{saveError}</div>}
            {loading ? (
                <p>Đang tải...</p>
            ) : view === 'list' ? (
                <>
                    <div className="admin-toolbar admin-toolbar--row">
                        <button type="button" className="admin-btn" onClick={openCreate} disabled={saving}>
                            + Thêm sản phẩm
                        </button>
                        <div className="admin-toolbar-search">
                            <label htmlFor="admin-product-search-id">Tìm kiếm: </label>
                            <input
                                id="admin-product-search-id"
                                type="text"
                                inputMode="numeric"
                                value={searchIdInput}
                                onChange={(e) => setSearchIdInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        applyIdSearch();
                                    }
                                }}
                            />
                            <button type="button" className="admin-btn" onClick={applyIdSearch} disabled={saving}>
                                Tìm
                            </button>
                            {appliedSearchId.trim() !== '' && (
                                <button type="button" className="admin-btn admin-btn--ghost" onClick={clearIdSearch} disabled={saving}>
                                    Hiện tất cả
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên</th>
                                    <th>Ảnh (key)</th>
                                    <th>Giá</th>
                                    <th>Danh mục</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {displayedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="admin-table_empty">
                                            {appliedSearchId.trim()
                                                ? `Không có sản phẩm với ID "${appliedSearchId.trim()}".`
                                                : 'Chưa có sản phẩm.'}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedProducts.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.id}</td>
                                            <td>{p.name}</td>
                                            <td>{p.imageKey}</td>
                                            <td>{p.currentPrice}</td>
                                            <td>
                                                {categories.find(c => String(c.id) === String(p.categoryid))?.name || p.categoryid || ''}
                                            </td>
                                            <td>
                                                <button type="button" className="admin-btn admin-btn--sm" onClick={() => openEdit(p)} disabled={saving}>Sửa</button>
                                                <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(p.id)} disabled={saving}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <form onSubmit={handleSubmitForm} className="admin-form">
                    <div className="admin-form-group">
                        <label>Tên sản phẩm (*):</label>
                        <input type="text" value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Ảnh (Key):</label>
                        <input type="text" value={form.imageKey} onChange={(e) => handleFormChange('imageKey', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Giá hiện tại:</label>
                        <input type="text" value={form.currentPrice} onChange={(e) => handleFormChange('currentPrice', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Danh mục sản phẩm:</label>
                        <select value={form.categoryid} onChange={(e) => handleFormChange('categoryid', e.target.value)}>
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-form-actions">
                        <button type="submit" className="admin-btn" disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Lưu lại'}
                        </button>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelForm} disabled={saving}>
                            Hủy bỏ
                        </button>
                    </div>
                </form>
            )}
        </>
    );

    if (!allowed) {
        return <div className="admin-loading">Đang kiểm tra quyền truy cập...</div>;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h2>Quản lý sản phẩm (Admin)</h2>
                <div className="admin-header-actions">
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={goHome}>Trang chủ</button>
                    <button type="button" className="admin-btn admin-btn--danger" onClick={logout}>Đăng xuất</button>
                </div>
            </header>
            <main className="admin-main">
                {bodyContent}
            </main>
        </div>
    );
}

export default Adminproduct;