(async function () {
  const form = document.getElementById("checkoutForm");
  const inputs = form.querySelectorAll("input[name], textarea[name]");
  const summary = document.getElementById("orderSummary");
  const result = document.getElementById("result");

  Cart.load();
  Cart.bindUI();
  Cart.render();

  /* Tóm tắt giỏ hàng */
  function renderSummary() {
    if (!Cart.items.length) {
      summary.innerHTML = '<p class="empty">Giỏ hàng trống. <a href="index.html">Quay lại mua sắm</a></p>';
      return;
    }
    summary.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Sản phẩm</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
        <tbody>${Cart.items.map(i => `
          <tr><td>${esc(i.title)}</td><td>${esc(i.variant)}</td><td>${i.qty}</td>
              <td>${money(i.price)}</td><td>${money(i.price * i.qty)}</td></tr>`).join("")}
        </tbody>
        <tfoot><tr><td colspan="4"><b>Tổng cộng</b></td><td><b>${money(Cart.total())}</b></td></tr></tfoot>
      </table>`;
  }
  renderSummary();

  /* Regex tự định nghĩa */
  const REGEX_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;          // SĐT Việt Nam
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


  const rules = {
    fullName: { test: v => v.trim().length >= 3, msg: "Họ tên tối thiểu 3 ký tự" },
    phone:    { test: v => REGEX_PHONE.test(v.trim()), msg: "SĐT Việt Nam không hợp lệ (vd: 0912345678 hoặc +84912345678)" },
    email:    { test: v => REGEX_EMAIL.test(v.trim()), msg: "Email không hợp lệ (vd: ten@gmail.com)" },
    address:  { test: v => v.trim().length >= 8, msg: "Địa chỉ tối thiểu 8 ký tự" }
  };

  function validateField(input) {
    const rule = rules[input.name];
    const ok = rule.test(input.value);
    input.closest(".field").querySelector(".error").textContent = ok ? "" : rule.msg;
    input.classList.toggle("invalid", !ok);
    input.classList.toggle("valid", ok);
    return ok;
  }

  // Kiểm tra ngay lập tức: keyup và blur
  inputs.forEach(i => {
    i.addEventListener("keyup", () => validateField(i));
    i.addEventListener("blur", () => validateField(i));
  });

  /* API thanh toán giả lập */
  function fakePaymentAPI(order) {
    return new Promise(resolve =>
      setTimeout(() => resolve({ success: true, transactionId: "TX" + Date.now(), orderId: order.id }), 1200));
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!Cart.items.length) { alert("Giỏ hàng đang trống!"); return; }


    const allValid = [...inputs].map(validateField).every(Boolean);
    if (!allValid) return;

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Đang xử lý thanh toán...";

    const f = new FormData(form);
    const customers = await Store.getCustomers();
    const found = customers.find(c =>
      c.phone === f.get("phone").trim() || c.email.toLowerCase() === f.get("email").trim().toLowerCase());

    const order = {
      id: "HD" + Date.now().toString().slice(-6),
      date: new Date().toISOString().slice(0, 10),
      employeeId: "NV02",                       // nhân viên phụ trách đơn online
      customerId: found ? found.id : "KH_GUEST",
      customerName: f.get("fullName").trim(),
      phone: f.get("phone").trim(),
      email: f.get("email").trim(),
      address: f.get("address").trim(),
      status: "Chờ xử lý",
      items: Cart.items.map(i => ({
        productId: i.productId, title: i.title, variant: i.variant, qty: i.qty, price: i.price
      }))
    };

    const res = await fakePaymentAPI(order);
    if (res.success) {
      // Lưu dữ liệu giả lập vào localStorage
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push(order);

      localStorage.setItem("orders", JSON.stringify(orders));
      Cart.clear();

      form.hidden = true;
      summary.innerHTML = "";
      result.hidden = false;
      result.innerHTML = `
        <h2>✅ Thanh toán thành công!</h2>
        <p>Mã hóa đơn: <b>${order.id}</b></p>
        <p>Mã giao dịch: <b>${res.transactionId}</b></p>
        <p>Cảm ơn <b>${esc(order.customerName)}</b>. Đơn hàng được lưu trong localStorage.</p>
        <a class="btn primary" href="index.html">Tiếp tục mua sắm</a>`;
    }
  });
})();