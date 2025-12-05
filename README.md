# Pocket Spirit Garden

A relaxing idle gacha game where you collect magical spirits and place them in your garden to generate essence.

## Features

- **24 Unique Spirits** across 4 rarities (Common, Uncommon, Rare, Legendary)
- **6 Elements** - Fire, Water, Earth, Air, Light, Shadow
- **Gacha Summoning** - Single (50 essence) or Multi-pull (450 for 10)
- **Synergy System** - Place spirits near compatible elements for bonus production
- **Tap Bonuses** - Tap spirits for 2x production for 5 seconds
- **Offline Progress** - Earn essence while away (up to 8 hours)
- **Auto-Save** - Progress saved to LocalStorage every 30 seconds

## Tech Stack

- **Phaser 3** - Game framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deploy to Cloudflare Pages

This game is a static site and deploys easily to Cloudflare Pages:

1. Connect your GitHub repo to Cloudflare Pages
2. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 18+
3. Deploy!

No server required - everything runs in the browser.

## Gameplay Guide

1. **Start** with 100 essence
2. **Summon** spirits from the gacha
3. **Place** spirits from your inventory into the garden
4. **Position strategically** - spirits with synergies boost each other
5. **Tap** spirits for bonus production
6. **Watch** essence accumulate
7. **Summon more** spirits!

## Synergy Tips

Each spirit has elements they synergize with:
- Place a Fire spirit next to an Air spirit = +25% bonus
- Stack multiple synergies for huge bonuses
- Synergy connections show as glowing green lines
- Spirits with active synergies have a green glow

## License

MIT
