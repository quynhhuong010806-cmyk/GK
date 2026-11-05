/* Câu 5: đọc reviews.xml bằng DOMParser, duyệt các node <review> */
function parseReviewsXML(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("reviews.xml lỗi");

  return [...doc.getElementsByTagName("review")].map(node => ({
    id: node.getAttribute("id"),
    productId: Number(node.getElementsByTagName("product_id")[0].textContent),
    customerId: node.getElementsByTagName("customer_id")[0].textContent,
    rating: Number(node.getElementsByTagName("rating")[0].textContent),
    comment: node.getElementsByTagName("comment")[0].textContent,
    date: node.getElementsByTagName("date")[0].textContent
  }));
}

/* Tính điểm trung bình cho từng product_id → Map(productId → {avg, count}) */
function calcAverageRatings(reviews) {
  const acc = {};
  reviews.forEach(r => {
    if (!acc[r.productId]) acc[r.productId] = { total: 0, count: 0 };
    acc[r.productId].total += r.rating;
    acc[r.productId].count++;
  });
  const map = new Map();
  Object.entries(acc).forEach(([id, v]) => map.set(Number(id), { avg: v.total / v.count, count: v.count }));
  return map;
}