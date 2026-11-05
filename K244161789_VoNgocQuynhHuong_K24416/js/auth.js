(function () {
  const form = document.getElementById("loginForm");
  const err = document.getElementById("loginError");

  if (sessionStorage.getItem("adminUser")) location.replace("admin.html");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    err.textContent = "";
    const username = form.username.value.trim();
    const password = form.password.value;

    try {
      const employees = await Store.getEmployees();
      const user = employees.find(u => u.username === username && u.password === password);
      if (!user) { err.textContent = "Sai tên đăng nhập hoặc mật khẩu!"; return; }

      sessionStorage.setItem("adminUser", JSON.stringify({ id: user.id, name: user.name, role: user.role }));
      location.href = "admin.html";
    } catch (ex) {
      err.textContent = "Lỗi: " + ex.message;
    }
  });
})();