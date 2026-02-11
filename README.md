# Valentine Captcha

A playful “captcha” that leads to a **Will you be my valentine?** screen.

## How it works

1. **Captcha screen** – “Verify you're human” by selecting all the hearts in the grid (3 hearts among flowers, stars, and other emojis). The **Verify** button enables only when all hearts are selected.
2. **Valentine screen** – After verifying, the next screen asks “Will you be my valentine?” with **Yes!** and **No** buttons. The No button moves when hovered or clicked. Choosing **Yes!** shows a short success message.

## Run it

Open `index.html` in a browser (double-click or drag into Chrome/Firefox/Safari), or serve the folder with any static server.

```bash
# Optional: serve with Python
python3 -m http.server 8000
# Then open http://localhost:8000
```

No build step or dependencies required.
