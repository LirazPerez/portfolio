# lirazhazala.com

My portfolio, designed and built by me from scratch. I'm Liraz Hazala Perez, a product designer who also builds what she designs, so the site itself is part of the work: the craft, the accessibility and the restraint in the code matter as much as the case studies.

**Live site:** [lirazhazala.com](https://lirazhazala.com)

## What's inside

Four case studies, each told from problem to shipped (or shippable) product:

- **AeroPulse** – one equipment picture that a logistics team across dozens of sites and two countries is willing to act on.
- **Waypoint** – a health organizer for patients and the family members who manage their care.
- **Neta** – a native iPhone coach that plans my half marathon from my own Apple Health data. ([repo](https://github.com/LirazPerez/neta))
- **Google Maps Recall** – save a place in one tap, and find it again without remembering what you named it.

## How it's built

- **Astro** with TypeScript, static output, almost zero JavaScript in the browser.
- **Tailwind CSS v4**, with every color defined once as a design token.
- **Accessibility from the start:** light and dark themes that follow the device setting (with a manual toggle), every color pair checked against WCAG AA contrast, keyboard navigation and reduced-motion support.
- **MDX** for the case studies, and a small React island for the interactive hero.
- Built with **Claude Code** as a pair programmer, and deployed on **Vercel**.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:4321.
