# Euphoric Vision

See the potential in every space.

This is Stage 3 of 8: real AI redesigns. Upload a room photo and generate Level 1, 2 and 3 concepts of that same room, guided by one property-wide design plan and budget.

The preview link in Claude shows everything except generating, because it can't keep a secret key. To generate real redesigns, follow **SETUP-AI.md** to put your own copy online with Vercel (no coding or installing needed).

## Run it on your computer

1. Install **Node.js** (the "LTS" version) from https://nodejs.org. This gives you the `npm` command.
2. Unzip this folder somewhere easy, for example your Desktop.
3. Open a terminal in the folder:
   - Windows: open the folder, click the address bar, type `cmd` and press Enter.
   - Mac: right-click the folder in Finder, choose "New Terminal at Folder".
4. Type `npm install` and press Enter. This downloads the building blocks (only needed once).
5. Type `npm run dev` and press Enter.
6. Open the link it shows, usually http://localhost:5173, in your browser.
7. To stop the app, click the terminal and press Ctrl + C.

## Other commands

- `npm test` runs the automated checks on the project logic.
- `npm run build` creates the finished website in the `dist` folder (Vercel does this for you).

## What is where

- `src/pages` - one file per screen (Home, Project, Redesign, Assess, Costs, Report).
- `src/components` - pieces reused across screens (header, slider, notices).
- `src/state` - the project data, each room's design settings, and the photo handling.
- `src/lib/redesignBrief.ts` - writes each room's Stage 3 instructions: the shared property brief plus the room's own details.
- `src/lib/budget.ts` - room estimates and the split of the single property budget (allocations + reserve always equal the total).
- `src/pages/DesignPlan.tsx` - the master design plan and total budget.
- `api/` - the private server code that runs on Vercel and talks to OpenAI. The OpenAI key is only ever read here.
- `src/components/AiRedesignPanel.tsx` - generating, comparing and revisiting redesigns.
- `src/lib/aiPricing.ts` - confirmed token prices and per-image cost estimates.
- `src/lib/photoStore.ts` - keeps photos privately on this device.
- `src/lib/config.ts` - settings such as the rand planning ranges.
- `.env.example` - a template for secret keys, used from Stage 3. Never put keys anywhere else.

## Current limitations

- Generated images are design concepts. They can alter details, sizes and features, so always compare with the original photo. Furniture marked to keep is requested, not guaranteed.
- The drawn bedroom on the home page is labelled as a demonstration.
- Photos and redesigns stay in this browser (IndexedDB). A photo is sent to OpenAI only when you press Generate and confirm the cost.
- Project details and photos are saved in this browser only. A different browser or device will not see them.
- iPhone HEIC photos must be saved as JPEG first.
- Budget estimates use preliminary planning ranges and simple adjustment factors (listed on the Costs page), not quotes. Itemised costs arrive in Stage 5.
- Room condition is a quick owner rating. The full assessment checklist arrives in Stage 4.
- Assessment, the itemised cost estimator, rental projections and the report are labelled with the stage in which they arrive.
