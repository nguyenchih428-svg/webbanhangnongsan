import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const jsonBase = import.meta.env.BASE_URL || '/';

const emptyForm = () => ({
  id: '',
  name: '',
  position: '',
  phone: '',
  email: '',
});

function rowToForm(e) {
  return {
    id: String(e.id),
    name: e.name ?? '',
    position: e.position ?? '',
    phone: e.phone ?? '',
    email: e.email ?? '',
  };
}

function formToRow(form, nextId) {
  return {
    id: form.id ? Number(form.id) : nextId,
    name: form.name.trim(),
    position: form.position.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
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
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const displayedRows = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.id) === q ||
        String(r.name || '').toLowerCase().includes(q) ||
        String(r.position || '').toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q)
    );
  }, [rows, appliedSearch]);

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
          ? 'Chỉ lưu được khi chạy npm run dev hoặc npm run preview (API Vite).'
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
      if (u.role !== 'admin') {
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
    persist(rows.filter((r) => String(r.id) !== String(id)));
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
              + Thêm nhân viên
            </button>
            <div className="admin-toolbar-search">
              <label htmlFor="admin-employee-search">Tìm kiếm:</label>
              <input
                id="admin-employee-search"
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
                  <th>Chức vụ</th>
                  <th>Điện thoại</th>
                  <th>Email</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-table__empty">
                      {appliedSearch.trim()
                        ? 'Không tìm thấy nhân viên.'
                        : 'Chưa có nhân viên.'}
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.name}</td>
                      <td>{r.position}</td>
                      <td>{r.phone}</td>
                      <td>{r.email}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="admin-table__link"
                            onClick={() => openEdit(r)}
                            disabled={saving}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="admin-table__link admin-table__link--danger"
                            onClick={() => handleDelete(r.id)}
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
          <h2>{isNew ? 'Thêm nhân viên' : 'Sửa nhân viên'}</h2>
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
              />
            </label>
            <label>
              Chức vụ
              <input
                value={form.position}
                onChange={(e) => handleFormChange('position', e.target.value)}
              />
            </label>
            <label>
              Điện thoại
              <input
                value={form.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </label>
            <label className="admin-form-grid__full">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
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

export default Adminemployee;
