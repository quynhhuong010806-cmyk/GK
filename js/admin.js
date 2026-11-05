(async function () {
  // Chặn truy cập nếu chưa đăng nhập
  const user = JSON.parse(sessionStorage.getItem("adminUser") || "null");
  if (!user) { location.replace("login.html"); return; }

  document.getElementById("adminName").textContent = `${user.name} (${user.role})`;
  document.getElementById("btnLogout").addEventListener("click", () => {
    sessionStorage.removeItem("adminUser");
    location.replace("login.html");
  });

  const STATUSES = ["Chờ xử lý", "Đang giao", "Đã thanh toán", "Đã hủy"];
  const [orders, employees, customers] = await Promise.all([
    Store.getOrders(), Store.getEmployees(), Store.getCustomers()
  ]);
  const emp = new Map(employees.map(e => [e.id, e.name]));
  const cus = new Map(customers.map(c => [c.id, c.name]));
  const custName = o => o.customerName || cus.get(o.customerId) || o.customerId;

  const tbody = document.getElementById("orderBody");
  const filterStatus = document.getElementById("filterStatus");
  const searchBox = document.getElementById("searchOrder");

  STATUSES.forEach(s => filterStatus.insertAdjacentHTML("beforeend", `<option>${s}</option>`));

  /* Thống kê đơn hàng */
  function renderStats() {
    const valid = orders.filter(o => o.status !== "Đã hủy");
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const sold = valid.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
    document.getElementById("stats").innerHTML = `
      <div class="stat-card"><span>Tổng đơn hàng</span><b>${orders.length}</b></div>

      <div class="stat-card"><span>Doanh thu</span><b>${money(revenue)}</b></div>
      <div class="stat-card"><span>Sản phẩm đã bán</span><b>${sold}</b></div>
      <div class="stat-card"><span>Đơn đã hủy</span><b>${orders.length - valid.length}</b></div>`;

    // Thống kê sản phẩm được bán
    const agg = {};
    valid.forEach(o => o.items.forEach(i => {
      agg[i.productId] ||= { title: i.title, qty: 0, revenue: 0 };
      agg[i.productId].qty += i.qty;
      agg[i.productId].revenue += i.qty * i.price;
    }));
    const top = Object.values(agg).sort((a, b) => b.qty - a.qty);
    const maxQty = top[0]?.qty || 1;
    document.getElementById("topProducts").innerHTML = top.length ? `
      <table class="data-table">
        <thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Biểu đồ</th><th>Doanh thu</th></tr></thead>
        <tbody>${top.map(t => `
          <tr><td>${esc(t.title)}</td><td>${t.qty}</td>
              <td><div class="bar"><span style="width:${(t.qty / maxQty) * 100}%"></span></div></td>
              <td>${money(t.revenue)}</td></tr>`).join("")}
        </tbody>
      </table>` : '<p class="empty">Chưa có dữ liệu.</p>';
  }

  /* Bảng đơn hàng */
  function renderOrders() {
    const st = filterStatus.value;
    const q = searchBox.value.trim().toLowerCase();
    const list = orders.filter(o =>
      (!st || o.status === st) &&
      (!q || o.id.toLowerCase().includes(q) || custName(o).toLowerCase().includes(q)));


    tbody.innerHTML = list.length ? list.map(o => `
      <tr>
        <td>${esc(o.id)}</td><td>${esc(o.date)}</td><td>${esc(custName(o))}</td>
        <td>${esc(emp.get(o.employeeId) || o.employeeId)}</td><td>${money(o.total)}</td>
        <td>
          <select data-order="${esc(o.id)}">
            ${STATUSES.map(s => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><button class="btn" data-detail="${esc(o.id)}">Chi tiết</button></td>
      </tr>
      <tr class="detail-row" id="d-${esc(o.id)}" hidden>
        <td colspan="7">
          <table class="data-table">
            <thead><tr><th>Sản phẩm</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
            <tbody>${o.items.map(i => `
              <tr><td>${esc(i.title)}</td><td>${esc(i.variant)}</td><td>${i.qty}</td>
                  <td>${money(i.price)}</td><td>${money(i.qty * i.price)}</td></tr>`).join("")}
            </tbody>
          </table>
        </td>
      </tr>`).join("") : '<tr><td colspan="7" class="empty">Không có đơn hàng.</td></tr>';
  }

  // Click "Chi tiết" (delegation)
  tbody.addEventListener("click", e => {
    const btn = e.target.closest("[data-detail]");
    if (btn) document.getElementById("d-" + btn.dataset.detail).toggleAttribute("hidden");
  });

  // Đổi trạng thái đơn
  tbody.addEventListener("change", e => {

    const sel = e.target.closest("select[data-order]");
    if (!sel) return;
    const override = JSON.parse(localStorage.getItem("statusOverride") || "{}");
    override[sel.dataset.order] = sel.value;
    localStorage.setItem("statusOverride", JSON.stringify(override));
    orders.find(o => o.id === sel.dataset.order).status = sel.value;
    renderStats();
  });

  filterStatus.addEventListener("change", renderOrders);
  searchBox.addEventListener("input", renderOrders);

  renderStats();
  renderOrders();
})();