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

function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const BILL_STATUS_VI = {
  'đã giao hàng': { cls: 'done' },
  'đang giao hàng': { cls: 'shipping' },
  'đã thanh toán': { cls: 'processing' },
  'chờ xử lý': { cls: 'pending' },
  'đã hủy': { cls: 'pending' },
};

function billStatusBadge(statusRaw) {
  const label = String(statusRaw || '').trim() || 'Chưa xác định';
  const key = label.toLowerCase();
  const mapped = BILL_STATUS_VI[key];
  return { label, cls: mapped?.cls || 'unknown' };
}

function checkAdminRole(user) {
  return user?.role === 'admin';
}

const STATUS_OPTIONS = [
  'Đã giao hàng',
  'Đang giao hàng',
  'Đã thanh toán',
  'Chờ xử lý',
  'Đã hủy',
];

const PAYMENT_OPTIONS = ['COD', 'Chuyển khoản', 'Momo', 'Tiền mặt'];

const emptyForm = () => ({
  billId: '',
  customerName: '',
  orderDate: '',
  phone: '',
  address: '',
  totalAmount: '',
  paymentMethod: 'COD',
  status: 'Chờ xử lý',
});

function rowToForm(b) {
  const d = String(b.orderDate || '');
  const orderDate = d.includes('T') ? d.slice(0, 16) : d.slice(0, 10);
  return {
    billId: b.billId ?? '',
    customerName: b.customerName ?? '',
    orderDate,
    phone: b.phone ?? '',
    address: b.address ?? '',
    totalAmount:
      b.totalAmount !== null && b.totalAmount !== undefined
        ? String(b.totalAmount)
        : '',
    paymentMethod: b.paymentMethod ?? 'COD',
    status: b.status ?? 'Chờ xử lý',
  };
}

function formToRow(form, isNew) {
  const orderDate = form.orderDate
    ? form.orderDate.length <= 10
      ? `${form.orderDate}T00:00:00`
      : form.orderDate.length === 16
        ? `${form.orderDate}:00`
        : form.orderDate
    : new Date().toISOString();

  return {
    billId: form.billId.trim(),
    customerName: form.customerName.trim(),
    orderDate,
    phone: form.phone.trim(),
    address: form.address.trim(),
    totalAmount: form.totalAmount ? Number(form.totalAmount) : 0,
    paymentMethod: form.paymentMethod,
    status: form.status,
  };
}

function nextBillId(rows) {
  const nums = rows
    .map((r) => {
      const m = String(r.billId || '').match(/HD(\d+)/i);
      return m ? Number(m[1]) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `HD${String(max + 1).padStart(3, '0')}`;
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
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const displayedRows = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.billId || '').toLowerCase().includes(q) ||
        String(r.customerName || '').toLowerCase().includes(q) ||
        String(r.phone || '').includes(q)
    );
  }, [rows, appliedSearch]);

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

  const openCreate = () => {
    setIsNew(true);
    setForm({ ...emptyForm(), billId: nextBillId(rows) });
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
    if (!form.billId.trim() || !form.customerName.trim()) {
      setSaveError('Vui lòng nhập mã hóa đơn và tên khách hàng');
      return;
    }
    const built = formToRow(form, isNew);
    let nextList;
    if (isNew) {
      if (rows.some((r) => r.billId === built.billId)) {
        setSaveError('Mã hóa đơn đã tồn tại');
        return;
      }
      nextList = [...rows, built];
    } else {
      const idx = rows.findIndex((r) => r.billId === form.billId);
      if (idx === -1) {
        setSaveError('Không tìm thấy hóa đơn để cập nhật');
        return;
      }
      nextList = rows.map((r) => (r.billId === form.billId ? built : r));
    }
    persist(nextList);
  };

  const handleDelete = (billId) => {
    if (!window.confirm(`Xóa hóa đơn ${billId}?`)) return;
    persist(rows.filter((r) => r.billId !== billId));
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
              + Thêm hóa đơn
            </button>
            <div className="admin-toolbar-search">
              <label htmlFor="admin-bill-search">Tìm kiếm:</label>
              <input
                id="admin-bill-search"
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
                  <th>Mã HD</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>SĐT</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-table-empty">
                      {appliedSearch.trim()
                        ? 'Không tìm thấy hóa đơn phù hợp.'
                        : 'Chưa có hóa đơn.'}
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((r) => {
                    const st = billStatusBadge(r.status);
                    return (
                      <tr key={r.billId}>
                        <td>{r.billId}</td>
                        <td>{r.customerName}</td>
                        <td>{fmtDateTime(r.orderDate)}</td>
                        <td>{r.phone}</td>
                        <td>{fmtCurrency(r.totalAmount)}</td>
                        <td>{r.paymentMethod}</td>
                        <td>
                          <span className={`ruang-status ruang-status--${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-table-link"
                              onClick={() => openEdit(r)}
                              disabled={saving}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="admin-table-link admin-table-link--danger"
                              onClick={() => handleDelete(r.billId)}
                              disabled={saving}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form className="admin-form-card" onSubmit={handleSubmitForm}>
          <h2>{isNew ? 'Thêm hóa đơn' : 'Sửa hóa đơn'}</h2>
          <div className="admin-form-grid">
            <label>
              Mã hóa đơn (*)
              <input
                value={form.billId}
                onChange={(e) => handleFormChange('billId', e.target.value)}
                readOnly={!isNew}
                required
              />
            </label>
            <label>
              Tên khách hàng (*)
              <input
                value={form.customerName}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
                required
              />
            </label>
            <label>
              Ngày đặt
              <input
                type="datetime-local"
                value={form.orderDate}
                onChange={(e) => handleFormChange('orderDate', e.target.value)}
              />
            </label>
            <label>
              Số điện thoại
              <input
                value={form.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </label>
            <label className="admin-form-grid-full">
              Địa chỉ
              <input
                value={form.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
              />
            </label>
            <label>
              Tổng tiền (VNĐ)
              <input
                type="number"
                min="0"
                value={form.totalAmount}
                onChange={(e) => handleFormChange('totalAmount', e.target.value)}
              />
            </label>
            <label>
              Phương thức TT
              <select
                value={form.paymentMethod}
                onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
              >
                {PAYMENT_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-form-grid-full">
              Trạng thái
              <select
                value={form.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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

export default Adminbill;
