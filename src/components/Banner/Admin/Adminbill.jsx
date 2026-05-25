import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

// Định nghĩa các tùy chọn trạng thái của hóa đơn
const STATUS_OPTIONS = [
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'shipping', label: 'Vận chuyển' },
    { value: 'pending', label: 'Chưa giải quyết' },
    { value: 'processing', label: 'Xử lý' },
];

// Khởi tạo giá trị biểu mẫu rỗng cho hóa đơn
const emptyForm = () => ({
    id: '',
    customer_id: '',
    employee_id: '',
    date: '',
    total: '',
    status: 'delivered',
});

// Chuyển đổi đối tượng hóa đơn sang dữ liệu cho biểu mẫu
function rowToForm(b) {
    const d = String(b.date || '').slice(0, 10);
    return {
        id: String(b.id),
        customer_id: b.customer_id !== null && b.customer_id !== undefined ? String(b.customer_id) : '',
        employee_id: b.employee_id !== null && b.employee_id !== undefined ? String(b.employee_id) : '',
        date: d,
        total: b.total !== null && b.total !== undefined ? String(b.total) : '',
        status: String(b.status || 'delivered').toLowerCase(),
    };
}

// Chuyển đổi dữ liệu biểu mẫu sang đối tượng dữ liệu chuẩn để lưu trữ
function formToRow(form, nextId) {
    return {
        id: form.id ? Number(form.id) : nextId,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        employee_id: form.employee_id ? Number(form.employee_id) : null,
        date: form.date ? form.date : new Date().toISOString().slice(0, 10),
        total: form.total ? Number(form.total) : 0,
        status: form.status,
    };
}

function Adminbill({ embedded = false }) {
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

    /** Ô nhập ID để lọc tìm kiếm hóa đơn */
    const [searchIdInput, setSearchIdInput] = useState('');
    const [appliedSearchId, setAppliedSearchId] = useState('');

    // Bộ lọc danh sách hiển thị theo ID hóa đơn được tìm kiếm
    const displayedRows = useMemo(() => {
        const q = appliedSearchId.trim();
        if (!q) return rows;
        return rows.filter((r) => String(r.id) === q);
    }, [rows, appliedSearchId]);

    // Đồng bộ dữ liệu danh sách hóa đơn lên máy chủ backend
    const persist = useCallback(async (nextList) => {
        setSaving(true);
        setSaveError('');
        try {
            await axios.put('/api/bill', nextList, {
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

    // Tải thông tin danh sách hóa đơn từ file json
    useEffect(() => {
        if (!allowed) return;
        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const res = await fetch(`${jsonBase}bill.json`);
                if (!res.ok) throw new Error('Không tải được bill.json');
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

    const openEdit = (b) => {
        setIsNew(false);
        setForm(rowToForm(b));
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
        if (!window.confirm('Xóa hóa đơn này?')) return;
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

    // Hàm trả về nhãn hiển thị trực quan cho trạng thái hóa đơn
    const getStatusLabel = (statusVal) => {
        const found = STATUS_OPTIONS.find((opt) => opt.value === String(statusVal).toLowerCase());
        return found ? found.label : statusVal;
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
                            + Thêm hóa đơn
                        </button>
                        <div className="admin-toolbar-search">
                            <label htmlFor="admin-bill-search-id">Tìm kiếm: </label>
                            <input
                                id="admin-bill-search-id"
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
                                    <th>KH</th>
                                    <th>NV</th>
                                    <th>Ngày</th>
                                    <th>Tổng</th>
                                    <th>Trạng thái</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {displayedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="admin-table_empty">
                                            {appliedSearchId.trim()
                                                ? `Không có hóa đơn với ID "${appliedSearchId.trim()}".`
                                                : 'Chưa có hóa đơn.'}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedRows.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.id}</td>
                                            <td>{r.customer_id || ''}</td>
                                            <td>{r.employee_id || ''}</td>
                                            <td>{r.date}</td>
                                            <td>{r.total}</td>
                                            <td>{getStatusLabel(r.status)}</td>
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
                    <h2>{isNew ? 'Thêm hóa đơn' : 'Sửa hóa đơn'}</h2>
                    <div className="admin-form-grid">
                        {!isNew && (
                            <div className="admin-form-group">
                                <label>ID:</label>
                                <input value={form.id} readOnly />
                            </div>
                        )}
                        <div className="admin-form-group admin-form-grid__full">
                            <label>Mã khách hàng (KH ID):</label>
                            <input
                                type="text"
                                value={form.customer_id}
                                onChange={(e) => handleFormChange('customer_id', e.target.value)}
                            />
                        </div>
                        <div className="admin-form-group admin-form-grid__full">
                            <label>Mã nhân viên (NV ID):</label>
                            <input
                                type="text"
                                value={form.employee_id}
                                onChange={(e) => handleFormChange('employee_id', e.target.value)}
                            />
                        </div>
                        <div className="admin-form-group admin-form-grid__full">
                            <label>Ngày lập:</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => handleFormChange('date', e.target.value)}
                            />
                        </div>
                        <div className="admin-form-group admin-form-grid__full">
                            <label>Tổng tiền:</label>
                            <input
                                type="text"
                                value={form.total}
                                onChange={(e) => handleFormChange('total', e.target.value)}
                            />
                        </div>
                        <div className="admin-form-group admin-form-grid__full">
                            <label>Trạng thái hóa đơn:</label>
                            <select
                                value={form.status}
                                onChange={(e) => handleFormChange('status', e.target.value)}
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
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
                <h2>Quản lý hóa đơn (Admin)</h2>
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

export default Adminbill;