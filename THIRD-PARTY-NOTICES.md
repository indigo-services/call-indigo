# Third-Party Notices

**What this repository contains that belongs to someone else, what licence covers it,
and what that licence obliges us to do.**

This file is the public attribution register. The measured inventory behind it — file
counts, byte-identity checks, and the decisions still open — is
[`docs/60-reference/third-party-assets.md`](./docs/60-reference/third-party-assets.md).

Last measured: **2026-09-27** at `2f009a2`.

> **Why this file exists.** The repository was private until 2026-09-27 and is now
> public. That change exposed third-party material that had previously been visible to
> nobody, and the repository had no register of it. This is that register.

---

## 1. The Valvoro template — **commercial, and the one that matters**

| | |
|---|---|
| **Item** | Valvoro — Plumbing Services HTML Template |
| **Source** | <https://themeforest.net/item/valvoro-plumbing-services-html-template/62644376> |
| **Licence** | Envato / ThemeForest commercial licence, held by the client |
| **Used for** | The visual design language of the marketing pages |

**Where it is present** [M: `git ls-files`]:

| Location | Files | What |
|---|---:|---|
| `archive/audit/v1-audit/vlv/` | 20 | The template's own demo page and its source: `index.html`, `style.css`, `responsive.css`, `carousel.js`, `counter.js`, `video-section.js`, plus bundled Bootstrap, jQuery, Owl Carousel, Popper, animate.css and WOW.js |
| `valvoro-prototype/` | 87 | The v2 static prototype built on the template, and the parity baseline |
| `public/assets/images/` | 59 | Images **byte-identical** to the template's library, served by the live site |
| **Total template-derived tracked files** | **119** | |

**What the licence permits, and what it does not.** A ThemeForest licence permits using
the template — including its images and code — in **one end product**. It does **not**
permit redistributing the template's source or assets. Publishing the template's files
in a public repository is redistribution, not use.

**What was genuinely rewritten, and what was not** [M: class-name diff and `cmp -s`]:

- The **markup is ours** — the template demo has 246 unique classes against the
  prototype's 488, with only **29 shared** (~12%).
- The **CSS is ours** — re-implemented in Tailwind, not the template's Bootstrap.
- The **images are the template's** — 59 files match byte-for-byte.

**Attribution is not required** by the Envato licence, and is not claimed here. What is
required is that the template not be redistributed, and that authorship not be
misrepresented. **The decision on the 20 tracked source files is open** — see
`docs/60-reference/third-party-assets.md` §4.

---

## 2. Bundled open-source libraries

Redistributed inside `archive/audit/v1-audit/vlv/assets/` as part of the template copy.
All are **MIT**, which requires that *"the above copyright notice and this permission
notice shall be included in all copies or substantial portions of the Software."*

| Library | Version | Licence | Notice in the file |
|---|---|---|---|
| Bootstrap (JS) | **4.6.2** | MIT | ✅ present |
| Bootstrap (CSS) | not stated | MIT | ⚠️ **stripped** |
| jQuery | **3.7.1** | MIT | ✅ present |
| Popper.js | not stated | MIT | ✅ present |
| Owl Carousel | **2.3.4** | MIT | ✅ present |
| Owl Carousel theme | **2.3.4** | MIT | ✅ present |
| jQuery Validation Plugin | **1.9.0** | MIT | ✅ present |
| animate.css | not stated | MIT | ✅ present |
| WOW.js | not stated | MIT | ⚠️ **stripped** |

**Two files are non-compliant** [M: no licence marker in the first 300 bytes of
`bootstrap.min.css` or `wow.js`]. Restoring their notices is a one-line prepend each —
see `docs/60-reference/third-party-assets.md` §3.

Versions are read from each file's own banner. Where the banner was stripped the version
is recorded as *not stated* rather than guessed.

---

## 3. Vendored components

| Component | Source | Licence |
|---|---|---|
| `src/components/ui/**` (21 files) | [shadcn/ui](https://ui.shadcn.com) registry | MIT |

shadcn/ui is distributed as a **registry**: the components are copied into the
repository rather than installed as a package, so they are redistributed here as
source. MIT, notice included via this register.

---

## 4. Build and runtime dependencies

Installed via npm and **not** redistributed in this repository — they are resolved at
install time from the registry, where each package carries its own licence. Listed for
completeness, with the licences read from each installed package [M: `node_modules/<pkg>/package.json`].

| Package | Licence |
|---|---|
| `react`, `react-dom`, `react-router-dom` | MIT |
| `radix-ui`, `class-variance-authority` | MIT · **Apache-2.0** |
| `lucide-react` | **ISC** |
| `sonner`, `next-themes`, `clsx`, `tailwind-merge`, `cn`, `tw-animate-css` | MIT |
| `vite`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-react` | MIT |
| `typescript`, `typescript-eslint` | **Apache-2.0** · MIT |
| `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | MIT |
| `@types/node`, `@types/react`, `@types/react-dom` | MIT |

**Apache-2.0** requires that any `NOTICE` file shipped by those packages be preserved.
Neither `class-variance-authority` nor `typescript` ships one [M: no `NOTICE` file in
either package]. Nothing further is owed. Apache-2.0 is not a copyleft licence, so
these dependencies do not affect the licensing of this work.

---

## 5. Fonts and assets

- **No font files are bundled** — no `.woff`, `.woff2`, `.ttf`, `.otf` or `.eot`
  anywhere in the repository [M: filesystem search across `archive/` and `public/`].
  Nothing to attribute.
- **Images**: 59 of the 95 in `public/assets/images/` are the template's (§1). The
  remainder were supplied by the client or produced for them.

---

## 6. Outstanding

| # | Action | Owner |
|---|---|---|
| 1 | Decide the fate of the 20 tracked template source files at `archive/audit/v1-audit/vlv/` — they are the material exposure | Client |
| 2 | Restore the MIT notices on `bootstrap.min.css` and `wow.js` | Engineering |
| 3 | Confirm the copyright holder in [`LICENSE`](./LICENSE) — `Call Indigo LLC` vs `Indigo Home & Facility Services` | Client |
| 4 | Keep the Envato **purchase code** out of the repository; record only the non-sensitive reference | Client |

---

## Appendix — MIT Licence

The libraries in §2 and the components in §3 are distributed under the following terms:

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Copyright in each library remains with its respective authors, named in the file
banners listed in §2.
