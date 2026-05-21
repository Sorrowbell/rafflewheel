# Raffle Wheel

A simple browser-only raffle wheel built with HTML, CSS, and JavaScript.

## How to run

Open `index.html` directly in a browser, or serve the folder with any static file server.

For example:

```sh
python3 -m http.server 4173
```

Then visit:

```text
http://localhost:4173
```

## Features

- Add up to 100 participant names.
- Place each new participant randomly on the wheel.
- Prevent empty names.
- Allow identical names and give identical names the same color.
- Show every participant in an alphabetical list and on a colorful canvas wheel.
- Remove individual participants.
- Optionally remove all identical names at once.
- Spin the wheel and fairly pick a random winner.
- Show a small confetti celebration when a winner is selected.
- Keep the selected winner on the wheel after a spin.
- Clear all names.
- Store names only in browser memory.
