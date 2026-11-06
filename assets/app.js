/* Евгений & Анастасия – общая логика для всех макетов. Без зависимостей. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Штампы городов: <span class="stamp" data-city="Roma" data-country="Italia"> ---------- */
  var stampId = 0;
  document.querySelectorAll(".stamp[data-city]").forEach(function (el) {
    var id = "stamp-path-" + stampId++;
    var ring = (el.dataset.country + " · " + el.dataset.city + " · " + (el.dataset.note || "Love story") + " · ").toUpperCase();
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<svg viewBox="0 0 120 120">' +
      '<circle cx="60" cy="60" r="57" fill="rgb(30 26 23 / .16)" stroke="currentColor" stroke-width="1.1"/>' +
      '<circle cx="60" cy="60" r="38" fill="none" stroke="currentColor" stroke-width=".7" stroke-dasharray="1.5 2.5"/>' +
      '<g class="ring"><path id="' + id + '" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" fill="none"/>' +
      '<text class="ring-text"><textPath href="#' + id + '" textLength="292" lengthAdjust="spacing">' + ring + "</textPath></text></g>" +
      '<text class="city" x="60" y="64" text-anchor="middle">' + el.dataset.city + "</text>" +
      '<text class="year" x="60" y="78" text-anchor="middle">✦</text>' +
      "</svg>";
  });

  /* ---------- Фото: рамка в родных пропорциях + размытый фон для ПК ---------- */
  document.querySelectorAll(".photo").forEach(function (photo) {
    var host = photo.querySelector(".clip") || photo;
    var media = host.querySelector(":scope > img, :scope > video");
    if (!media) return;
    var frame = document.createElement("div");
    frame.className = "photo-frame";
    var bg = document.createElement("div");
    bg.className = "photo-bg";
    bg.setAttribute("aria-hidden", "true");
    host.insertBefore(bg, media);
    host.insertBefore(frame, media);
    frame.appendChild(media);
    host.querySelectorAll(":scope > .stamp:not(.seal)").forEach(function (st) { frame.appendChild(st); });
    var setBg = function () { var src = media.currentSrc || media.poster || media.src; if (src) bg.style.backgroundImage = "url('" + src + "')"; };
    if (media.tagName === "IMG") { media.complete ? setBg() : media.addEventListener("load", setBg); } else { setBg(); }
  });

  /* ---------- Плавное появление ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Легкий параллакс фото ---------- */
  var layers = Array.prototype.slice.call(document.querySelectorAll(".photo img"));
  if (!reduce && layers.length) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      layers.forEach(function (img) {
        var box = img.closest(".photo-frame").getBoundingClientRect();
        if (box.bottom < -100 || box.top > vh + 100) return;
        var progress = (box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2); // -1..1
        img.style.transform = "translate3d(0," + (progress * -2.5).toFixed(2) + "%,0)";
      });
      ticking = false;
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- Видео: играет только когда на экране ---------- */
  document.querySelectorAll("video[data-autoplay]").forEach(function (v) {
    v.muted = true;
    if (!("IntersectionObserver" in window)) { v.play().catch(function () {}); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { v.play().catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.25 }).observe(v);
  });

  /* ---------- Музыка: только по кнопке ---------- */
  var startMusic = function () {};
  var musicBtn = document.querySelector(".music");
  if (musicBtn) {
    var audio = new Audio();
    audio.src = musicBtn.dataset.src;
    audio.loop = true;
    audio.volume = 0.25; // фоновая громкость: слышно, но не перебивает
    audio.preload = "auto";
    var userPaused = false;
    var sync = function () { musicBtn.setAttribute("aria-pressed", audio.paused ? "false" : "true"); };
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    // Автозапуск при загрузке. Браузеры блокируют звук до первого касания,
    // поэтому при отказе запускаем музыку с первого жеста пользователя.
    var gestures = ["pointerdown", "touchstart", "keydown", "wheel", "scroll"];
    var offGestures = function () { gestures.forEach(function (g) { window.removeEventListener(g, onGesture, true); }); };
    var onGesture = function () { if (userPaused) return offGestures(); audio.play().then(offGestures).catch(function () {}); };
    audio.play().catch(function () { gestures.forEach(function (g) { window.addEventListener(g, onGesture, { capture: true, passive: true }); }); });
    startMusic = function () { if (!userPaused) audio.play().catch(function () {}); };
    musicBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (audio.paused) { userPaused = false; audio.play().catch(function () {}); }
      else { userPaused = true; audio.pause(); offGestures(); }
    });
  }

  /* ---------- Рассадка ---------- */
  var TABLES = {
    1: ["Евстратьев Владимир", "Евстратьева Елена", "Смирнов Сергей", "Евстратьев Александр", "Евстратьева Марина", "Евстратьева Тамара", "Евстратьев Игорь"],
    2: ["Никитина Елена", "Локоть Михаил", "Збоженская Людмила", "Есин Сергей", "Есина Наталья", "Никитин Олег", "Никитина Лариса", "Никитин Павел", "Никитина Мария"],
    3: ["Воронова Виктория", "Воронов Дмитрий", "Воронова Ксения", "Воронов Кирилл", "Руденко Ярослав", "Руденко Галина", "Шаромыгин Сергей"],
    4: ["Валентенкова Екатерина", "Фогель Дмитрий", "Сорокина Дария", "Тихонов Владимир", "Евстратьев Глеб", "Леонтьева Екатерина", "Миланович Александр", "Миланович Снежанна"]
  };
  var box = document.getElementById("tables");
  var input = document.getElementById("guest-search");
  var result = document.getElementById("guest-result");
  if (box && input) {
    var norm = function (t) { return t.toLowerCase().replace(/\u0451/g, "е").replace(/\s+/g, " ").trim(); };
    Object.keys(TABLES).forEach(function (n) {
      var card = document.createElement("article");
      card.className = "table-card";
      card.dataset.table = n;
      card.innerHTML = '<h3>Стол ' + n + "</h3><ul>" + TABLES[n].map(function (g) { return "<li>" + g + "</li>"; }).join("") + "</ul>";
      box.appendChild(card);
    });
    var cards = box.querySelectorAll(".table-card");
    input.addEventListener("input", function () {
      var q = norm(input.value);
      var active = q.length >= 2;
      var hits = [];
      box.classList.toggle("is-filtering", active);
      cards.forEach(function (card) {
        var any = false;
        card.querySelectorAll("li").forEach(function (li) {
          var name = norm(li.textContent);
          var ok = active && name.split(" ").some(function (part) { return part.indexOf(q) === 0; }) || (active && name.indexOf(q) === 0);
          li.classList.toggle("hit", ok);
          if (ok) { any = true; hits.push({ name: li.textContent, table: card.dataset.table }); }
        });
        card.classList.toggle("is-match", any);
      });
      box.classList.toggle("has-match", hits.length > 0);
      if (!active) { result.textContent = ""; return; }
      if (!hits.length) { result.textContent = "Не нашли? Проверьте написание фамилии или спросите у молодоженов"; return; }
      if (hits.length === 1) { result.textContent = hits[0].name + " – стол " + hits[0].table; }
      else {
        var t = Array.from(new Set(hits.map(function (h) { return h.table; })));
        result.textContent = t.length === 1 ? "Ваш стол – " + t[0] : "Столы " + t.join(" и ") + " – уточните имя";
      }
    });
  }
})();
