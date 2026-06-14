# The Prince's Dilemma 👑

A fun, easy-to-pick-up **smartphone web game** inspired by Niccolò Machiavelli's
*The Prince*. You are a newly risen prince. Advisors bring you a dilemma each
season — swipe or tap to decide — and try to keep your reign alive as long as
you can while learning what Machiavelli would have whispered in your ear.

> *"It is better to be feared than loved, if you cannot be both."*

## How to play

Each turn shows a **scenario card** with two replies:

- **◀ Swipe / tap left** — the first reply
- **Swipe / tap right ▶** — the second reply (arrow keys also work on desktop)

Every choice shifts your four **pillars of power**:

| Pillar | Meaning |
| --- | --- |
| 👑 Authority | Your grip on the crown |
| ⚔️ Army | The swords that defend you |
| ❤️ People | The love of the streets |
| 💰 Treasury | The gold that buys it all |

If **any** pillar empties *or* overflows, your reign ends — and you're shown the
real principle from *The Prince* that you ignored. Survive **20 years** for a
"Reign Remembered." Your longest reign is saved on your device.

## Wisdom Collected

Every dilemma you face permanently unlocks its lesson in the **Wisdom Collected**
gallery (reachable from the title and game-over screens). Tap an unlocked counsel
to read the full Machiavellian principle behind it. Your goal beyond survival:
gather all the counsels in the deck. Progress is saved on your device.

## Share your reign

When a reign ends you can **Share Your Reign** — the game draws a result card
(crest, years ruled, how you fell, and counsels gathered) to a canvas and shares
it as an image via the device's native share sheet (Web Share API). Where image
sharing isn't supported it falls back to sharing/copying a text summary and
offering the card as a download. **Read this counsel** jumps straight to the
lesson that ended your reign, highlighted in the Wisdom gallery.

## Sound

The game has a synthesized soundtrack of effects (card deals, decisions, learning
a new counsel, triumph and ruin) built with the Web Audio API — no audio files
needed. Tap the 🔊 button (top-right) to mute or unmute; your choice is remembered.

## The teaching

Every card is built on an actual lesson from *The Prince* — fear vs. love, your
own arms vs. mercenaries, "well-used" cruelty, the lion and the fox, why the
love of the people is the best fortress, and more. Win or lose, you come away
having absorbed a slice of Machiavelli's playbook.

## Play online (GitHub Pages)

The game ships with a GitHub Actions workflow that deploys it to GitHub Pages
automatically. To turn it on (one-time):

1. Go to the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually from
   the **Actions** tab). The workflow publishes the site and prints the live URL.

Once deployed it lives at:

```
https://nextlevelcorp.github.io/prince_game/
```

Open that link on your phone and choose **"Add to Home Screen"** to play it
full-screen like a native app. All asset paths are relative, so it works
correctly from the `/prince_game/` project sub-path.

## Run it locally

It's a single static web app — no build step, no dependencies.

```bash
# from the project folder, start any static server, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000 on your phone or browser
```

Or simply open `index.html` in a browser. To install it on a phone, open it in
the mobile browser and choose **"Add to Home Screen"** — it runs full-screen
like a native app.

## Files

- `index.html` — screens and layout
- `styles.css` — mobile-first medieval theme
- `scenarios.js` — the card deck (the lessons live here — easy to extend)
- `game.js` — game engine (stats, swipe handling, win/lose)

## Extending the deck

Add a new dilemma by appending an object to `SCENARIOS` in `scenarios.js`:

```js
{
  portrait: "🧔",
  name: "Captain Orsino",
  text: "The dilemma you pose to the prince…",
  left:  { label: "First reply",  effects: { authority: -8, people: +10 } },
  right: { label: "Second reply", effects: { authority: +12, people: -8 } },
  lesson: "The principle from The Prince this card teaches."
}
```

Effects can move any of `authority`, `army`, `people`, `treasury` (roughly
-25…+25). Omitted pillars are unchanged.
