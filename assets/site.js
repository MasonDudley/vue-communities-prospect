const toggle = document.querySelector("[data-nav-toggle]");
const header = document.querySelector(".site-header");

if (toggle) {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    toggle.setAttribute(
      "aria-expanded",
      document.body.classList.contains("menu-open") ? "true" : "false",
    );
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
  });
});

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
      `Prospect inquiry${community ? ` - ${community}` : ""}${name ? ` - ${name}` : ""}`,
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
