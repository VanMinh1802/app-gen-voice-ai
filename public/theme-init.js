(function() {
  try {
    var theme = localStorage.getItem("theme");
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else if (theme === "dark" || (!theme && dark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
