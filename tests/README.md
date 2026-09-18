# Tests

Verification scripts adapted from `archive/audit/v1-audit/v2check/` (PRD §13).

## During rc1 implementation

The following scripts from the archive will be adapted into this directory:

| Script | Purpose | Source |
|---|---|---|
| `parity.py` | Pixel-diff React renders vs. static screenshots at 1920 / 1440 / 390 | New — wraps `shots.py` |
| `verify.ts` | Link, anchor, image, active-nav assertions | `v1-audit/v2check/verify.py` |
| `diag.ts` | Landmark box measurement (`.pad-rl`, `.mbox`, `.slab`, `.shell`) | `v1-audit/v2check/diag.py` |
| `mincontent.ts` | Min-content spill detection | `v1-audit/v2check/mincontent.py` |

## Parity thresholds (PRD §13.2)

- **Layout:** every landmark box within ±1px at every viewport.
- **Page height:** within ±0.5%.
- **Pixels:** no more than 0.5% of pixels differing by more than 8/255 per channel.
- **Hard zeros:** console errors, broken images, dead anchors, horizontal overflow.
