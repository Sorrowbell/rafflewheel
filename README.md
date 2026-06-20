# Raffle Wheel

A no-backend fundraiser raffle wheel for live prize drawings. Built with plain HTML, CSS, and JavaScript so it can run directly in a browser or on GitHub Pages.

## What It Does

- Loads raffle entries from pasted spreadsheet rows or CSV/TSV files
- Treats each ticket as one real raffle entry
- Supports duplicate names for multiple purchased tickets
- Draws winners from the full ticket-entry array
- Tracks the current prize and winner log
- Exports the winner log as CSV
- Persists event data in `localStorage`
- Includes presentation mode, confetti, sound effects, and confirmation dialogs

## Files

- `index.html` - app markup
- `styles.css` - visual design and responsive layout
- `script.js` - raffle logic, drawing flow, persistence, import/export
- `assets/` - local images
- `vendor/` - local lightweight frontend libraries
- `HOST_GUIDE.md` - event-day instructions for raffle hosts

## Raffle Fairness

Each purchased ticket is stored as one entry in the active drawing array.

Example: if Sarah has 5 tickets and Mike has 1 ticket, Sarah appears 5 times and Mike appears once. The winner is selected randomly from that full entry array, so Sarah has exactly 5 times Mike's chance.

The wheel animation is visual only. Winner selection happens before the wheel animation is calculated.

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static server:

```sh
python3 -m http.server 4173
```

Then visit:

```text
http://localhost:4173
```

## Deploy With GitHub Pages

1. Commit the project files to a GitHub repository.
2. Open the repository settings.
3. Go to **Pages**.
4. Choose the deployment branch, usually `main`.
5. Set the source folder to the repository root.
6. Save.

GitHub will provide the public raffle app URL.

## Host Instructions

See [HOST_GUIDE.md](HOST_GUIDE.md) for the event workflow, import format, drawing order, presentation mode, winner log management, and safety controls.
