import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Adminproduct from './Adminproduct';
import Admincategory from './Admincategory';
import Admincustomer from './Admincustomer';
import Adminemployee from './Adminemployee';
import Adminbill from './Adminbill';
import Admininvoicedetails from './Admininvoicedetails';
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

const SECTION_LABEL = {
  dashboard: 'Trang chủ',
  products: 'Sản phẩm',
  category: 'Danh mục',
  customer: 'Khách hàng',
  employee: 'Nhân viên',
  bill: 'Hóa đơn',
  invoiceDetails: 'Chi tiết hóa đơn',
};

const SECTION_ICON = {
  dashboard: 'bi-house',
  products: 'bi-box-seam',
  category: 'bi-tags',
  customer: 'bi-people',
  employee: 'bi-person-badge',
  bill: 'bi-receipt',
  invoiceDetails: 'bi-receipt-cutoff',
};

const PATH_TO_SECTION = {
  '/admin': 'dashboard',
  '/admin/product': 'products',
  '/admin/category': 'category',
  '/admin/customer': 'customer',
  '/admin/employee': 'employee',
  '/admin/bill': 'bill',
  '/admin/invoicedetails': 'invoiceDetails',
};

const SECTION_TO_PATH = {
  dashboard: '/admin',
  products: '/admin/product',
  category: '/admin/category',
  customer: '/admin/customer',
  employee: '/admin/employee',
  bill: '/admin/bill',
  invoiceDetails: '/admin/invoicedetails',
};

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allowed, setAllowed] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [adminSection, setAdminSection] = useState('dashboard');
  const userMenuRef = useRef(null);

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    const section = PATH_TO_SECTION[path] ?? 'dashboard';
    setAdminSection(section);
  }, [location.pathname]);

  useEffect(() => {
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
  }, [navigate]);

  useEffect(() => {
    if (!allowed) return;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [pRes, cRes, bRes, cuRes, eRes, iRes] = await Promise.all([
          fetch(`${jsonBase}products.json`),
          fetch(`${jsonBase}category.json`),
          fetch(`${jsonBase}bill.json`),
          fetch(`${jsonBase}customer.json`),
          fetch(`${jsonBase}employee.json`),
          fetch(`${jsonBase}invoicedetails.json`),
        ]);
        if (!pRes.ok) throw new Error('Không tải được products.json');
        const pdata = await pRes.json();
        setProducts(Array.isArray(pdata) ? pdata : []);
        if (cRes.ok) {
          const cdata = await cRes.json();
          setCategories(Array.isArray(cdata) ? cdata : []);
        }
        if (bRes.ok) {
          const bdata = await bRes.json();
          setBills(Array.isArray(bdata) ? bdata : []);
        }
        if (cuRes.ok) {
          const cudata = await cuRes.json();
          setCustomers(Array.isArray(cudata) ? cudata : []);
        }
        if (eRes.ok) {
          const edata = await eRes.json();
          setEmployees(Array.isArray(edata) ? edata : []);
        }
        if (iRes.ok) {
          const idata = await iRes.json();
          setInvoiceDetails(Array.isArray(idata) ? idata : []);
        }
      } catch (e) {
        setLoadError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allowed]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const staffInitials = useMemo(() => {
    const name = String(currentUser?.fullName || currentUser?.user || 'AD').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) return 'AD';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [currentUser]);

  const staffDisplayName = useMemo(
    () => String(currentUser?.fullName || currentUser?.user || 'Quản trị viên').trim(),
    [currentUser]
  );

  const stats = useMemo(() => {
    const soldSum = invoiceDetails.reduce((sum, inv) => {
      const items = Array.isArray(inv.items) ? inv.items : [];
      return sum + items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    }, 0);

    const uncategorized = products.filter(
      (p) => p.idcategory == null || p.idcategory === ''
    ).length;

    const revenue = bills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount || 0),
      0
    );

    const avgBill = bills.length ? revenue / bills.length : 0;

    return {
      total: products.length,
      soldSum,
      catCount: categories.length,
      uncategorized,
      revenue,
      avgBill,
      billCount: bills.length,
    };
  }, [products, categories, invoiceDetails, bills]);

  const recentBills = useMemo(
    () =>
      [...bills]
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5),
    [bills]
  );

  const topProducts = useMemo(() => {
    const counts = {};
    invoiceDetails.forEach((inv) => {
      (inv.items || []).forEach((it) => {
        const key = it.productName || `SP-${it.productId}`;
        if (!counts[key]) {
          counts[key] = { name: key, qty: 0, revenue: 0 };
        }
        counts[key].qty += Number(it.quantity || 0);
        counts[key].revenue += Number(it.subtotal || 0);
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [invoiceDetails]);

  const topRevenueBills = useMemo(
    () =>
      [...bills]
        .sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0))
        .slice(0, 5),
    [bills]
  );

  const topCustomers = useMemo(() => {
    const map = {};
    bills.forEach((b) => {
      const name = b.customerName || 'Khách lẻ';
      if (!map[name]) {
        map[name] = { name, phone: b.phone || '', orders: 0, total: 0 };
      }
      map[name].orders += 1;
      map[name].total += Number(b.totalAmount || 0);
      if (!map[name].phone && b.phone) map[name].phone = b.phone;
    });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [bills]);

  const goHome = () => navigate('/');
  const logout = () => {
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/login');
    setLogoutModalOpen(false);
  };
  const closeMobileNav = () => setMobileSidebarOpen(false);

  if (!allowed) {
    return <div className="ruang-boot" aria-hidden />;
  }

  const sectionTitle = SECTION_LABEL[adminSection] || 'Admin';

  return (
    <div className="ruang-layout">
      <div
        className={`ruang-overlay ${mobileSidebarOpen ? 'is-visible' : ''}`}
        onClick={closeMobileNav}
        aria-hidden={!mobileSidebarOpen}
      />

      <aside className={`ruang-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
        <div className="ruang-sidebar-brand">
          <span className="ruang-sidebar-brand-icon">
            <i className="bi bi-flower2" />
          </span>
          <span>Tươi</span>
        </div>
        <hr className="ruang-sidebar-divider" />
        <div className="ruang-sidebar-heading">Quản lý</div>
        <ul className="ruang-sidebar-nav">
          {Object.entries(SECTION_LABEL).map(([key, label]) => (
            <li key={key}>
              <button
                type="button"
                className={`ruang-sidebar-link ${adminSection === key ? 'is-active' : ''}`}
                  onClick={() => {
                    setAdminSection(key);
                    navigate(SECTION_TO_PATH[key] || '/Admin');
                    closeMobileNav();
                  }}
              >
                <i className={`bi ${SECTION_ICON[key] || 'bi-circle'}`} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="ruang-shell">
        <header className="ruang-topbar">
          <button
            type="button"
            className="ruang-topbar-toggle"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            aria-label="Mở menu"
          >
            <i className="bi bi-list" />
          </button>
          <div className="ruang-breadcrumb-wrap">
            <h1 className="ruang-heading">{sectionTitle}</h1>
          </div>
          <div className="ruang-topbar-right">
            <div className="ruang-user" ref={userMenuRef}>
              <button
                type="button"
                className="ruang-user-toggle"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <span className="ruang-user-avatar">{staffInitials}</span>
                <span className="ruang-user-name">{staffDisplayName}</span>
              </button>
              {userMenuOpen && (
                <div className="ruang-user-menu">
                  <div className="ruang-user-menu-title">Tài khoản</div>
                  <button type="button" onClick={goHome}>
                    <i className="bi bi-house" /> Trang chủ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setLogoutModalOpen(true);
                    }}
                  >
                    <i className="bi bi-box-arrow-right" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="ruang-main">
          {loadError && (
            <div className="admin-msg admin-msg--error">{loadError}</div>
          )}

          {adminSection !== 'dashboard' && (
            <div className="admin-panel">
              {adminSection === 'products' && <Adminproduct embedded />}
              {adminSection === 'category' && <Admincategory embedded />}
              {adminSection === 'customer' && <Admincustomer embedded />}
              {adminSection === 'employee' && <Adminemployee embedded />}
              {adminSection === 'bill' && <Adminbill embedded />}
              {adminSection === 'invoiceDetails' && (
                <Admininvoicedetails embedded />
              )}
            </div>
          )}

          {adminSection === 'dashboard' &&
            (loading ? (
              <div className="ruang-loading">Đang tải dữ liệu...</div>
            ) : (
                <div className="admin-dashboard">
                  <div className="ruang-cards">
                    <div className="ruang-stat-card">
                      <div className="ruang-stat-card-body">
                        <div className="ruang-stat-card-label">Doanh thu</div>
                        <div className="ruang-stat-card-value">
                          {fmtCurrency(stats.revenue)}
                        </div>
                        <span className="ruang-stat-card-badge">
                          {fmtNumber(stats.billCount)} hóa đơn
                        </span>
                      </div>
                      <span className="ruang-stat-card-icon">
                        <i className="bi bi-cash-coin" />
                      </span>
                    </div>
                    <div className="ruang-stat-card ruang-stat-card--green">
                      <div className="ruang-stat-card-body">
                        <div className="ruang-stat-card-label">Sản phẩm</div>
                        <div className="ruang-stat-card-value">
                          {fmtNumber(stats.total)}
                        </div>
                        <span className="ruang-stat-card-badge ruang-stat-card-badge--muted">
                          {fmtNumber(stats.catCount)} danh mục
                        </span>
                      </div>
                      <span className="ruang-stat-card-icon">
                        <i className="bi bi-box-seam" />
                      </span>
                    </div>
                    <div className="ruang-stat-card ruang-stat-card--cyan">
                      <div className="ruang-stat-card-body">
                        <div className="ruang-stat-card-label">Khách hàng</div>
                        <div className="ruang-stat-card-value">
                          {fmtNumber(customers.length)}
                        </div>
                        <span className="ruang-stat-card-badge ruang-stat-card-badge--muted">
                          {fmtNumber(employees.length)} nhân viên
                        </span>
                      </div>
                      <span className="ruang-stat-card-icon">
                        <i className="bi bi-people" />
                      </span>
                    </div>
                    <div className="ruang-stat-card ruang-stat-card--amber">
                      <div className="ruang-stat-card-body">
                        <div className="ruang-stat-card-label">Đã bán</div>
                        <div className="ruang-stat-card-value">
                          {fmtNumber(stats.soldSum)}
                        </div>
                        <span className="ruang-stat-card-badge">
                          TB {fmtCurrency(stats.avgBill)}/đơn
                        </span>
                      </div>
                      <span className="ruang-stat-card-icon">
                        <i className="bi bi-cart3" />
                      </span>
                    </div>
                  </div>

                  <div className="ruang-dashboard-grid">
                    <div className="ruang-card">
                      <div className="ruang-card-title-bar">
                        <h6>Hóa đơn gần đây</h6>
                      </div>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Mã HD</th>
                              <th>Khách hàng</th>
                              <th>Ngày</th>
                              <th>Tổng</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentBills.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="admin-table-empty">
                                  Chưa có hóa đơn
                                </td>
                              </tr>
                            ) : (
                              recentBills.map((b) => {
                                const st = billStatusBadge(b.status);
                                return (
                                  <tr key={b.billId}>
                                    <td>{b.billId}</td>
                                    <td>{b.customerName}</td>
                                    <td>{fmtDateTime(b.orderDate)}</td>
                                    <td>{fmtCurrency(b.totalAmount)}</td>
                                    <td>
                                      <span
                                        className={`ruang-status ruang-status--${st.cls}`}
                                      >
                                        {st.label}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="ruang-card">
                      <div className="ruang-card-title-bar">
                        <h6>Hóa đơn doanh thu cao</h6>
                      </div>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Mã HD</th>
                              <th>Khách hàng</th>
                              <th>Tổng tiền</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topRevenueBills.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="admin-table-empty">
                                  Chưa có dữ liệu
                                </td>
                              </tr>
                            ) : (
                              topRevenueBills.map((b) => {
                                const st = billStatusBadge(b.status);
                                return (
                                  <tr key={b.billId}>
                                    <td>{b.billId}</td>
                                    <td>{b.customerName}</td>
                                    <td>{fmtCurrency(b.totalAmount)}</td>
                                    <td>
                                      <span
                                        className={`ruang-status ruang-status--${st.cls}`}
                                      >
                                        {st.label}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="ruang-bottom-grid">
                    <div className="ruang-card">
                      <div className="ruang-card-title-bar">
                        <h6>Sản phẩm bán chạy</h6>
                      </div>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Tên sản phẩm</th>
                              <th>Đã bán</th>
                              <th>Doanh thu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topProducts.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="admin-table-empty">
                                  Chưa có dữ liệu bán
                                </td>
                              </tr>
                            ) : (
                              topProducts.map((p) => (
                                <tr key={p.name}>
                                  <td>{p.name}</td>
                                  <td>{fmtNumber(p.qty)}</td>
                                  <td>{fmtCurrency(p.revenue)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="ruang-card">
                      <div className="ruang-card-title-bar">
                        <h6>Khách hàng tiêu biểu</h6>
                      </div>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Tên</th>
                              <th>SĐT</th>
                              <th>Số đơn</th>
                              <th>Tổng mua</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topCustomers.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="admin-table-empty">
                                  Chưa có khách hàng
                                </td>
                              </tr>
                            ) : (
                              topCustomers.map((c) => (
                                <tr key={c.name}>
                                  <td>{c.name}</td>
                                  <td>{c.phone || '—'}</td>
                                  <td>{fmtNumber(c.orders)}</td>
                                  <td>{fmtCurrency(c.total)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </main>

        <footer className="ruang-footer">

        </footer>
      </div>

      {logoutModalOpen && (
        <div className="ruang-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ruang-modal">
            <div className="ruang-modal-header">
              <h5>Đăng xuất</h5>
              <button
                type="button"
                className="ruang-modal-close"
                onClick={() => setLogoutModalOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="ruang-modal-body">
              Bạn có chắc muốn đăng xuất khỏi trang quản trị?
            </div>
            <div className="ruang-modal-footer">
              <button
                type="button"
                className="ruang-modal-btn"
                onClick={() => setLogoutModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="ruang-modal-btn ruang-modal-btn--danger"
                onClick={logout}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
