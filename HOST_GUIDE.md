# Raffle Wheel Host Guide

Use this guide to run the fundraiser drawing smoothly during the live event.

## Before The Event

1. Open the raffle app.
2. Use **Full Reset** if you need a clean event state.
3. Load the raffle entries from a spreadsheet paste or CSV/TSV file.
4. Confirm the prize selector shows the basket list in poster order.
5. Test sound, screen sharing, and one practice interaction before the live draw.

## Import Format

Use three columns:

```text
Participant,Prize,Tickets
Jonathan Consumer,Wine Tasting,3
Sarah Martinez,Wine Tasting,1
Mike Lee,Pet Lover Basket,2
```

Copying directly from a spreadsheet also works:

```text
Participant	Prize	Tickets
Jonathan Consumer	Wine Tasting	3
Sarah Martinez	Wine Tasting	1
Mike Lee	Pet Lover Basket	2
```

For file loading, export the spreadsheet as `.csv` or `.tsv`. Raw `.xlsx` files are not parsed directly.

## Prize Name Shortcuts

Imported prize names can use shorthand. The app normalizes these to the full basket names:

```text
Cozy Reader -> The Cozy Reader
Nike -> Nike Basket
Pet Lover -> Pet Lover Basket
Coffee Basket -> Thanks, A Latte Basket
McMenamins -> McMenamins Signature Pint & Passport Package
```

## Poster Drawing Order

The ten poster baskets appear in this order:

```text
1. Pie in the Face
2. Wine Tasting
3. 4th of July Basket
4. McMenamins Signature Pint & Passport Package
5. Summer Fun Toy Basket
6. Nike Basket
7. The Cozy Reader
8. Mom and Baby Basket
9. Thanks, A Latte Basket
10. Pet Lover Basket
```

## Live Drawing Workflow

1. Click the **Now Drawing** prize card.
2. Select the prize to draw.
3. Confirm the status says **Prize loaded. Ready to draw.**
4. Click **Spin the Wheel**.
5. Let the winner announcement complete.
6. The winner is automatically added to the Winner Log.
7. Select the next prize and repeat.

After each spin, the selected prize resets and the active wheel clears. The imported event data remains saved until **Full Reset**.

## Presentation Mode

Use **Presentation Mode** to hide setup and admin panels during the live drawing.

Presentation Mode keeps visible:

- Header
- Dashboard stats
- Prize selector card
- Wheel and Spin button
- Current winner
- Winner Log

Presentation Mode hides:

- Add Entries
- Load Event Entries
- Tickets by Participant
- Admin Tools
- Winner Log export/remove controls

Click **Exit Presentation** to return to the full host dashboard.

## Winner Log

Each completed spin adds a row with:

- Draw number
- Winner name
- Prize name, if selected

The latest winner is highlighted. Use the trash icon on a winner row to remove an incorrect log entry; the app asks for confirmation first.

Use **Export CSV** to download:

```text
raffle-winners.csv
```

CSV columns:

```text
Draw Number,Winner Name,Prize Name
```

## Ticket Logic

Each purchased ticket equals one entry in the drawing.

If Sarah buys 5 tickets, the active drawing array contains:

```js
["Sarah", "Sarah", "Sarah", "Sarah", "Sarah"]
```

Winner selection is random from the full active ticket array. The app does not convert entries into hidden weights.

## Manual Adjustments

Open **Add Entries** to add tickets manually.

Open **Tickets by Participant** to:

- Add one ticket
- Remove one ticket
- Remove all tickets for a participant
- Search participants

When imported event data is loaded, manual adjustments apply to the currently selected prize's ticket pool.

## Safety Controls

The app asks for confirmation before:

- Clearing entries
- Clearing the winner log
- Removing a winner log entry
- Performing a full reset

Winners are not automatically removed from raffle entries. Hosts decide whether entries remain active based on event rules.

## Persistence

The app uses browser `localStorage` to preserve:

- Imported event entries
- Active ticket entries
- Custom prizes
- Winner log

Refreshing the page does not erase the event. A full reset clears the saved raffle state.
