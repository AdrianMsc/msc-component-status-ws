const categoriesContainer = document.getElementById("categories");
const articles = categoriesContainer?.querySelectorAll("article") || [];

let hidden = true;

function getLimit() {
  const width = window.innerWidth;
  if (width < 768) return 6;
  if (width < 1024) return 8;
  return articles.length;
}

// Horizontal Scroll with buttons
function initScrollButtons() {
  const scrollContainers = document.querySelectorAll("div.overflow-x-scroll");

  scrollContainers.forEach((scrollContainer) => {
    const parent =
      scrollContainer.closest("section.group") ||
      scrollContainer.closest("div");

    const btnLeft = parent.querySelector("button.scroll-left");
    const btnRight = parent.querySelector("button.scroll-right");

    const updateButtonStates = () => {
      const maxScrollLeft =
        scrollContainer.scrollWidth - scrollContainer.clientWidth;

      const shouldHide = parent.classList.contains("group");

      if (btnLeft) {
        if (shouldHide && scrollContainer.scrollLeft <= 0) {
          btnLeft.classList.add("opacity-0", "pointer-events-none");
        } else {
          btnLeft.classList.remove("opacity-0", "pointer-events-none");
        }
      }

      if (btnRight) {
        if (shouldHide && scrollContainer.scrollLeft >= maxScrollLeft - 1) {
          btnRight.classList.add("opacity-0", "pointer-events-none");
        } else {
          btnRight.classList.remove("opacity-0", "pointer-events-none");
        }
      }
    };

    const scrollByAmount = (amount) => {
      scrollContainer.scrollBy({ left: amount, behavior: "smooth" });
    };

    btnLeft?.addEventListener("click", () => scrollByAmount(-300));
    btnRight?.addEventListener("click", () => scrollByAmount(300));
    scrollContainer?.addEventListener("scroll", updateButtonStates);

    // Force update buttons
    updateButtonStates();

    // Force scrollbar render on mousenter
    scrollContainer?.addEventListener("mouseenter", () => {
      if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) return;
      const original = scrollContainer.scrollLeft;
      scrollContainer.scrollLeft += 1;
      scrollContainer.scrollLeft = original;
    });
  });
}

// Parallax effects
function initParallaxEffect() {
  const icon = document.querySelector(".rotate-icon");
  const image = document.querySelector(".testimonial-image");
  const section = document.getElementById("parallax-section");

  if (!icon || !image || !section) return;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }

  function updateEffects() {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const extendedMargin = 400;

    const sectionTop = rect.top - extendedMargin;
    const sectionBottom = rect.bottom + extendedMargin;

    let rotation = -90;
    let translateY = -60;

    if (sectionTop <= viewportHeight && sectionBottom >= 0) {
      const progress = clamp(
        1 - (sectionTop + rect.height) / (viewportHeight + rect.height),
        0,
        1
      );

      if (sectionTop > 0 && sectionTop < viewportHeight) {
        rotation = mapRange(progress, 0, 0.5, -90, 0);
        translateY = mapRange(progress, 0, 0.5, -60, 0);
      } else if (sectionTop <= 0 && sectionBottom >= viewportHeight) {
        rotation = 0;
        translateY = 0;
      } else if (sectionBottom < viewportHeight && sectionBottom > 0) {
        const exitProgress = 1 - sectionBottom / viewportHeight;
        rotation = mapRange(exitProgress, 0, 1, 0, 90);
        translateY = mapRange(exitProgress, 0, 1, 0, 60);
      }
    }

    icon.style.transform = `rotate(${rotation}deg)`;
    image.style.transform = `translateY(${translateY}px)`;
  }

  window.addEventListener("scroll", updateEffects, { passive: true });
  window.addEventListener("resize", updateEffects);
  updateEffects();
}

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  initScrollButtons();
  initParallaxEffect();
});
