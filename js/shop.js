(async function () {
  const grid = document.getElementById("productGrid");
  const form = document.getElementById("searchForm");
  const info = document.getElementById("resultInfo");
  const minInput = document.getElementById("minPrice");
  const maxInput = document.getElementById("maxPrice");

  let products = [], reviews = [], customers = [], ratingMap = new Map();

  Cart.load();
  Cart.bindUI();
  Cart.render();

  /* ---------- Câu 3: Skeleton loading ---------- */
  function showSkeleton(n = 8) {
    grid.innerHTML = Array.from({ length: n }, () => `
      <article class="card skeleton">
        <div class="sk-img"></div>
        <div class="sk-line"></div>
        <div class="sk-line short"></div>
        <div class="sk-line"></div>
      </article>`).join("");
  }

  /* ---------- Render danh sách ---------- */
  function cardHTML(p) {
    const color = p.colors[0] || "Đen";
    const size = p.sizes[0] || "Free";
    const variant = `${color}-${size}`;
    return `
      <article class="card" data-id="${p.id}" data-color="${esc(color)}" data-size="${esc(size)}">
        <div class="img-wrap"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>
        <h3 title="${esc(p.title)}">${esc(p.title)}</h3>
        <p class="price">${money(p.price)}</p>
        <p class="stock">Tồn kho: ${p.stock}</p>
        <div class="chips">
          ${p.colors.map((c, i) => `<button type="button" class="chip${i === 0 ? " active" : ""}" data-action="pick-color" data-value="${esc(c)}">${esc(c)}</button>`).join("")}
        </div>
        <div class="chips">
          ${p.sizes.map((s, i) => `<button type="button" class="chip${i === 0 ? " active" : ""}" data-action="pick-size" data-value="${esc(s)}">${esc(s)}</button>`).join("")}
        </div>
        <div class="actions">
          <button type="button" class="btn primary" data-action="add" data-id="${p.id}" data-variant="${esc(variant)}">Thêm vào giỏ hàng</button>
          <button type="button" class="btn" data-action="quick" data-id="${p.id}" data-variant="${esc(variant)}">Xem nhanh</button>
          <button type="button" class="btn link" data-action="rating-detail" data-id="${p.id}">Rating Detail</button>
        </div>
      </article>`;
  }

  function renderProducts(list) {
    info.textContent = `Tìm thấy ${list.length} sản phẩm`;
    if (!list.length) { grid.innerHTML = '<p class="empty">Không có sản phẩm phù hợp.</p>'; return; }
    grid.innerHTML = list.map(cardHTML).join("");
    injectRatings();
  }

  /* ---------- Câu 5: tạo thẻ <span> sao trung bình chèn lên ảnh ---------- */
  function injectRatings() {
    grid.querySelectorAll(".card").forEach(card => {
      const id = Number(card.dataset.id);
      const r = ratingMap.get(id);
      const span = document.createElement("span");
      span.className = "rating-badge";
      span.dataset.action = "rating-detail";
      span.dataset.id = id;
      span.textContent = r ? `★ ${r.avg.toFixed(1)} (${r.count})` : "Chưa có đánh giá";
      card.querySelector(".img-wrap").appendChild(span);
    });
  }

  function showRatings(product) {
    const list = reviews.filter(r => r.productId === product.id);
    const cmap = new Map(customers.map(c => [c.id, c.name]));
    const avg = ratingMap.get(product.id);
    document.getElementById("ratingBody").innerHTML = `
      <h3>${esc(product.title)}</h3>
      <p>${avg ? `Điểm trung bình: <b>${avg.avg.toFixed(2)}</b> / 5 (${avg.count} đánh giá)` : "Chưa có đánh giá nào."}</p>
      ${list.length ? `
      <table class="data-table">
        <thead><tr><th>Khách hàng</th><th>Số sao</th><th>Nhận xét</th><th>Ngày</th></tr></thead>
        <tbody>${list.map(r => `
          <tr><td>${esc(cmap.get(r.customerId) || r.customerId)}</td>
              <td class="star">${stars(r.rating)}</td>
              <td>${esc(r.comment)}</td><td>${esc(r.date)}</td></tr>`).join("")}
        </tbody>
      </table>` : ""}`;
    document.getElementById("ratingDialog").showModal();
  }

  function showQuick(product, variant) {
    document.getElementById("quickBody").innerHTML = `
      <div class="quick">
        <img src="${esc(product.image)}" alt="${esc(product.title)}">
        <div>
          <h3>${esc(product.title)}</h3>
          <p class="price">${money(product.price)}</p>
          <p><b>Danh mục:</b> ${esc(product.category)}</p>
          <p><b>Phân loại đang chọn:</b> ${esc(variant)}</p>
          <p><b>Tồn kho:</b> ${product.stock}</p>
          <p class="desc">${esc(product.description)}</p>
          <button type="button" class="btn primary" data-action="add" data-id="${product.id}" data-variant="${esc(variant)}">Thêm vào giỏ hàng</button>
        </div>
      </div>`;
    document.getElementById("quickView").showModal();
  }

  /* ---------- Câu 4: Event Delegation ---------- */
  function handleAction(btn) {
    const action = btn.dataset.action;
    const card = btn.closest(".card");

    // Chọn màu / size → cập nhật data-variant của các nút trong card
    if (action === "pick-color" || action === "pick-size") {
      const key = action === "pick-color" ? "color" : "size";
      card.dataset[key] = btn.dataset.value;
      btn.parentElement.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === btn));
      const v = `${card.dataset.color}-${card.dataset.size}`;
      card.querySelectorAll("[data-variant]").forEach(b => (b.dataset.variant = v));
      return;
    }

    // Trích xuất data-id và data-variant của sản phẩm tương ứng
    const id = Number(btn.dataset.id);
    const variant = btn.dataset.variant;
    const product = products.find(p => p.id === id);
    console.log("data-id:", id, "| data-variant:", variant);

    if (action === "add") Cart.add(product, variant);
    else if (action === "quick") showQuick(product, variant);
    else if (action === "rating-detail") showRatings(product);
  }

  // DUY NHẤT một Event Listener gắn trên container cha chứa toàn bộ sản phẩm
  grid.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (btn && grid.contains(btn)) handleAction(btn);
  });

  // (dialog quick view là phần tử riêng, không nằm trong container sản phẩm)
  document.getElementById("quickView").addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (btn) handleAction(btn);
  });

  /* ---------- Câu 2: Form tìm kiếm nâng cao ---------- */
  function applyFilter() {
    const f = new FormData(form);
    const kw = (f.get("keyword") || "").trim().toLowerCase();
    const min = f.get("minPrice") === "" ? 0 : Number(f.get("minPrice"));
    const max = f.get("maxPrice") === "" ? Infinity : Number(f.get("maxPrice"));
    const colors = f.getAll("color");
    const minRating = Number(f.get("rating"));
    const cat = f.get("category");

    renderProducts(products.filter(p =>
      p.title.toLowerCase().includes(kw) &&
      p.price >= min && p.price <= max &&
      (!colors.length || colors.some(c => p.colors.includes(c))) &&
      (ratingMap.get(p.id)?.avg || 0) >= minRating &&
      (!cat || p.category === cat)
    ));
  }

  // Validation: giá từ ≤ giá đến
  function checkRange() {
    const a = minInput.value, b = maxInput.value;
    maxInput.setCustomValidity(a !== "" && b !== "" && Number(a) > Number(b) ? "Giá đến phải ≥ giá từ" : "");
  }
  minInput.addEventListener("input", checkRange);
  maxInput.addEventListener("input", checkRange);

  const range = document.getElementById("ratingRange");
  const out = document.getElementById("ratingOut");
  range.addEventListener("input", () => (out.textContent = range.value));

  form.addEventListener("submit", e => { e.preventDefault(); applyFilter(); });
  form.addEventListener("reset", () => setTimeout(() => { out.textContent = "0"; applyFilter(); }));

  /* ---------- Khởi tạo ---------- */
  showSkeleton(8);
  try {
    [products, reviews, customers] = await Promise.all([
      Store.getProducts(), Store.getReviews(), Store.getCustomers(), delay(900)
    ]);
    ratingMap = calcAverageRatings(reviews);

    const sel = document.getElementById("categorySelect");
    [...new Set(products.map(p => p.category))].forEach(c => {
      const o = document.createElement("option");
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
    renderProducts(products);
  } catch (err) {
    grid.innerHTML = `<p class="empty error-text">Lỗi tải dữ liệu: ${esc(err.message)}. Hãy chạy bằng server và tạo data/products.xml.</p>`;
  }
})();