/* ============================================================
   FENG FAN CHEN — motion layer
   loader → smooth scroll → split reveals → horizontal work →
   counters → cursor → magnetic buttons
   ============================================================ */

(function () {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const docEl = document.documentElement;

  /* ---------- safety: if anything explodes, show the page ---------- */
  function showAll() {
    docEl.classList.remove("js");
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  try {
    if (!window.gsap || !window.ScrollTrigger) throw new Error("gsap missing");
    gsap.registerPlugin(ScrollTrigger);

    /* ---------- smooth scroll ---------- */
    let lenis = null;
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    /* anchor links through lenis */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -20 });
        else target.scrollIntoView({ behavior: "smooth" });
      });
    });

    /* ---------- word splitting for .split headings ---------- */
    document.querySelectorAll(".split").forEach((el) => {
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((piece) => {
              if (!piece) return;
              if (/^\s+$/.test(piece)) {
                frag.appendChild(document.createTextNode(" "));
              } else {
                const outer = document.createElement("span");
                outer.className = "w";
                const inner = document.createElement("span");
                inner.className = "wi";
                inner.textContent = piece;
                outer.appendChild(inner);
                frag.appendChild(outer);
              }
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("w")) {
            walk(child);
          }
        });
      };
      walk(el);
    });

    /* ---------- loader ---------- */
    const loader = document.querySelector(".loader");
    const count = document.querySelector(".loader__count");

    function heroIn() {
      const tl = gsap.timeline();
      tl.fromTo(
        ".hero__word, .hero__ast",
        { yPercent: 115 },
        { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12 }
      )
        .to(".hero__kicker", { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.7")
        .to(".hero__statement, .hero__actions, .hero__scroll", { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.1 }, "-=0.5");
      gsap.set(".hero__kicker, .hero__statement, .hero__actions, .hero__scroll", { y: 30 });
    }

    if (loader && !reduced) {
      /* park hero words below their masks so they never flash during the wipe */
      gsap.set(".hero__word, .hero__ast", { yPercent: 115 });
      const state = { v: 0 };
      const tl = gsap.timeline();
      tl.to(state, {
        v: 100,
        duration: 1.15,
        ease: "power2.inOut",
        onUpdate: () => (count.textContent = String(Math.round(state.v)).padStart(2, "0")),
      })
        .to(loader, { yPercent: -100, duration: 0.7, ease: "power4.inOut" })
        .add(() => loader.classList.add("is-done"))
        .add(heroIn, "-=0.35");
    } else if (loader) {
      loader.style.display = "none";
      gsap.set(".hero__word, .hero__ast, .hero__kicker, .hero__statement, .hero__actions, .hero__scroll", {
        clearProps: "all",
      });
      docEl.classList.remove("js");
    }

    /* ---------- generic reveals (hero is handled by the loader intro) ---------- */
    if (!reduced) {
      gsap.utils.toArray(".reveal").forEach((el) => {
        if (el.closest(".hero")) return;
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      /* split headings — words rise as section enters */
      gsap.utils.toArray(".split").forEach((el) => {
        gsap.from(el.querySelectorAll(".wi"), {
          yPercent: 110,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
        });
      });
    } else {
      docEl.classList.remove("js");
    }

    /* ---------- horizontal work section ---------- */
    const pin = document.querySelector(".work__pin");
    const track = document.querySelector(".work__track");
    const bar = document.querySelector(".work__bar span");

    if (pin && track && window.matchMedia("(min-width: 761px)").matches && !reduced) {
      const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 40);

      gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top 12%",
          end: () => "+=" + getDistance(),
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar) bar.style.transform = "scaleX(" + self.progress + ")";
          },
        },
      });
    }

    /* ---------- counters ---------- */
    gsap.utils.toArray(".stat__num").forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => (el.textContent = Math.round(obj.v)),
      });
    });

    /* ---------- scroll progress bar ---------- */
    const progress = document.querySelector(".progress span");
    if (progress) {
      gsap.to(progress, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
      });
    }

    /* ---------- parallax blobs ---------- */
    if (!reduced) {
      gsap.to(".blob--acid", { yPercent: 30, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 2 } });
      gsap.to(".blob--violet", { yPercent: -25, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 2 } });
    }

    /* ---------- custom cursor ---------- */
    const cursor = document.querySelector(".cursor");
    if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const dot = cursor.querySelector(".cursor__dot");
      const ring = cursor.querySelector(".cursor__ring");
      const label = cursor.querySelector(".cursor__label");
      const pos = { x: innerWidth / 2, y: innerHeight / 2 };
      const ringPos = { x: pos.x, y: pos.y };

      window.addEventListener("mousemove", (e) => {
        pos.x = e.clientX;
        pos.y = e.clientY;
        dot.style.transform = "translate(" + (pos.x - 3.5) + "px," + (pos.y - 3.5) + "px)";
      });

      gsap.ticker.add(() => {
        ringPos.x += (pos.x - ringPos.x) * 0.16;
        ringPos.y += (pos.y - ringPos.y) * 0.16;
        const half = ring.offsetWidth / 2;
        ring.style.transform = "translate(" + (ringPos.x - half) + "px," + (ringPos.y - half) + "px)";
      });

      document.querySelectorAll("[data-cursor]").forEach((el) => {
        el.addEventListener("mouseenter", () => {
          const value = el.getAttribute("data-cursor");
          if (value) {
            label.textContent = value;
            cursor.classList.add("cursor--label");
          } else {
            cursor.classList.add("cursor--hover");
          }
        });
        el.addEventListener("mouseleave", () => {
          cursor.classList.remove("cursor--hover", "cursor--label");
        });
      });
    }

    /* ---------- magnetic buttons ---------- */
    if (!reduced && window.matchMedia("(hover: hover)").matches) {
      document.querySelectorAll(".magnetic").forEach((el) => {
        const strength = 0.35;
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power3.out" });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
        });
      });
    }

    /* ---------- copy email ---------- */
    const copyBtn = document.getElementById("copyEmail");
    const toast = document.getElementById("toast");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText("chensail@outlook.com").then(() => {
          toast.classList.add("is-show");
          setTimeout(() => toast.classList.remove("is-show"), 2200);
        });
      });
    }

    /* ---------- refresh after fonts (layout shift guard) ---------- */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener("load", () => ScrollTrigger.refresh());
  } catch (err) {
    console.error("motion init failed:", err);
    showAll();
    const loader = document.querySelector(".loader");
    if (loader) loader.style.display = "none";
  }
})();
