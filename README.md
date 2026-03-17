# 🎵 WLE Audio Spectrum 3D

A **3D real-time audio spectrum visualiser** built with the [Wonderland Engine](https://wonderlandengine.com/) — supporting **live microphone** and **audio file** input.

## ✨ Features

- 🎤 **Live microphone** capture via `getUserMedia`
- 🎵 **Audio file** playback (MP3, WAV, OGG, FLAC)
- 📊 **3D bar spectrum** — N frequency bars extruded in 3D space, dynamically scaled each frame
- 🌈 **Colour-mapped bars** — hue shifts from bass (red) to treble (blue) with intensity brightness
- 🌐 **WebXR ready** — works in browser, desktop 3D and VR headsets
- 🔄 **Smooth interpolation** — bars lerp toward target heights for fluid animation
- 📦 **Zero extra dependencies** — only `@wonderlandengine/api` and `@wonderlandengine/editor-components`

## 📂 Project Structure

```
wle-audio-spectrum-3d/
├── README.md
├── package.json
├── tsconfig.json
├── rollup.config.mjs
├── js/
│   └── bundle.js          ← build output (run npm run build)
└── src/
    ├── index.ts
    └── components/
        ├── audio-spectrum-3d.ts
        └── audio-input-ui.ts
```

## 🚀 Getting Started

### Prerequisites
- [Wonderland Engine Editor](https://wonderlandengine.com/downloads/) ≥ 1.2.0
- Node.js ≥ 18

### Setup

```bash
git clone https://github.com/yinchy/wle-audio-spectrum-3d.git
cd wle-audio-spectrum-3d
npm install
npm run build
```

Then open your `.wlp` project file in the Wonderland Engine Editor and press **Package & Run** (F6).

### Scene Setup in the Editor

1. Create a **root empty object** and attach the `audio-spectrum-3d` component.
2. Create another object and attach `audio-input-ui`, pointing its `visualiserObject` property to the object above.
3. Set a **Phong or Flat material** on the `barMaterial` property of `audio-spectrum-3d`.
4. Add a directional light and a perspective camera.
5. (Optional) Enable **WebXR** in Project Settings for VR support.

## 🎛️ Component Properties

### `audio-spectrum-3d`

| Property | Type | Default | Description |
|---|---|---|---|
| `barCount` | int | 64 | Number of frequency bars |
| `barWidth` | float | 0.08 | Width of each bar (WLE units) |
| `barSpacing` | float | 0.04 | Gap between bars |
| `maxBarHeight` | float | 4.0 | Max height at full amplitude |
| `lerpSpeed` | float | 12.0 | Smoothing speed (higher = snappier) |
| `barMaterial` | material | — | Material applied to all bars |
| `fftSize` | int | 1024 | Web Audio FFT size (power of 2) |

### `audio-input-ui`

| Property | Type | Default | Description |
|---|---|---|---|
| `visualiserObject` | object | — | Object with `audio-spectrum-3d` component |

## 🧠 Architecture

```
Web Audio API
  └── AnalyserNode (FFT)
        └── Uint8Array frequencyData[]
              └── audio-spectrum-3d.update(dt)
                    └── forEach bar → scale Object3D Y-axis
```

Each bar is an `Object3D` with a `MeshComponent` using a procedural unit-cube mesh. Every frame the Y-scale is lerped toward the normalised FFT bin value × `maxBarHeight`.

## 📜 License

MIT
