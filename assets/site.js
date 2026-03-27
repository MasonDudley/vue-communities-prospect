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

const SUPABASE_URL = "https://povizsshrvyqcaszwzmr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_4EFhT1Gx4qk_PHEm4cdRjw_kFKrEDZJ";
const CONTACT_ENDPOINT = "/api/contact";

const form = document.querySelector("[data-mailto-form]");

if (form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.textContent : "Send inquiry";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const community = String(formData.get("community") || "").trim();
    const moveIn = String(formData.get("move-in") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          community,
          moveIn,
          message,
          website,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Submission failed");
      }

      form.innerHTML = `
        <div style="text-align:center;padding:2rem 0;">
          <h3 style="color:var(--navy-900);margin-bottom:0.5rem;">Inquiry sent!</h3>
          <p style="color:var(--muted);">The leasing team will get back to you soon. You can also reach them at <a href="tel:4343297979">434-329-7979</a>.</p>
        </div>
      `;
    } catch {
      // Fallback to mailto if the server endpoint is unavailable.
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

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
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

// ── Availability badges + specials on community pages ────────────────────────

const pagePath = window.location.pathname;
let community = null;
if (pagePath.startsWith("/the-oasis")) community = "The Oasis";
else if (pagePath.startsWith("/cornerstone")) community = "Cornerstone";

const unitCards = document.querySelectorAll("[data-unit-type]");

if (unitCards.length > 0 && community) {
  const STATUS_LABELS = {
    available: "Available",
    limited: "Limited",
    waitlist: "Waitlist",
    unavailable: "Full",
  };

  fetch(
    `${SUPABASE_URL}/rest/v1/availability?community=eq.${encodeURIComponent(community)}&select=unit_type,status,notes`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      const map = Object.fromEntries(data.map((item) => [item.unit_type, item]));
      unitCards.forEach((card) => {
        const info = map[card.dataset.unitType];
        if (!info) return;
        const badge = document.createElement("span");
        badge.className = `avail-badge avail-badge--${info.status}`;
        badge.textContent = STATUS_LABELS[info.status] || info.status;
        if (info.notes) badge.title = info.notes;
        card.insertAdjacentElement("afterend", badge);
      });
    })
    .catch(() => {}); // availability display is non-critical — fail silently
}

if (community) {
  const noteStack = document.querySelector(".cta-band .note-stack");

  if (noteStack) {
    const now = Date.now();
    const query = new URLSearchParams({
      community: `eq.${community}`,
      is_active: "eq.true",
      select: "title,summary,cta_label,cta_url,image_url,image_alt,pdf_url,starts_at,ends_at,sort_order,created_at",
      order: "sort_order.asc,created_at.desc",
    });

    fetch(`${SUPABASE_URL}/rest/v1/specials?${query.toString()}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const special = (Array.isArray(data) ? data : []).find((item) => {
          const startsAt = item.starts_at ? new Date(item.starts_at).getTime() : null;
          const endsAt = item.ends_at ? new Date(item.ends_at).getTime() : null;
          return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
        });
        if (!special?.title || !special?.summary) return;

        const card = document.createElement("div");
        card.className = "note-card note-card--special";

        if (special.image_url) {
          const imgWrap = document.createElement("div");
          imgWrap.className = "note-card__promo";
          const img = document.createElement("img");
          img.src = special.image_url;
          img.alt = special.image_alt || "";
          img.loading = "lazy";
          imgWrap.appendChild(img);
          card.appendChild(imgWrap);
        }

        const title = document.createElement("strong");
        title.textContent = special.title;
        card.appendChild(title);

        const body = document.createElement("p");
        body.textContent = special.summary;
        card.appendChild(body);

        if (special.cta_label && special.cta_url) {
          const cta = document.createElement("p");
          const link = document.createElement("a");
          link.href = special.cta_url;
          link.textContent = special.cta_label;
          if (/^https?:\/\//i.test(special.cta_url)) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          }
          cta.appendChild(link);
          card.appendChild(cta);
        }

        if (special.pdf_url) {
          const pdfP = document.createElement("p");
          pdfP.className = "note-card__pdf";
          const pdfLink = document.createElement("a");
          pdfLink.href = special.pdf_url;
          pdfLink.target = "_blank";
          pdfLink.rel = "noopener noreferrer";
          pdfLink.textContent = "View flyer (PDF)";
          pdfP.appendChild(pdfLink);
          card.appendChild(pdfP);
        }

        noteStack.insertBefore(card, noteStack.firstChild);
      })
      .catch(() => {}); // specials display is non-critical — fail silently
  }
}
