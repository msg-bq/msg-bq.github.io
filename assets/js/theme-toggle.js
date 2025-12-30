(function () {
  const toggleDarkMode = document.querySelector(".js-toggle-dark-mode");

  if (!toggleDarkMode) {
    return;
  }

  const updateToggle = function (theme) {
    if (theme === "dark") {
      toggleDarkMode.textContent = "☼";
      toggleDarkMode.ariaLabel = "Switch to light mode";
    } else {
      toggleDarkMode.textContent = "☾";
      toggleDarkMode.ariaLabel = "Switch to dark mode";
    }
  };

  const applyTheme = function (theme) {
    if (window.jtd && jtd.setTheme) {
      jtd.setTheme(theme);
    }
    localStorage.setItem("theme", theme);
    updateToggle(theme);
  };

  const bindToggle = function () {
    toggleDarkMode.addEventListener("click", function () {
      const currentTheme =
        (window.jtd && jtd.getTheme && jtd.getTheme()) ||
        localStorage.getItem("theme") ||
        "light";
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
    });
  };

  const boot = function () {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      applyTheme(storedTheme);
    } else {
      updateToggle("light");
    }
    bindToggle();

    let attempts = 0;
    const maxAttempts = 40;
    const interval = setInterval(function () {
      attempts += 1;
      if (window.jtd && jtd.setTheme) {
        const desiredTheme =
          localStorage.getItem("theme") ||
          (jtd.getTheme && jtd.getTheme()) ||
          "light";
        applyTheme(desiredTheme);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 50);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
