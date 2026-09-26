#!/usr/bin/env node
"use strict"
/* Crop a region out of a rendered PNG and scale it up.
 *
 * The companion to `_face_extent.cjs`. That one answers "how many pixels of
 * margin does the overlay have"; this one shows you WHAT the overlay's edge is
 * cutting through. A clearance that reads as comfortable at 1:10 and one that
 * reads as a near-miss look identical in a full-page screenshot — measured
 * 2026-09-26, the "15+ Years" badge's clearance from a technician's hair was
 * single-digit pixels and only visible at 4x.
 *
 * Usage: _crop.cjs <src.png> <dst.png> <left> <top> <width> <height> [scale]
 *   e.g. _crop.cjs .preview/about-1440.png .preview/edge.png 920 520 260 420 4
 *
 * Coordinates are DEVICE pixels of the source PNG, so if it was captured with
 * `--scale 2`, multiply the CSS coordinates you measured by 2 first.
 */
const path = require("path")
const WORKSPACE =
  process.env.WORKBUDDY_NODE_WORKSPACE ||
  "C:/Users/jaden.black/.workbuddy-ai/binaries/node/workspace/node_modules"
const sharp = require(path.join(WORKSPACE, "sharp"))

const [, , src, dst, l, t, w, h, scale] = process.argv
if (!src || !dst) {
  console.error("usage: _crop.cjs <src.png> <dst.png> <left> <top> <width> <height> [scale]")
  process.exit(2)
}
sharp(src)
  .extract({ left: +l, top: +t, width: +w, height: +h })
  .resize({ width: Math.round(+w * (+scale || 1)) })
  .toFile(dst)
  .then((info) => console.log(`${dst}  ${info.width}x${info.height}`))
  .catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
