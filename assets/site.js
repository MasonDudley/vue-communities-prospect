document.documentElement.classList.add("js");

const toggle = document.querySelector("[data-nav-toggle]");
const header = document.querySelector(".site-header");
const navLinks = document.querySelector(".nav-links");
const nav = navLinks?.closest("nav");
const mobileMenu = window.matchMedia("(max-width: 900px)");
const subnavs = Array.from(document.querySelectorAll(".nav-subnav"));

const closeSubnavs = (except) => {
  subnavs.forEach((subnav) => {
    if (subnav !== except) {
      subnav.open = false;
    }
  });
};

const syncMenuState = () => {
  if (!toggle || !navLinks) return;

  const isMobile = mobileMenu.matches;
  const isOpen = document.body.classList.contains("menu-open");

  navLinks.hidden = isMobile ? !isOpen : false;
  navLinks.setAttribute("aria-hidden", isMobile ? String(!isOpen) : "false");
  toggle.setAttribute("aria-expanded", isMobile && isOpen ? "true" : "false");
};

if (toggle) {
  if (navLinks) {
    navLinks.id = navLinks.id || "site-menu";
    toggle.setAttribute("aria-controls", navLinks.id);
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    syncMenuState();
  });
}

document.querySelectorAll(".nav-links a, .nav-links__mobile-cta a").forEach((link) => {
  link.addEventListener("click", () => {
    closeSubnavs();
    document.body.classList.remove("menu-open");
    syncMenuState();
  });
});

document.querySelectorAll(".nav-subnav__summary").forEach((summary) => {
  summary.addEventListener("click", (event) => {
    const subnav = summary.parentElement;
    if (!(subnav instanceof HTMLDetailsElement)) return;

    if (!mobileMenu.matches) {
      event.preventDefault();
      const shouldOpen = !subnav.open;
      closeSubnavs(shouldOpen ? subnav : null);
      subnav.open = shouldOpen;
    }
  });
});

if (navLinks) {
  syncMenuState();

  const handleViewportChange = () => {
    closeSubnavs();
    document.body.classList.remove("menu-open");
    syncMenuState();
  };

  if (typeof mobileMenu.addEventListener === "function") {
    mobileMenu.addEventListener("change", handleViewportChange);
  } else if (typeof mobileMenu.addListener === "function") {
    mobileMenu.addListener(handleViewportChange);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const hasOpenSubnav = subnavs.some((subnav) => subnav.open);
      closeSubnavs();

      if (document.body.classList.contains("menu-open")) {
        document.body.classList.remove("menu-open");
        syncMenuState();
        toggle?.focus();
      } else if (hasOpenSubnav) {
        document.querySelector(".nav-subnav__summary")?.focus();
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) return;

    if (
      mobileMenu.matches &&
      document.body.classList.contains("menu-open") &&
      nav &&
      toggle &&
      !nav.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      document.body.classList.remove("menu-open");
      syncMenuState();
    }

    if (nav && !nav.contains(event.target)) {
      closeSubnavs();
    }
  });
}

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

const galleries = document.querySelectorAll("[data-gallery]");

if (galleries.length) {
  const lightbox = document.createElement("div");
  lightbox.className = "gallery-lightbox";
  lightbox.innerHTML = `
    <button class="gallery-lightbox__close" aria-label="Close gallery">&times;</button>
    <button class="gallery-lightbox__prev" aria-label="Previous image">&#8249;</button>
    <img class="gallery-lightbox__img" src="" alt="" />
    <button class="gallery-lightbox__next" aria-label="Next image">&#8250;</button>
    <div class="gallery-lightbox__counter"></div>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector(".gallery-lightbox__img");
  const lbCounter = lightbox.querySelector(".gallery-lightbox__counter");
  const lbClose = lightbox.querySelector(".gallery-lightbox__close");
  const lbPrev = lightbox.querySelector(".gallery-lightbox__prev");
  const lbNext = lightbox.querySelector(".gallery-lightbox__next");

  let currentImages = [];
  let currentIndex = 0;

  const openLightbox = (images, index) => {
    currentImages = images;
    currentIndex = index;
    showImage();
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  const showImage = () => {
    const img = currentImages[currentIndex];
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
  };

  const navigate = (dir) => {
    currentIndex = (currentIndex + dir + currentImages.length) % currentImages.length;
    showImage();
  };

  galleries.forEach((gallery) => {
    const items = Array.from(gallery.querySelectorAll(".photo-gallery__item"));
    const images = items.map((item) => item.querySelector("img"));

    items.forEach((item, i) => {
      item.addEventListener("click", () => openLightbox(images, i));
    });
  });

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => navigate(-1));
  lbNext.addEventListener("click", () => navigate(1));

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") navigate(-1);
    if (e.key === "ArrowRight") navigate(1);
  });

  let touchStartX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? -1 : 1);
  }, { passive: true });
}
