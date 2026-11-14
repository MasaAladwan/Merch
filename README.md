# Merch Showroom

A standalone proof of concept: a merchandise catalog with 3D product pages, AR
("view in your space"), and a customizer that prints uploaded artwork onto the
3D product and can show the customized result in AR.

It is frontend-only. There is no backend, login or database yet; saved designs
live in the browser's localStorage.

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:5183>.

## Test AR on a real phone

AR only works on a phone: iPhone/iPad in Safari, or an ARCore-capable Android
phone in Chrome. On a desktop browser the AR button is hidden and the page says so.

1. Put the phone and the computer on the same Wi-Fi.
2. Start the HTTPS dev server (phones refuse camera/WebXR over plain HTTP):

   ```bash
   npm run dev:https
   ```

3. Vite prints a `Network:` address such as `https://192.168.1.20:5183`. Open it
   on the phone and accept the self-signed certificate warning.
4. Open a product and tap **View in your space** on the model.
5. Open **Customize**, upload an image, click the product to place it, then tap
   **View my design in AR**.

What to expect per platform:

| Platform | Product page AR | Customized design AR |
|---|---|---|
| iPhone Safari | Quick Look, USDZ generated on the device | Same; the customized model is converted on the device |
| Android Chrome | WebXR in the page, falling back to Google Scene Viewer | WebXR only. Scene Viewer cannot load a model that exists only in the browser |

AR places the product as an object in the room (on a floor or desk). It is not
body tracking: it will not put the hoodie on a person.

## Try it on with a PC webcam

For desktop users, apparel has a **Try it on (webcam)** button in the customizer.
It opens the computer's webcam, tracks the body in 3D with an in-browser pose
model (MediaPipe Pose Landmarker), and draws the customized 3D garment on the
torso. The garment turns with the person, so turning around shows its back and
any artwork placed there.

- Works on `http://localhost:5183` or any HTTPS address; browsers block the
  camera on plain HTTP elsewhere.
- Free: no server and no per-use cost. The video never leaves the computer.
- First use downloads the pose model and its runtime (about 20 MB) from public
  CDNs, so it needs internet once; the browser caches them afterwards.
- It is a rigid 3D model placed on the shoulders. It does not drape or follow
  the arms, and arms do not pass in front of it. Only the neck and head hide
  the collar behind them. Matching a generative try-on such as Decart's Lucy
  VTON needs their paid cloud API.
- Turning is driven by the pose model's depth estimate, which is its least
  accurate output; expect some wobble, most of all close to side-on.
- Keep both shoulders in frame. The hips are used for lean when visible;
  otherwise the torso is assumed upright.
- The **Fit** sliders adjust size and height. The default fit is an estimate for
  the sample T-shirt (`SHOULDER_SPAN`, `SHOULDER_Y` in
  `src/customizer/TryOnMirror.tsx`).

## What is real and what is a stand-in

- **Models.** Every product uses a public sample GLB. The two apparel items use
  a real T-shirt model (the "hoodie" is that same shirt). Bottle is a real
  bottle. Mug, powerbank, tote and pen are unrelated sample objects and are
  labelled "Placeholder model" in the UI. The shirt comes from a public tutorial
  repository; check its licence before using it for anything real.
- **Catalog cards** show a colour swatch, not a product render. No 3D code or
  model is downloaded until a product is opened.
- **Production export** downloads a PNG of the current view plus a JSON file
  with colour, each placement (zone, position, rotation, size in metres) and the
  artwork. A print shop cannot print from this directly: real print files need a
  flat print template per product, which needs the real product models.
- **Uploaded artwork** is downscaled to 1024 px for preview and storage, so the
  original full-resolution file is not kept.

## Using your own models

Put a `.glb` in `public/models/` and edit `src/data/products.ts`:

```ts
modelUrl: '/models/hoodie.glb',
sizeMeters: 0.75,     // largest real-world dimension, used for AR scale
placeholder: false,
```

The customizer prints onto the largest mesh in the file, so the garment body
should be a single mesh. Keep models small (ideally under 2 MB, Draco or Meshopt
compressed); the current samples are 1 to 10 MB.

## How the customizer keeps artwork on the garment

Artwork is not an image floating in front of the model. Each placement is a
decal: the image is projected onto the garment's triangles around the clicked
point, producing a small mesh that follows the surface. It therefore stays
attached from every angle, and it is included when the design is exported to a
GLB for AR (`src/lib/exportGlb.ts`).

Placement coordinates are stored in a normalized model space (largest dimension
= 1.6 units), so they do not depend on how a GLB happens to be scaled.

## Layout

```
src/
  data/products.ts        catalog data
  lib/                    types, design store (zustand), image validation, GLB export, torso pose maths
  components/             Navbar, ProductCard, ModelViewer (<model-viewer> wrapper)
  pages/                  Showroom, ProductDetail, Customizer, Saved
  customizer/             CustomizerScene (react-three-fiber), ControlPanel, ArPreview, TryOnMirror
```

Bundle split (gzipped): catalog about 58 kB; the model-viewer chunk, the
customizer chunk and three.js load only when a product or the customizer is
opened; the GLB exporter loads only when AR is requested from the customizer.

## Not built yet

Backend API, accounts, a database for products and designs, server-side upload
validation and storage, print-ready export, automated tests.
