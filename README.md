# Raffle Wheel

Raffle Wheel is a no-backend fundraiser raffle platform for charity events, credit union fundraisers, school raffles, community prize nights, and virtual drawings.

It is built with plain HTML, CSS, and JavaScript, so it can run directly in a browser or on GitHub Pages.

## Fundraiser Workflow

1. Enter the participant name.
2. Enter the number of tickets purchased.
3. Click **Add Tickets**.
4. Add an optional current prize name.
5. Spin the wheel.
6. The winner is logged automatically.
7. Export the winner log when the event is finished.

## How Tickets Work

Each purchased ticket is stored as one entry in a simple array.

If Sarah buys 5 tickets, the app stores:

```js
["Sarah", "Sarah", "Sarah", "Sarah", "Sarah"]
```

If Sarah buys 2 more tickets later, the array becomes:

```js
["Sarah", "Sarah", "Sarah", "Sarah", "Sarah", "Sarah", "Sarah"]
```

Winner selection is made from the full ticket-entry array. This means Sarah has exactly 7 chances if she has 7 entries. The app does not convert entries into hidden weights or weighted objects.

## Participant Management

The participant summary groups duplicate ticket entries for easier management:

```text
Sarah — 7 tickets
Mike — 2 tickets
Allix — 1 ticket
```

Each participant row includes:

- `+1` to add one ticket
- `-1` to remove one ticket
- `Remove all` to remove every matching ticket entry

The participant list is searchable and sorted alphabetically.

## Prize Tracking

The **Current Prize** field is optional.

If a prize is entered before spinning, that prize is saved with the winner log entry:

```text
1. Sarah — Wine Basket
2. Mike — Gift Card
3. Sarah
```

If no prize is entered, the winner is still logged without a prize.

## Winner Log

Every completed spin creates a persistent winner log entry with:

- Draw number
- Winner name
- Prize name, if provided

The winner log is stored in `localStorage` and remains after refreshing the page.

Use **Clear Winner Log** to erase the log. The app asks for confirmation before clearing.

## Export

Click **Export Winner Log** to download:

```text
raffle-winners.csv
```

The CSV columns are:

```text
Draw Number,Winner Name,Prize Name
```

Names and prize values with commas, quotes, or special characters are escaped properly.

## Persistence

The app uses `localStorage` to preserve:

- Ticket entries
- Winner log
- Current prize field

No backend, database, accounts, or server are required.

## Frontend Libraries

The app remains vanilla HTML, CSS, and JavaScript. Lightweight presentation libraries are included locally in `vendor/` so GitHub Pages can serve them with the app:

- Canvas Confetti for winner celebrations
- SweetAlert2 for winner announcements and confirmation dialogs
- Lucide Icons for button and section icons

Google Fonts are loaded for Poppins headings and Inter body text.

## Host Safety Controls

The app asks for confirmation before:

- Clearing all ticket entries
- Clearing the winner log
- Performing a full raffle reset

Winners are not automatically removed from the raffle. Hosts decide when and whether to remove entries based on their event rules.

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

1. Commit `index.html`, `styles.css`, `script.js`, and `README.md` to a GitHub repository.
2. Open the repository settings.
3. Go to **Pages**.
4. Choose the branch that contains the app, usually `main`.
5. Set the source folder to the repository root.
6. Save.

GitHub will provide a public URL for the raffle app.
