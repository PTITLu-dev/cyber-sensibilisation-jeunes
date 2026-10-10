/* Démo « Sarah » · © 2026 PTIT'Lu · 100% FICTIF · NE CAPTURE AUCUNE DONNÉE */
/* =========================================================================
   regie.js — moteur de régie partagé par toutes les scènes.
   - Substitution des gabarits {{clé}} depuis SARAH (config.js)
   - Navigation clavier identique partout :
        Espace / →  : avancer d'un temps
        ←           : reculer d'un temps
        R           : reset de la scène
        F           : rappel plein écran (F11)
        W           : masquer / afficher le filigrane "DÉMO"
        P           : afficher / masquer l'indicateur de "temps" (pour nommer les captures)
   - Chrome commun : filigrane, hint plein écran, indicateur de temps,
     fallback images (aucune page ne doit jamais casser).

   AUCUNE requête réseau. AUCUNE lecture de champ sensible. Tout est scénarisé.
   ========================================================================= */

(function () {
  "use strict";

  /* ---------- 1. Substitution des gabarits {{clé}} dans le texte ---------- */
  function applyTemplates(root) {
    const data = window.SARAH || {};
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      if (re.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(re, function (m, k) {
          return (k in data) ? data[k] : m;
        });
      }
    });
    // Attributs porteurs de gabarit : data-tpl-alt → alt, data-tpl-title → title
    root = root || document;
    root.querySelectorAll("[alt*='{{'], [title*='{{'], [data-label*='{{']").forEach(function (el) {
      ["alt", "title", "data-label"].forEach(function (attr) {
        const v = el.getAttribute(attr);
        if (v && v.indexOf("{{") >= 0) {
          el.setAttribute(attr, v.replace(re, function (m, k) { return (k in data) ? data[k] : m; }));
        }
      });
    });
  }

  /* ---------- 2. Chrome commun (filigrane, hint, indicateur) ---------- */
  function buildChrome() {
    if (!document.getElementById("demo-watermark")) {
      const wm = document.createElement("div");
      wm.id = "demo-watermark";
      wm.textContent = "DÉMO";
      document.body.appendChild(wm);
    }
    if (!document.getElementById("fs-hint")) {
      const h = document.createElement("div");
      h.id = "fs-hint";
      h.innerHTML = 'Projection : passez en plein écran avec <kbd>F11</kbd> &nbsp;·&nbsp; régie : <kbd>Espace</kbd> avancer · <kbd>←</kbd> reculer · <kbd>R</kbd> reset';
      document.body.appendChild(h);
    }
    if (!document.getElementById("step-indicator")) {
      const s = document.createElement("div");
      s.id = "step-indicator";
      document.body.appendChild(s);
    }
  }

  /* ---------- 3. Contrôleur Regie ---------- */
  const Regie = {
    current: 0,
    total: 0,
    _cfg: null,
    _hintTimer: null,

    /* --- Enchaînement automatique des scènes (version "complète") --- */
    CHAIN: true,
    SCENES: [
      "0-accroche.html", "1a-profil.html", "1b-recherche.html", "1c-fiche.html",
      "2-motdepasse.html", "3-connexion.html", "4-planb.html", "5-compte.html",
      "6-reverse.html", "6b-archive.html", "7-recrutement.html", "8-cloture.html"
    ],
    _file: function () { return (location.pathname.split("/").pop() || "").toLowerCase(); },
    _sceneIndex: function () { return this.SCENES.indexOf(this._file()); },
    _gotoScene: function (i, atEnd) {
      if (i < 0 || i >= this.SCENES.length) return;
      location.href = this.SCENES[i] + (atEnd ? "#end" : "");
    },

    /* cfg = { total:Number, onStep:function(current, previous){...}, name:String } */
    init: function (cfg) {
      this._cfg = cfg || {};
      this.total = cfg.total || 0;
      this.current = 0;

      const start = function () {
        applyTemplates(document.body);
        buildChrome();
        Regie._bindKeys();
        Regie._fitStage();
        window.addEventListener("resize", Regie._fitStage);
        window.addEventListener("orientationchange", Regie._fitStage);
        window.addEventListener("load", Regie._fitStage);
        if (window.ResizeObserver) {
          try { new ResizeObserver(Regie._fitStage).observe(document.documentElement); } catch (e) {}
        }
        setTimeout(Regie._fitStage, 60);
        setTimeout(Regie._fitStage, 300);
        var startAt = (location.hash === "#end") ? Regie.total : 0;
        Regie.goTo(startAt, -1);
        Regie.showHint((Regie.CHAIN && Regie._sceneIndex() > 0) ? 1600 : 4200);  // rappel plein écran
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
      } else {
        start();
      }
    },

    goTo: function (n, prevOverride) {
      const prev = (typeof prevOverride === "number") ? prevOverride : this.current;
      n = Math.max(0, Math.min(this.total, n));
      this.current = n;
      if (typeof this._cfg.onStep === "function") {
        this._cfg.onStep(n, prev);
      }
      this._updateIndicator();
    },

    forward: function () {
      if (this.current < this.total) { this.goTo(this.current + 1); return; }
      if (this.CHAIN) { var i = this._sceneIndex(); if (i >= 0 && i < this.SCENES.length - 1) this._gotoScene(i + 1, false); }
    },
    back: function () {
      if (this.current > 0) { this.goTo(this.current - 1); return; }
      if (this.CHAIN) { var i = this._sceneIndex(); if (i > 0) this._gotoScene(i - 1, true); }
    },
    reset:   function () { this.goTo(0, this.current); },

    showHint: function (ms) {
      const h = document.getElementById("fs-hint");
      if (!h) return;
      h.classList.add("on");
      clearTimeout(this._hintTimer);
      if (ms) this._hintTimer = setTimeout(function () { h.classList.remove("on"); }, ms);
    },

    toggleWatermark: function () {
      const wm = document.getElementById("demo-watermark");
      if (wm) wm.classList.toggle("hidden");
    },

    toggleIndicator: function () {
      const s = document.getElementById("step-indicator");
      if (s) s.classList.toggle("on");
    },

    _updateIndicator: function () {
      const s = document.getElementById("step-indicator");
      var sc = this._sceneIndex();
      var scTxt = (this.CHAIN && sc >= 0) ? ("scène " + (sc + 1) + "/" + this.SCENES.length + "  ·  ") : "";
      if (s) s.textContent = scTxt + "temps " + this.current + " / " + this.total
        + (this._cfg.name ? "  ·  " + this._cfg.name : "");
    },

    _bindKeys: function () {
      if (this._bound) return;
      this._bound = true;
      document.addEventListener("keydown", function (e) {
        // On ignore si l'opérateur tape dans un champ (le champ reste décoratif,
        // mais on évite d'avancer la scène pendant une frappe de démonstration).
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
        const typing = (tag === "input" || tag === "textarea");

        switch (e.key) {
          case " ":
          case "Spacebar":
          case "ArrowRight":
            if (typing) return;
            e.preventDefault();
            Regie.forward();
            break;
          case "ArrowLeft":
            if (typing) return;
            e.preventDefault();
            Regie.back();
            break;
          case "r": case "R":
            if (typing) return;
            Regie.reset();
            break;
          case "f": case "F":
            if (typing) return;
            Regie.showHint(4200);
            break;
          case "w": case "W":
            if (typing) return;
            Regie.toggleWatermark();
            break;
          case "p": case "P":
            if (typing) return;
            Regie.toggleIndicator();
            break;
          default:
            // Hook optionnel par scène pour touches custom (ex. +/- vitesse)
            if (typeof Regie._cfg.onKey === "function") Regie._cfg.onKey(e);
        }
      });
    },

    /* ---------- Mise à l'échelle du canvas 1920×1080 pour tenir dans la fenêtre ---------- */
    _fitStage: function () {
      var stage = document.querySelector(".stage");
      if (!stage) return;
      var w = window.innerWidth || document.documentElement.clientWidth;
      var h = window.innerHeight || document.documentElement.clientHeight;
      var s = (w && h) ? Math.min(w / 1920, h / 1080) : 1;
      if (!isFinite(s) || s <= 0) s = 1;   // sécurité : jamais scale(0)
      stage.style.transform = "translate(-50%, -50%) scale(" + s + ")";
    },

    /* ---------- 4. Fallback image : jamais de page cassée ---------- */
    imgFail: function (img) {
      img.classList.add("failed");   // CSS masque l'img, le placeholder .ph::after reste visible
    }
  };

  /* Expose */
  window.Regie = Regie;
  window.RegieApplyTemplates = applyTemplates;
})();
