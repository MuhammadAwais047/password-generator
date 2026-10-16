(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const SETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    num: "0123456789",
    sym: "!@#$%^&*()-_=+[]{};:,.<>?/~",
  };
  const AMBIGUOUS = new Set([...("0O1lI|")]);

  const pw = $("pw");
  const lengthInput = $("length");
  const lengthVal = $("length-val");
  const strengthBar = $("strength-bar");
  const strengthLabel = $("strength-label");
  const entropyEl = $("entropy");
  const crackEl = $("crack-time");
  const warn = $("warn");
  const copyBtn = $("copy-btn");
  const iconCopy = $("icon-copy");
  const iconCheck = $("icon-check");
  const regenBtn = $("regen");
  const historyList = $("history");
  const historyEmpty = $("history-empty");

  /* ---------- Crypto-secure random int in [0, max) without modulo bias ---------- */
  const randInt = (max) => {
    if (max <= 0) throw new Error("empty pool");
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    let x;
    do {
      crypto.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % max;
  };

  const pick = (str) => str[randInt(str.length)];

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  /* ---------- Options ---------- */
  const opt = (id) => $(id).checked;

  const activeSets = () => {
    const sets = [];
    if (opt("opt-upper")) sets.push(SETS.upper);
    if (opt("opt-lower")) sets.push(SETS.lower);
    if (opt("opt-num")) sets.push(SETS.num);
    if (opt("opt-sym")) sets.push(SETS.sym);
    if (!opt("opt-no-ambig")) return sets;
    return sets.map((s) => [...s].filter((c) => !AMBIGUOUS.has(c)).join("")).filter(Boolean);
  };

  const generate = () => {
    const sets = activeSets();
    const len = Number(lengthInput.value);

    if (sets.length === 0) {
      warn.hidden = false;
      warn.textContent = "Select at least one character set.";
      return null;
    }
    warn.hidden = true;

    const pool = sets.join("");
    const chars = [];

    // Guarantee at least one char from each selected set (when length allows)
    for (let i = 0; i < Math.min(sets.length, len); i++) chars.push(pick(sets[i]));
    for (let i = chars.length; i < len; i++) chars.push(pick(pool));

    return shuffle(chars).join("");
  };

  /* ---------- Strength ---------- */
  const fmtSeconds = (s) => {
    if (s < 1) return "instantly";
    const units = [
      [31536000 * 1e15, "quadrillion years"],
      [31536000 * 1e12, "trillion years"],
      [31536000 * 1e9, "billion years"],
      [31536000 * 1e6, "million years"],
      [31536000, "years"],
      [2592000, "months"],
      [86400, "days"],
      [3600, "hours"],
      [60, "minutes"],
      [1, "seconds"],
    ];
    for (const [size, name] of units) {
      if (s >= size) {
        const v = s / size;
        const str = v >= 1000 ? v.toExponential(1) : v.toLocaleString("en-US", { maximumFractionDigits: 1 });
        return `${str} ${name}`;
      }
    }
    return "instantly";
  };

  const renderStrength = (poolSize, len) => {
    const bits = poolSize > 1 ? len * Math.log2(poolSize) : 0;
    const guesses = Math.pow(2, bits) / 2; // average case
    const seconds = guesses / 1e11; // offline attack, 100 billion guesses/sec

    let tier, label;
    if (bits < 45) { tier = "s-weak"; label = "Weak"; }
    else if (bits < 70) { tier = "s-fair"; label = "Fair"; }
    else if (bits < 100) { tier = "s-strong"; label = "Strong"; }
    else { tier = "s-elite"; label = "Fortress"; }

    strengthBar.className = `strength-bar ${tier}`;
    strengthBar.style.width = `${Math.min((bits / 128) * 100, 100)}%`;
    strengthLabel.className = `strength-label ${tier}`;
    strengthLabel.textContent = label;
    entropyEl.textContent = `${bits.toFixed(0)} bits of entropy`;
    crackEl.textContent = `Offline attack at 100 billion guesses/sec would crack this in ${fmtSeconds(seconds)}.`;

    return bits;
  };

  /* ---------- History ---------- */
  let history = [];

  const pushHistory = (text) => {
    if (!text) return;
    history.unshift(text);
    history = history.slice(0, 8);
    historyEmpty.hidden = true;

    historyList.replaceChildren(
      ...history.map((h) => {
        const li = document.createElement("li");
        li.className = "history-item";
        const code = document.createElement("code");
        code.textContent = h;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "h-copy";
        btn.textContent = "Copy";
        btn.addEventListener("click", () => copyText(h));
        li.append(code, btn);
        return li;
      })
    );
  };

  /* ---------- Copy ---------- */
  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      flashCopied();
    } catch {
      // clipboard unavailable — silently ignore, password stays visible
    }
  };

  let flashTimer;
  const flashCopied = () => {
    copyBtn.classList.add("is-copied");
    iconCopy.classList.add("is-hidden");
    iconCheck.classList.remove("is-hidden");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      copyBtn.classList.remove("is-copied");
      iconCopy.classList.remove("is-hidden");
      iconCheck.classList.add("is-hidden");
    }, 1600);
  };

  /* ---------- Slider fill ---------- */
  const updateSliderFill = () => {
    const pct = ((lengthInput.value - lengthInput.min) / (lengthInput.max - lengthInput.min)) * 100;
    lengthInput.style.setProperty("--fill", `${pct}%`);
    lengthVal.textContent = lengthInput.value;
  };

  /* ---------- Wire up ---------- */
  const regenerate = () => {
    const text = generate();
    if (text === null) return;
    pw.textContent = text;
    const sets = activeSets();
    renderStrength(sets.join("").length, Number(lengthInput.value));
    pushHistory(text);
  };

  regenBtn.addEventListener("click", regenerate);

  copyBtn.addEventListener("click", () => copyText(pw.textContent));

  lengthInput.addEventListener("input", () => {
    updateSliderFill();
    regenerate();
  });

  ["opt-upper", "opt-lower", "opt-num", "opt-sym", "opt-no-ambig"].forEach((id) => {
    $(id).addEventListener("change", regenerate);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement !== copyBtn) {
      regenerate();
    }
  });

  $("year").textContent = new Date().getFullYear();

  updateSliderFill();
  regenerate();
})();
