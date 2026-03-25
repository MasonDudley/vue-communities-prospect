const toggle = document.querySelector("[data-nav-toggle]");
const header = document.querySelector(".site-header");
const nav = document.querySelector(".nav-links");
const navShell = document.querySelector(".nav-shell");

const setMenuOpen = (isOpen) => {
  document.body.classList.toggle("menu-open", isOpen);

  if (toggle) {
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
};

if (toggle) {
  toggle.addEventListener("click", () => {
    setMenuOpen(!document.body.classList.contains("menu-open"));
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    setMenuOpen(false);
  });
});

document.addEventListener("click", (event) => {
  if (!navShell || !nav || window.innerWidth > 900) return;
  if (!document.body.classList.contains("menu-open")) return;
  if (navShell.contains(event.target)) return;

  setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    setMenuOpen(false);
  }
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
}

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const form = document.querySelector("[data-mailto-form]");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const community = String(formData.get("community") || "").trim();
    const moveIn = String(formData.get("move-in") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const subject = encodeURIComponent(
      `Leasing inquiry${community ? ` - ${community}` : ""}${name ? ` - ${name}` : ""}`,
    );
    const body = encodeURIComponent(
      [
        `Name: ${name || "Not provided"}`,
        `Email: ${email || "Not provided"}`,
        `Phone: ${phone || "Not provided"}`,
        `Community of interest: ${community || "Not provided"}`,
        `Preferred move-in: ${moveIn || "Not provided"}`,
        "",
        message || "No additional notes provided.",
      ].join("\n"),
    );

    window.location.href = `mailto:gm1@vuecommunities.com?subject=${subject}&body=${body}`;
  });
}
