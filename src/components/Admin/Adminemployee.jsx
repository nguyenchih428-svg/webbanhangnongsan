import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

// Khởi tạo giá trị biểu mẫu rỗng cho nhân viên
const emptyForm = () => ({
    id: '',
    role: '',
    name: '',
    gender: '',
    birthdate: '',
    phone: '',
});

// Chuyển đổi đối tượng nhân viên sang dữ liệu cho biểu mẫu
function rowToForm(e) {
    return {
        id: String(e.id),
        role: e.role ?? '',
        name: e.name ?? '',
        gender: e.gender ?? '',
        birthdate: e.birthdate ?? '',
        phone: e.phone ?? '',
    };
}

// Chuyển đổi dữ liệu biểu mẫu sang đối tượng dữ liệu chuẩn để lưu trữ
function formToRow(form, nextId) {
    return {
        id: form.id ? Number(form.id) : nextId,
        role: form.role.trim(),
        name: form.name.trim(),
        gender: form.gender.trim(),
        birthdate: form.birthdate.trim(),
        phone: form.phone.trim(),
    };
}

function Adminemployee({ embedded = false }) {
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

    /** Ô nhập ID để lọc tìm kiếm nhân viên */
    const [searchIdInput, setSearchIdInput] = useState('');
    const [appliedSearchId, setAppliedSearchId] = useState('');

    // Bộ lọc danh sách hiển thị theo ID nhân viên được tìm kiếm
    const displayedRows = useMemo(() => {
        const q = appliedSearchId.trim();
        if (!q) return rows;
        return rows.filter((r) => String(r.id) === q);
    }, [rows, appliedSearchId]);

    // Đồng bộ dữ liệu danh sách nhân viên lên máy chủ backend
    const persist = useCallback(async (nextList) => {
        setSaving(true);
        setSaveError('');
        try {
            await axios.put('/api/employee', nextList, {
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
                    ? 'Chỉ lưu được khi chạy npm run dev hoặc npm run preview (API ghi file trên server).'
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

    // Tải thông tin danh sách nhân viên từ file json
    useEffect(() => {
        if (!allowed) return;
        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const res = await fetch(`${jsonBase}employee.json`);
                if (!res.ok) throw new Error('Không tải được employee.json');
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

    const openEdit = (e) => {
        setIsNew(false);
        setForm(rowToForm(e));
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
            setSaveError('Vui lòng nhập tên nhân viên');
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
        if (!window.confirm('Xóa nhân viên này?')) return;
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
                            + Thêm nhân viên
                        </button>
                        <div className="admin-toolbar-search">
                            <label htmlFor="admin-employee-search-id">Tìm kiếm: </label>
                            <input
                                id="admin-employee-search-id"
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
                                    <th>Vai trò</th>
                                    <th>Tên</th>
                                    <th>Giới tính</th>
                                    <th>Ngày sinh</th>
                                    <th>Điện thoại</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {displayedRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="admin-table_empty">
                                            {appliedSearchId.trim()
                                                ? `Không có nhân viên với ID "${appliedSearchId.trim()}".`
                                                : 'Chưa có nhân viên.'}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedRows.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.id}</td>
                                            <td>{r.role}</td>
                                            <td>{r.name}</td>
                                            <td>{r.gender}</td>
                                            <td>{r.birthdate}</td>
                                            <td>{r.phone}</td>
                                            <td>
                                                <button type="button" className="admin-btn admin-btn--sm" onClick={() => openEdit(r)} disabled={saving}>
                                                    Sửa
                                                </button>
                                                <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(r.id)} disabled={saving}>
                                                    Xóa
                                                </button>
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
                    <h2>{isNew ? 'Thêm nhân viên' : 'Sửa nhân viên'}</h2>
                    <div className="admin-form-group">
                        <label>Tên nhân viên (*):</label>
                        <input type="text" value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Vai trò:</label>
                        <input type="text" value={form.role} onChange={(e) => handleFormChange('role', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Giới tính:</label>
                        <input type="text" value={form.gender} onChange={(e) => handleFormChange('gender', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Ngày sinh:</label>
                        <input type="text" value={form.birthdate} onChange={(e) => handleFormChange('birthdate', e.target.value)} />
                    </div>
                    <div className="admin-form-group">
                        <label>Điện thoại:</label>
                        <input type="text" value={form.phone} onChange={(e) => handleFormChange('phone', e.target.value)} />
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
                <h2>Quản lý nhân viên (Admin)</h2>
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

export default Adminemployee;