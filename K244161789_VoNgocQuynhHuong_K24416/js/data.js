/* ===== Hàm tiện ích dùng chung ===== */
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

const money = n => Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
const stars = n => { const r = Math.round(n); return "★".repeat(r) + "☆".repeat(5 - r); };
const delay = ms => new Promise(r => setTimeout(r, ms));

/* ===== Tầng dữ liệu: đọc JSON / XML ===== */
const Store = {
  async fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Không tải được " + url);
    return res.text();
  },

  async loadJSON(url) {
    return JSON.parse(await this.fetchText(url));
  },

  // Dùng DOMParser để đọc XML
  async loadXML(url) {
    const doc = new DOMParser().parseFromString(await this.fetchText(url), "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("File XML lỗi: " + url);
    return doc;
  },

  getEmployees() { return this.loadJSON("data/employees.json"); },
  getCustomers() { return this.loadJSON("data/customers.json"); },

  async getProducts() {
    const doc = await this.loadXML("data/products.xml");
    return [...doc.querySelectorAll("product")].map(el => {
      const t = tag => el.querySelector(tag)?.textContent.trim() || "";
      return {
        id: Number(el.getAttribute("id")),
        title: t("title"),
        price: Number(t("price")),
        category: t("category"),
        description: t("description"),
        image: t("image"),
        stock: Number(t("stock")),
        colors: [...el.querySelectorAll("colors > color")].map(c => c.textContent),
        sizes: [...el.querySelectorAll("sizes > size")].map(s => s.textContent)
      };
    });
  },

  async getReviews() {
    return parseReviewsXML(await this.fetchText("data/reviews.xml")); // reviews.js
  },

  // Đơn hàng = hóa đơn mẫu trong carts.xml + đơn mới lưu trong localStorage
  async getOrders() {
    const products = await this.getProducts();
    const pmap = new Map(products.map(p => [p.id, p]));
    const doc = await this.loadXML("data/carts.xml");

    const seed = [...doc.querySelectorAll("cart")].map(c => ({
      id: c.getAttribute("id"),
      date: c.querySelector("createdDate").textContent,
      employeeId: c.querySelector("employeeId").textContent,
      customerId: c.querySelector("customerId").textContent,
      status: c.querySelector("status").textContent,
      items: [...c.querySelectorAll("details > item")].map(i => {
        const pid = Number(i.getAttribute("productId"));
        return {
          productId: pid,
          title: pmap.get(pid)?.title || "Sản phẩm #" + pid,
          variant: i.getAttribute("variant"),
          qty: Number(i.getAttribute("quantity")),
          price: Number(i.getAttribute("price"))
        };
      })
    }));

    const local = JSON.parse(localStorage.getItem("orders") || "[]");
    const override = JSON.parse(localStorage.getItem("statusOverride") || "{}");

    return [...seed, ...local].map(o => ({
      ...o,
      status: override[o.id] || o.status,
      total: o.items.reduce((s, i) => s + i.qty * i.price, 0)
    }));
  }
};