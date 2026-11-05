/* Câu 6: đối tượng quản lý state giỏ hàng */
const Cart = {
  items: [],

  load() {
    try { this.items = JSON.parse(localStorage.getItem("cart")) || []; }
    catch { this.items = []; }
  },
  save() { localStorage.setItem("cart", JSON.stringify(this.items)); },

  // Thêm mới nếu chưa có, tăng số lượng nếu cùng sản phẩm + cùng màu/size
  add(product, variant) {
    const found = this.items.find(i => i.productId === product.id && i.variant === variant);
    const current = found ? found.qty : 0;
    if (current + 1 > product.stock) {
      alert(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
      return;
    }
    if (found) found.qty++;
    else this.items.push({
      productId: product.id, title: product.title, image: product.image,
      price: product.price, variant, qty: 1
    });
    this.save();
    this.render();
  },

  changeQty(productId, variant, delta) {
    const it = this.items.find(i => i.productId === productId && i.variant === variant);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) this.remove(productId, variant);

    else { this.save(); this.render(); }
  },

  remove(productId, variant) {
    this.items = this.items.filter(i => !(i.productId === productId && i.variant === variant));
    this.save();
    this.render();
  },

  clear() { this.items = []; this.save(); this.render(); },

  // Tự động tính lại tổng tiền / tổng số lượng
  total() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },
  count() { return this.items.reduce((s, i) => s + i.qty, 0); },

  // Render bảng Mini-cart
  render() {
    const badge = document.getElementById("cartCount");
    if (badge) badge.textContent = this.count();

    const body = document.getElementById("miniCartBody");
    if (!body) return;

    if (!this.items.length) {
      body.innerHTML = '<p class="empty">Giỏ hàng trống</p>';
    } else {
      body.innerHTML = `
        <table class="mini-table">
          <thead><tr><th>Sản phẩm</th><th>Loại</th><th>SL</th><th>Thành tiền</th><th></th></tr></thead>
          <tbody>
            ${this.items.map(i => `
              <tr>

                <td>${esc(i.title.slice(0, 24))}…</td>
                <td>${esc(i.variant)}</td>
                <td class="qty">
                  <button data-act="dec" data-id="${i.productId}" data-variant="${esc(i.variant)}">−</button>
                  ${i.qty}
                  <button data-act="inc" data-id="${i.productId}" data-variant="${esc(i.variant)}">+</button>
                </td>
                <td>${money(i.price * i.qty)}</td>
                <td><button class="del" data-act="del" data-id="${i.productId}" data-variant="${esc(i.variant)}">✕</button></td>
              </tr>`).join("")}
          </tbody>
        </table>`;
    }
    const totalEl = document.getElementById("miniCartTotal");
    if (totalEl) totalEl.textContent = money(this.total());
  },

  // Gắn sự kiện cho nút mở giỏ + các nút trong mini-cart (delegation)
  bindUI() {
    const toggle = document.getElementById("cartToggle");
    const panel = document.getElementById("miniCart");
    if (toggle && panel) toggle.addEventListener("click", () => panel.toggleAttribute("hidden"));

    const body = document.getElementById("miniCartBody");
    if (body) body.addEventListener("click", e => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = Number(btn.dataset.id), v = btn.dataset.variant;
      if (btn.dataset.act === "inc") this.changeQty(id, v, +1);
      if (btn.dataset.act === "dec") this.changeQty(id, v, -1);
      if (btn.dataset.act === "del") this.remove(id, v);
    });

  }
};