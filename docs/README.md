# FlowerPower user guide

FlowerPower is an interactive botanical studio for designing, inspecting, and exporting stylized 3D flowers. This guide explains the editor from left to right and covers the complete workflow from choosing a variety to exporting an image.

## Quick start

1. Choose a starting species under **Variety**.
2. Shape the bloom with the controls under **Petal form**.
3. Choose flower and stem colors under **Palette**.
4. Drag the flower to inspect it from another angle and scroll to zoom.
5. Switch to line-drawing mode if you want a clean botanical outline.
6. Select **Export PNG** to download the current canvas view.

## Editor layout

The application has three main areas:

- The **top toolbar** contains view, save, documentation, and export actions.
- The **variety panel** on the left contains species presets and natural randomization.
- The **canvas** displays the live Three.js flower and provides camera controls.
- The **adjustment panel** on the right contains display modes, petal form, palette, and scene settings.

Every design change is reflected on the canvas immediately.

## Top toolbar

### Color and line-drawing views

Use the pencil or palette button at the top of the right panel to switch between the two render modes:

- **Color view** uses the flower's selected colors, physical materials, and studio lighting.
- **Line drawing** uses flat white surfaces with black model-derived edges. It is useful for studies, tracing, coloring pages, and shape review.

The line drawing uses the same flower geometry and current camera position as the color view. Switching modes does not reset your design.

### Composition grid

The **XY grid** button at the top of the right panel toggles a reference grid beneath the flower. Use it to judge scale, alignment, and stem curvature. Turn it off before exporting if you want a completely blank white background.

### Save study

**Save study** stores the current flower design in FlowerPower's PostgreSQL database. The saved record includes the preset, procedural seed, render mode, petal settings, palette, stem, lighting, and grid state. The button reports when the save is in progress, succeeds, or fails.

The **Flower center** density control adjusts how densely florets, stamens, and anthers are arranged. Lower values create an open, graphic center; higher values produce a fuller botanical center. This setting is included when a study is saved.

Use **Petal waviness** to add broad, irregular undulations across the petal surface. Unlike **Tip curl**, which bends the petal along its length, waviness creates alternating rises and dips that fade toward the attachment point. Each petal receives a seed-stable variation, and the setting is retained in saved studies.

The three square buttons at the lower-left of the canvas control presentation. **Line drawing** switches to flat white surfaces with black edges, **XY grid** toggles the composition grid, and **Photorealistic rendering** enables a restrained studio environment plus richer material response for petals, leaves, and stems. Select an active rendering button again to return to the standard matte color view. Render mode and grid state are retained in saved studies.

The **Stem structure** controls treat the stem as a set of related components. **Height**, **Thickness**, and **Taper** shape the primary stalk; **Growth nodes** changes the number of scars and axillary buds; **Stem hairs** scales the species' natural surface hair density. Leaves, petioles, modeled lenticels, and node placement follow the adjusted stalk. All stem settings are retained in saved studies.

The **Leaf structure** controls preserve each species' baseline silhouette while adjusting its components. **Foliage amount** changes the number of leaf pairs, **Leaf length** and **Leaf width** reshape the full blade/petiole assembly, **Leaf curl** controls cupping, **Edge serration** scales the natural margin pattern, and **Vein density** changes the modeled lateral-vein network. Leaf settings are retained in saved studies.

The expanded **Petal form** controls treat a petal as a volumetric assembly. **Base width** shapes its attachment, **Blade thickness** separates the front and back surfaces and edge rim, **Central fold** controls the mid-blade ridge, and **Longitudinal twist** rotates the blade in either direction. **Edge ruffle** and **Tip notch** scale each species' natural outline, while **Vein relief** changes the bump depth without making the material glossy. Petal settings are retained in saved studies.

The compact **Color palette** is overlaid at the lower-right of the canvas and edits petal, petal-tip, center, and stem colors. Canvas display controls and **Reset view** share the lower-left tool row, keeping presentation tools close to the Three.js view.

The **Flower center** is a configurable assembly. **Center size** and **Center profile** shape the receptacle, **Floret size** and **Element spread** organize the spiral floret field, **Filament length** changes the stamen ring, and **Anther size** and **Stigma size** shape the reproductive details. These work with **Element density**, which controls how many florets and stamens are generated. All center settings are retained in saved studies.

The stem contains a continuous structural center wire that follows the same spline as the visible stalk. Every leaf attachment is sampled directly from this wire, and each petiole begins at that exact point before entering the leaf blade. Changing stem height, curve, foliage amount, or species therefore regenerates connected attachment points instead of leaving leaves at fixed coordinates.

The realism controls also include **Petal age**, **Natural spotting**, and **Nectar guides** for seed-stable surface character. **Leaf droop** adds gravity to foliage, while **Bloom tilt** and **Bloom turn** break the rigid front-facing pose. These characteristics are persisted with saved studies.

### Saved flowers

Select **Saved flowers** in the top toolbar to browse the collection stored in PostgreSQL. Each entry shows its name, variety, seed, render mode, and save date. Select **Load** to restore every saved setting and display that flower on the canvas; you can then continue editing, export it, or save another study.

### Documentation

The book button opens this guide in a new browser tab, allowing you to keep the instructions beside the studio.

### Export PNG

**Export PNG** renders the current Three.js scene with the active camera and downloads it as a timestamped PNG file. The export contains the canvas only—not the toolbar or control panel.

Before exporting:

- Rotate and zoom until the composition looks right.
- Select color or line-drawing mode.
- Decide whether to show the composition grid.
- Wait for the flower to finish updating after changing a control.

## Choosing a variety

The presets provide different botanical structures rather than color changes alone:

### Daisy

- Dense overlapping petal whorls
- Narrow petals
- Broad, highly detailed center
- More sepals and fuller foliage

### Cosmos

- Broad petals with notched tips
- Airier, single-whorl construction
- Smaller central disc
- Narrower leaves

### Sunset

- Layered intermediate-width petals
- More pronounced curl and lift
- Warm flower palette
- Wider foliage

### Poppy

- Six broad, irregular primary petals with a second overlapping layer
- Low, dark reproductive center
- Strong natural variation and gently folded petal surfaces
- Minimal sepals and an open, papery silhouette

### Coneflower

- Narrow drooping ray petals
- Tall, densely packed conical center
- Numerous sepals and sturdy foliage
- A distinctly vertical profile when the canvas is orbited

### Dahlia

- Four graduated, overlapping petal whorls
- Shorter and more strongly lifted petals toward the center
- Dense geometric structure with restrained variation
- Small integrated center and broad foliage

### Rose

- Five nested whorls forming a dense rosette
- Strongly cupped and curled inner petals
- Soft irregular edges and darker petal bases

### Sunflower

- Two rings of narrow golden ray petals
- Large center with hundreds of spiral-arranged florets
- Broad foliage and a substantial reproductive disc

### Peony

- Four loose layers of broad ruffled petals
- Dense, softly closed inner bloom
- Visible golden reproductive details between inner petals

### Lotus

- Three orderly layers of upright, pointed petals
- Raised golden center and numerous stamens
- Restrained variation for a formal silhouette

### Anemone

- Single airy ring of broad petals
- Large contrasting dark center and dense stamens
- Strong basal color transition and irregular edges

### Zinnia

- Three graduated layers of narrow petals
- Compact architectural center
- Regular geometry with warm color transitions

Selecting a preset updates the relevant shape and color settings and creates a new procedural seed. You can customize every preset afterward.

## Petal form controls

### Petal count

Controls the number of petals in the primary whorl. Varieties with multiple layers derive their additional petal counts from this value.

### Length

Changes how far the petals extend from the flower center. Long petals create a larger, more open silhouette.

### Width

Controls the petal body width. The selected variety still contributes its own characteristic width and outline.

### Tip curl

Bends petals away from their base plane. Higher values produce more pronounced lifted or curled tips.

### Bloom

Controls how open the flower appears. Higher values flatten the bloom outward; lower values pull petals into a more closed form.

### Natural variation

Introduces seeded differences in petal length, width, angle, lift, and twist. Small values look orderly; larger values create a looser, more organic flower.

## Palette controls

Select a circular swatch to open the browser color picker.

- **Petal** controls the primary color near the petal base.
- **Petal glow** controls the color toward the petal tips.
- **Center** controls the central disc and its outer florets.
- **Stem** controls the stem, leaves, receptacle, and sepals.

Petals blend between the petal and petal-glow colors. Fine procedural variation prevents every vertex from having an identical shade.

At close range, petals, leaves, stems, and flower centers also use procedural
vein, fiber, and roughness textures. The reproductive center includes
species-specific disc florets, filaments, anthers, an ovary, and stigma lobes.

## Scene controls

### Stem curve

Changes the stem's lateral bend while preserving its tapered construction. Use smaller values for a formal botanical study and larger values for a gestural composition.

### Key light

Adjusts the primary studio light intensity in color view. It does not add a ground shadow, and it has no effect on the flat materials in line-drawing mode.

## Canvas navigation

- **Drag** to orbit around the flower.
- **Scroll** or use a trackpad gesture to zoom.
- Use the **reset-view button** in the lower-right corner to reload the initial view.

The live-study label in the upper-left identifies the selected variety and current procedural seed.

## Randomize naturally

**Randomize naturally** generates a new seed and makes bounded changes to petal count, curl, and natural variation. It is designed to create related flowers rather than completely unrelated shapes.

If you like the general result, continue refining it with the individual controls.

## Suggested workflows

### Create a botanical reference

1. Select the closest variety.
2. Keep natural variation relatively low.
3. Adjust petal count and proportions.
4. Use the composition grid to align the stem.
5. Hide the grid and export the color view.

### Create a line-art reference

1. Finish shaping the flower in color view.
2. Position the camera so overlapping petals remain readable.
3. Switch to line-drawing mode.
4. Hide the composition grid for a blank background.
5. Export the PNG.

### Explore variations

1. Select a preset and choose a palette.
2. Use **Randomize naturally** until the silhouette is interesting.
3. Reduce natural variation if the result is too irregular.
4. Fine-tune bloom, curl, and stem curve.

## Troubleshooting

### The exported image has the wrong angle

PNG export uses the current canvas camera. Reposition the flower on the canvas and export again.

### The grid appears in the PNG

The composition grid is part of the Three.js scene. Turn off the grid button before exporting.

### The line drawing has too much overlap

Rotate the flower slightly or zoom in. The black lines are derived from visible model geometry, so camera angle affects their readability.

### The flower is too regular or too irregular

Adjust **Natural variation**. The result remains deterministic for the displayed seed until you apply a preset or randomize again.

### Export does not start

Confirm that the browser allows downloads from the site. Some privacy modes or embedded browsers block programmatic file downloads.

## Privacy and data

Flower design controls and PNG generation run in the browser. Selecting **Save study** sends the current settings to the FlowerPower server for persistence in PostgreSQL.

## Developer API reference

The navigation sidebar also contains the generated TypeScript API reference for FlowerPower's reusable store, database, and model-related types. Most studio users do not need these pages.
