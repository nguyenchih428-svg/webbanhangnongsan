import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

// Khởi tạo giá trị biểu mẫu rỗng cho khách hàng
const emptyForm = () => ({
    id: '',
    name: '',
    phone: '',
});

// Chuyển đổi đối tượng khách hàng sang dữ liệu cho biểu mẫu
function rowToForm(c) {
    return {
        id: String(c.id),
        name: c.name ?? '',
        phone: c.phone ?? '',
    };
}

// Chuyển đổi dữ liệu biểu mẫu sang đối tượng dữ liệu chuẩn để lưu trữ
function formToRow(form, nextId) {
    return {
        id: form.id ? Number(form.id) : nextId,
        name: form.name.trim(),
        phone: form.phone.trim(),
    };
}

function Admincustomer({ embedded = false }) {
    const navigate = useNavigate();
    const [allowed, setAllowed] = useState(embedded);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState('list');
    const [form, setForm] = useState(emptyForm());
    const [isNew, setIsNew] = useState(false);

    /** Ô nhập ID để lọc tìm kiếm khách hàng */
    const [searchIdInput, setSearchIdInput] = useState('');
    const [appliedSearchId, setAppliedSearchId] = useState('');

    // Bộ lọc danh sách hiển thị theo ID khách hàng được tìm kiếm
    const displayedRows = useMemo(() => {
        const q = appliedSearchId.trim();
        if (!q) return rows;
        return rows.filter((r) => String(r.id) === q);
    }, [rows, appliedSearchId]);

    // Đồng bộ dữ liệu danh sách khách hàng lên máy chủ backend
    const persist = useCallback(async (nextList) => {
        setSaving(true);
        setSaveError('');
        try {
            await axios.put('/api/customer', nextList, {
                headers: { 'Content-Type': 'application/json' },
            });
            setRows(nextList);
            setView('list');
            setForm(emptyForm());
            setIsNew(false);
        } catch (err) {
            const msg =
                err.response?.data?.error ||
                (err.code === 'ERR_NETWORK' || err.response?.status === 404
                    ? 'Chỉ lưu được khi chạy npm run dev hoặc npm run preview (API Vite).'
                    : null) ||
                'Không lưu được dữ liệu.';
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    }, []);

    // Kiểm tra phân quyền truy cập người dùng (Nhân viên quản trị - staff)
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

    // Tải thông tin danh sách khách hàng từ file json
    useEffect(() => {
        if (!allowed) return;
        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const res = await fetch(`${jsonBase}customer.json`);
                if (!res.ok) throw new Error('Không tải được customer.json');
                const data = await res.json();
                setRows(Array.isArray(data) ? data : []);
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

    const openEdit = (c) => {
        setIsNew(false);
        setForm(rowToForm(c));
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
            setSaveError('Vui lòng nhập tên khách hàng');
            return;
        }

        const nextId = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
        const built = formToRow(form, nextId);
        let nextList;

        if (isNew) {
            nextList = [...rows, built];
        } else {
            const idx = rows.findIndex((r) => String(r.id) === String(form.id));
            if (idx === -1) {
                setSaveError('Không tìm thấy bản ghi để cập nhật');
                return;
            }
            nextList = rows.map((r) => (String(r.id) === String(form.id) ? built : r));
        }
        persist(nextList);
    };

    const handleDelete = (id) => {
        if (!window.confirm('Xóa khách hàng này?')) return;
        const nextList = rows.filter((r) => String(r.id) !== String(id));
        persist(nextList);
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
                            + Thêm khách hàng
                        </button>
                        <div className="admin-toolbar-search">
                            <label htmlFor="admin-customer-search-id">Tìm kiếm: </label>
                            <input
                                id="admin-customer-search-id"
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
                                    <th>Điện thoại</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {displayedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="admin-table_empty">
                                            {appliedSearchId.trim()
                                                ? `Không có khách hàng với ID "${appliedSearchId.trim()}".`
                                                : 'Chưa có khách hàng.'}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedRows.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.id}</td>
                                            <td>{r.name}</td>
                                            <td>{r.phone}</td>
                                            <td>
                                                <div className="admin-table_actions">
                                                    <button type="button" className="admin-btn admin-btn--sm" onClick={() => openEdit(r)} disabled={saving}>
                                                        Sửa
                                                    </button>
                                                    <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(r.id)} disabled={saving}>
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
                    <h2>{isNew ? 'Thêm khách hàng' : 'Sửa khách hàng'}</h2>
                    <div className="admin-form-grid">
                        {!isNew && (
                            <div className="admin-form-group">
                                <label>ID:</label>
                                <input value={form.id} readOnly />
                            </div>
                        )}
                        <div className="admin-form-group admin-form-grid__full">
                            <label>Tên khách hàng (*):</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => handleFormChange('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="admin-form-group admin-form-grid__full">
                            <label>Điện thoại:</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => handleFormChange('phone', e.target.value)}
                            />
                        </div>
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
                <h2>Quản lý khách hàng (Admin)</h2>
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

export default Admincustomer;