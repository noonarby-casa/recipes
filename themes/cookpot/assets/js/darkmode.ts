export function initDarkMode(): void {
  const toggleBtn = document.getElementById("header-theme-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}
