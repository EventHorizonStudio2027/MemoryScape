# MemoryScape

Describe a memory or experience. The system designs an **explorable 3D zone** from it. New zones connect to the ones you already made — a walkable map of your past.

## Play

1. Open the app (GitHub Pages or local `index.html`)
2. Name a place and describe what happened / how it felt
3. **Design 3D zone** — walk it with WASD, look with the mouse
4. Create another memory and **link** it — teal portals connect the zones (press **E**)

## Controls

- **Click** — capture mouse look
- **WASD** — move
- **E** — enter portal
- **Esc** — release mouse

## Stack

Static Three.js client. No build step. Zones and links stored in `localStorage`.

## Pages

Repo Settings → Pages → Source: **GitHub Actions** (workflow included), or Deploy from branch `main` / root.
