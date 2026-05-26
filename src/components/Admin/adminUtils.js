export function fmtNumber(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function fmtCurrency(n) {
  return `${fmtNumber(Number(n) || 0)} đ`;
}

export function fmtDateTime(iso) {
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

export function billStatusBadge(statusRaw) {
  const label = String(statusRaw || '').trim() || 'Chưa xác định';
  const key = label.toLowerCase();
  const mapped = BILL_STATUS_VI[key];
  return {
    label,
    cls: mapped?.cls || 'unknown',
  };
}

export function checkAdminRole(user) {
  return user?.role === 'admin';
}
