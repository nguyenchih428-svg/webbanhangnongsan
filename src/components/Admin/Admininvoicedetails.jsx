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

const emptyItem = () => ({
  productId: '',
  productName: '',
  selectedSize: 'M',
  quantity: '1',
  unitPrice: '',
  subtotal: '',
});

const emptyForm = () => ({
  billId: '',
  customerName: '',
  orderDate: '',
  phone: '',
  address: '',
  totalAmount: '',
  paymentMethod: 'COD',
  status: 'Chờ xử lý',
  items: [emptyItem()],
});

function rowToForm(inv) {
  const d = String(inv.orderDate || '');
  const orderDate = d.includes('T') ? d.slice(0, 16) : d.slice(0, 10);
  return {
    billId: inv.billId ?? '',
    customerName: inv.customerName ?? '',
    orderDate,
    phone: inv.phone ?? '',
    address: inv.address ?? '',
    totalAmount:
      inv.totalAmount !== null && inv.totalAmount !== undefined
        ? String(inv.totalAmount)
        : '',
    paymentMethod: inv.paymentMethod ?? 'COD',
    status: inv.status ?? 'Chờ xử lý',
    items: (inv.items || []).map((it) => ({
      productId: String(it.productId ?? ''),
      productName: it.productName ?? '',
      selectedSize: it.selectedSize ?? 'M',
      quantity: String(it.quantity ?? 1),
      unitPrice: String(it.unitPrice ?? ''),
      subtotal: String(it.subtotal ?? ''),
    })),
  };
}

function formToRow(form) {
  const orderDate = form.orderDate
    ? form.orderDate.length <= 10
      ? `${form.orderDate}T00:00:00`
      : form.orderDate.length === 16
        ? `${form.orderDate}:00`
        : form.orderDate
    : new Date().toISOString();

  const items = (form.items || []).map((it) => {
    const qty = Number(it.quantity) || 0;
    const unitPrice = Number(it.unitPrice) || 0;
    const subtotal = it.subtotal !== '' ? Number(it.subtotal) : qty * unitPrice;
    return {
      productId: Number(it.productId),
      productName: it.productName.trim(),
      selectedSize: it.selectedSize.trim() || 'M',
      quantity: qty,
      unitPrice,
      subtotal,
    };
  });

  const totalFromItems = items.reduce((s, it) => s + it.subtotal, 0);

  return {
    billId: form.billId.trim(),
    customerName: form.customerName.trim(),
    orderDate,
    phone: form.phone.trim(),
    address: form.address.trim(),
    items,
    totalAmount: form.totalAmount !== '' ? Number(form.totalAmount) : totalFromItems,
    paymentMethod: form.paymentMethod,
    status: form.status,
  };
}

function Admininvoicedetails({ embedded = false }) {
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
  const [expandedBill, setExpandedBill] = useState(null);

  const displayedRows = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.billId || '').toLowerCase().includes(q) ||
        String(r.customerName || '').toLowerCase().includes(q)
    );
  }, [rows, appliedSearch]);

  const persist = useCallback(async (nextList) => {
    setSaving(true);
    setSaveError('');
    try {
      await axios.put('/api/invoicedetails', nextList, {
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
        const res = await fetch(`${jsonBase}invoicedetails.json`);
        if (!res.ok) throw new Error('Không tải được invoicedetails.json');
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

  const openEdit = (inv) => {
    setIsNew(false);
    setForm(rowToForm(inv));
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

  const handleItemChange = (index, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(items[index].quantity) || 0;
        const price = Number(items[index].unitPrice) || 0;
        items[index].subtotal = String(qty * price);
      }
      return { ...f, items };
    });
  };

  const addItemRow = () => {
    setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  };

  const removeItemRow = (index) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!form.billId.trim()) {
      setSaveError('Vui lòng nhập mã hóa đơn');
      return;
    }
    const built = formToRow(form);
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
    if (!window.confirm(`Xóa chi tiết hóa đơn ${billId}?`)) return;
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
              + Thêm chi tiết HĐ
            </button>
            <div className="admin-toolbar-search">
              <label htmlFor="admin-invoice-search">Tìm kiếm:</label>
              <input
                id="admin-invoice-search"
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
                  <th>Ngày</th>
                  <th>Tổng</th>
                  <th>Số SP</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table-empty">
                      {appliedSearch.trim()
                        ? 'Không tìm thấy hóa đơn.'
                        : 'Chưa có chi tiết hóa đơn.'}
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((inv) => {
                    const st = billStatusBadge(inv.status);
                    const isOpen = expandedBill === inv.billId;
                    const itemCount = (inv.items || []).length;
                    return (
                      <React.Fragment key={inv.billId}>
                        <tr>
                          <td>{inv.billId}</td>
                          <td>{inv.customerName}</td>
                          <td>{fmtDateTime(inv.orderDate)}</td>
                          <td>{fmtCurrency(inv.totalAmount)}</td>
                          <td>{itemCount}</td>
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
                                onClick={() =>
                                  setExpandedBill(isOpen ? null : inv.billId)
                                }
                                disabled={saving}
                              >
                                {isOpen ? 'Thu gọn' : 'Chi tiết'}
                              </button>
                              <button
                                type="button"
                                className="admin-table-link"
                                onClick={() => openEdit(inv)}
                                disabled={saving}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                className="admin-table-link admin-table-link--danger"
                                onClick={() => handleDelete(inv.billId)}
                                disabled={saving}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="admin-table-detail-row">
                            <td colSpan={7}>
                              <table className="admin-table admin-table--nested">
                                <thead>
                                  <tr>
                                    <th>SP ID</th>
                                    <th>Tên SP</th>
                                    <th>Size</th>
                                    <th>SL</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(inv.items || []).map((it, idx) => (
                                    <tr key={`${inv.billId}-${idx}`}>
                                      <td>{it.productId}</td>
                                      <td>{it.productName}</td>
                                      <td>{it.selectedSize}</td>
                                      <td>{it.quantity}</td>
                                      <td>{fmtCurrency(it.unitPrice)}</td>
                                      <td>{fmtCurrency(it.subtotal)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form className="admin-form-card admin-form-card--wide" onSubmit={handleSubmitForm}>
          <h2>{isNew ? 'Thêm chi tiết hóa đơn' : 'Sửa chi tiết hóa đơn'}</h2>
          <div className="admin-form-grid">
            <label>
              Mã hóa đơn (*)
              <input
                value={form.billId}
                onChange={(e) => handleFormChange('billId', e.target.value)}
                readOnly={!isNew}
              />
            </label>
            <label>
              Khách hàng
              <input
                value={form.customerName}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
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
              SĐT
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
              Tổng tiền
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => handleFormChange('totalAmount', e.target.value)}
              />
            </label>
            <label>
              Thanh toán
              <input
                value={form.paymentMethod}
                onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
              />
            </label>
            <label>
              Trạng thái
              <input
                value={form.status}
                onChange={(e) => handleFormChange('status', e.target.value)}
              />
            </label>
          </div>

          <h3 className="admin-form-subtitle">Sản phẩm trong đơn</h3>
          {form.items.map((it, index) => (
            <div className="admin-item-row" key={index}>
              <label>
                SP ID
                <input
                  value={it.productId}
                  onChange={(e) =>
                    handleItemChange(index, 'productId', e.target.value)
                  }
                />
              </label>
              <label>
                Tên SP
                <input
                  value={it.productName}
                  onChange={(e) =>
                    handleItemChange(index, 'productName', e.target.value)
                  }
                />
              </label>
              <label>
                Size
                <input
                  value={it.selectedSize}
                  onChange={(e) =>
                    handleItemChange(index, 'selectedSize', e.target.value)
                  }
                />
              </label>
              <label>
                SL
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) =>
                    handleItemChange(index, 'quantity', e.target.value)
                  }
                />
              </label>
              <label>
                Đơn giá
                <input
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) =>
                    handleItemChange(index, 'unitPrice', e.target.value)
                  }
                />
              </label>
              <label>
                Thành tiền
                <input
                  type="number"
                  value={it.subtotal}
                  onChange={(e) =>
                    handleItemChange(index, 'subtotal', e.target.value)
                  }
                />
              </label>
              {form.items.length > 1 && (
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--sm admin-item-row-remove"
                  onClick={() => removeItemRow(index)}
                >
                  Xóa dòng
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={addItemRow}
          >
            + Thêm sản phẩm
          </button>

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

export default Admininvoicedetails;
