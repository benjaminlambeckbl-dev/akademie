/* ISH Akademie – Landingpage JS */

// Nav: scrolled class + mobile burger
const nav = document.getElementById('nav');
const burger = document.querySelector('.nav__burger');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

burger?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});

// Close mobile nav on link click
document.querySelectorAll('.nav__links a, .nav__cta').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  });
});

// Smooth scroll offset for fixed nav
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = nav.offsetHeight + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// Form submission (prevent default + feedback)
document.querySelector('.register__form')?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Nachricht gesendet ✓';
  btn.disabled = true;
  btn.style.background = '#00364a';
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
    btn.style.background = '';
    e.target.reset();
  }, 4000);
});

// Accordion
document.querySelectorAll('.accordion-item__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    // Close all
    document.querySelectorAll('.accordion-item__btn').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling?.classList.remove('open');
    });
    // Toggle clicked
    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling?.classList.add('open');
    }
  });
});

// Animate elements on scroll (Intersection Observer)
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(
  '.overview__card, .module-card, .trainer-card, .offer-item, .brand-card'
).forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity .4s ease ${i * 0.07}s, transform .4s ease ${i * 0.07}s`;
  observer.observe(el);
});

document.addEventListener('animationend', () => {}, { once: true });

// Trigger visible class
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.visible, .overview__card.visible, .module-card.visible').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
});

// Add .visible via CSS transition when observed
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .overview__card.visible,
  .module-card.visible,
  .trainer-card.visible,
  .offer-item.visible,
  .brand-card.visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(styleSheet);
