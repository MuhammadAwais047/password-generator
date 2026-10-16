# 🔐 PassForge — Secure Password Generator

A cryptographically secure password generator that runs **100% in your browser**. Built with pure HTML, CSS and vanilla JavaScript — no frameworks, no build step, no dependencies, no network requests.

**Live demo:** https://muhammadawais047.github.io/password-generator/

## Features

- **Real cryptographic randomness** — uses the Web Crypto API (`crypto.getRandomValues`) with rejection sampling to eliminate modulo bias
- **Guaranteed complexity** — every selected character set contributes at least one character; the result is then Fisher–Yates shuffled
- **Length slider (4–64)** with live regeneration
- **Character set toggles** — uppercase, lowercase, numbers, symbols
- **Exclude ambiguous characters** option (`0 O 1 l I |`) for passwords you need to read aloud or type manually
- **Entropy-based strength meter** — computes real entropy in bits, maps it to a visual tier (Weak → Fair → Strong → Fortress)
- **Crack-time estimate** — how long an offline attack at 100 billion guesses/sec would take
- **One-click copy** with animated feedback (Clipboard API + `execCommand` fallback)
- **Session history** of the last 8 passwords — kept in memory only, never written to storage, gone when the tab closes
- **Accessible** — keyboard shortcuts (Enter regenerates), focus-visible styles, `aria-live` output, screen-reader-friendly custom checkboxes
- **`prefers-reduced-motion` support** and fully responsive layout

## Privacy

- Zero network requests — generation happens entirely on your device
- Nothing is stored: no localStorage, no cookies, no analytics
- History lives in tab memory and disappears when you close it

## Tech

| Layer  | Choice                                           |
| ------ | ------------------------------------------------ |
| Markup | Semantic HTML5                                   |
| Style  | Modern CSS (custom properties, grid, animations) |
| Logic  | Vanilla ES2020 + Web Crypto API                  |

## Run locally

```bash
python -m http.server 8080
# then open http://localhost:8080
```

Or simply open `index.html` in a browser.

## Project structure

```
password-generator/
├── index.html   # UI layout
├── styles.css   # theme, slider, meter, responsive rules
└── app.js       # crypto-secure generation, entropy math, history
```

---

© 2026 [Muhammad Awais](https://github.com/MuhammadAwais047). Licensed under the [MIT License](LICENSE).
