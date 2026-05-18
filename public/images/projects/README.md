# Project hero images

This directory holds the photographic hero images shown on `/projects` cards
and at the top of each `/projects/[id]` detail page.

## Drop-in convention

Filename = the project's `msme_name` slugified (lowercased, alphanumerics +
hyphens). The resolver in `lib/projects/hero-image.ts` walks file extensions
in this priority order: `.webp` → `.jpg` → `.jpeg` → `.png` → `.avif`.

| Project msme_name                                  | Filename                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| Veejay Syntex                                      | `veejay-syntex.webp`                                  |
| Gomuki Spinning Mills                              | `gomuki-spinning-mills.webp`                          |
| Unitech Plasto Components                          | `unitech-plasto-components.webp`                      |
| Alpine Knits India                                 | `alpine-knits-india.webp`                             |
| Vivanta Bangalore — Chiller Plant Bundle           | `vivanta-bangalore-chiller-plant-bundle.webp`         |
| TN Foods Coimbatore — Cogen + Heat Recovery        | `tn-foods-coimbatore-cogen-heat-recovery.webp`        |

If the file is missing, the card falls back to the stylized SVG placeholder.
No DB column, no manifest update needed — just drop the file.

## Recommended dimensions

- Aspect: **16:9** (the card crops to `aspect-[16/9]`)
- Resolution: **1280 × 720** minimum, **1920 × 1080** ideal
- Format: **`.webp`** preferred (~50–80% smaller than PNG/JPG at same quality)

## Shared style cues for all 6 (so they read as a family)

> Photographic, industrial / facility interior, magazine-quality, soft natural
> light from the side, subtle warmth, narrow depth of field, no prominent
> human faces, calm composition (not cluttered or chaotic), color palette
> dominated by neutral greys + warm wood tones with subtle green accents,
> 35 mm lens look, slight haze/atmosphere for depth, late-afternoon hour.

Add this style block to the end of every prompt below.

---

## Per-project prompts

### 1 — Veejay Syntex (Surat polyester yarn mill, 9 ECMs)
> Interior of an Indian polyester yarn spinning mill in Surat — long rows of
> ring-frame spinning machines stretching into the distance, white yarn
> cones in soft focus, warm tungsten and cool fluorescent light mixed,
> motion-blurred filaments, subtle textile dust in the air catching the
> light, polished concrete floor, late-afternoon golden hour through tall
> factory windows. [+ shared style cues]

### 2 — Gomuki Spinning Mills (Coimbatore cotton spinning, 10 ECMs)
> Cotton spinning mill interior in Tamil Nadu — rotating ring-frame
> machines with cream-colored cotton cones, soft motion blur on machine
> heads, indistinct worker silhouettes far in background (out of focus),
> warm late-afternoon light streaming through high industrial windows,
> textile haze, polished waxed-concrete floor. [+ shared style cues]

### 3 — Unitech Plasto Components (Pune auto-parts plastic moulding, 12 ECMs)
> Industrial plastic-injection moulding floor at an Indian auto components
> plant in Pune — row of large green-grey injection moulding machines,
> overhead compressed-air piping in muted brass, robotic ejection arms
> mid-cycle, cool ambient blue-grey palette with subtle green machine
> accents, polished epoxy floor reflecting machine lights. [+ shared style cues]

### 4 — Alpine Knits India (Tirupur knitwear, 10 ECMs)
> Circular knitting machine floor in a Tirupur knitwear unit — vertical
> stacks of brightly colored cotton yarn cones in soft focus background,
> a central circular knitting machine in sharp focus producing white
> jersey fabric, warm late-afternoon side light through factory windows,
> calm not crowded composition. [+ shared style cues]

### 5 — Vivanta Bangalore — Chiller Plant Bundle (hotel HVAC, 5 ECMs)
> Large hotel chiller plant equipment room in Bangalore — two big
> magnetic-bearing centrifugal chillers in muted dark blue and brushed
> steel, perfectly aligned chilled-water pipes in cream insulation,
> brass-rimmed pressure gauges, polished concrete floor reflecting cool
> light, no clutter, architectural-photography feel. [+ shared style cues]

### 6 — TN Foods Coimbatore — Cogen + Heat Recovery (4 ECMs)
> Biomass cogeneration plant inside a food-processing facility in Tamil
> Nadu — large industrial boiler in matte dark green with cream-painted
> steam pipes routed overhead, brass valve handles, slight steam haze
> catching late-afternoon side light, polished concrete floor, mood is
> calm and orderly (not industrial-chaos), no visible people. [+ shared style cues]

---

## Workflow

1. Generate the 6 images one at a time in Midjourney/Runway with the prompts
   above. Pick the variant that fits the brand best.
2. Export at 1920×1080 (or whatever the tool allows close to it).
3. Convert to `.webp` (`cwebp -q 82 input.jpg -o slug.webp` or any online
   converter).
4. Drop in this directory with the exact filenames listed above.
5. Hard-refresh `/projects` — the cards pick the images up automatically.

No code change needed once you drop the files.
