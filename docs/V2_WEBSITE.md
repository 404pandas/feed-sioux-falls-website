# Feed Sioux Falls website — Version 2.0

A public website anyone can use, plus a staff app behind login with full access to the database.
Built to look like the logo (hand-drawn marker outlines, the five raised hands) and to be easy for
people who don't like new apps: big text, plain words, labels on every button.

## What's new

### Public site (no login)
- **Home**: "Food is a human right", live totals from the database (people served, items handed out,
  outreach days), pantry hours, the next Saturday outreach date, **what we're short on right now** (with
  store links), the community survey, and ways to help.
- **Get help**: pantry and outreach details with directions, an "Ask for help" form, and 211.
- **Give**: Zeffy, text FOOD to 707070, Pledge, card donation in the page, the full needs list,
  "what goes out fastest", and Amazon wish list, volunteering (Meetup) and partnering.
- **About us**: mission, what we do, Lisa Coder and the board, contact form, and links.
- Every page's footer: address, email, Facebook, Meetup, feedsiouxfalls.com, Zeffy, Pledge, text-to-give.
- The **staff login is a small link**. The list of names only appears on `/login`.
- The public site never shows stock counts, costs, people, survey answers, or donations, only item
  names and "Out right now" or "Running low".

### Staff app (volunteers and admins)
- Sidebar on computers, a bottom tab bar on phones: **Home, Count people, Inventory, Survey, More**.
- **Home**: big buttons for the four common jobs, this month's numbers, and what needs restocking.
- **Inventory** (one page replaces Inventory + Adjust Inventory):
  - Snapshot at the top: all items, out of stock, low or out, and dollar value on the shelves (admins).
    Tap a number to filter.
  - −/+ on every item (change by 1, 10, or 20); every change is logged as history.
  - Admins edit "low at" and cost right in the list, and open an item to change anything:
    **store links for Amazon, Temu, Dollar General, Walmart, Target, Costco, Sam's Club, or any store**,
    with price per pack, so the cheapest per unit is marked. They can also log a purchase (adds stock and
    counts it against the budget), hide an item from the public list, add, and delete.
  - Print, and download as a spreadsheet (CSV).
- Volunteers see only what they use; admin pages redirect them home.

### Admin database access
- **All data**: every collection in the database, with counts. Each one is searchable, sortable and
  filterable, with view, add, edit, and delete:
  People & logins · Inventory items · Inventory history · Purchases · Monthly budgets · Outreach events ·
  People-served counts · Messages · Survey responses · Survey contact requests · Donations · Change log
- **People & logins**: add people, set roles, reset PINs (stored hashed, never shown), deactivate.
  It won't let you remove the last admin or delete yourself.
- **Survey responses**: read each anonymous survey one at a time (arrow keys flip), filter by
  language or how it was filled out, and delete test entries. Totals stay on Survey results.
- **Change log**: who added, edited, or deleted what, and when (which fields, not their values).
- Some records stay read-only on purpose: Stripe amounts and status, survey answers, and the change log.

## Backend changes (in the feed-sioux-falls-mobile repo, `backend/`)
All additive. The current mobile app keeps working unchanged (covered by `backend/test/api.test.js`).
- `Item.sources`: any number of store links per item. The old `amazonLink` field is kept in sync both
  ways, so the mobile app's Buy Now still works and editing in the old app doesn't wipe Temu or
  Dollar General links.
- `Item.hideFromPublic`.
- `GET /api/public/summary`: public totals and needs list. Cached for 1 minute, rate limited.
- `/api/admin/:collection`: list, get, create, update, and delete for every collection. Admins only,
  each collection has an allowlist of fields, and every change is written to `AuditLog`.
- `npm test`: API tests (old and new routes). Needs a throwaway MongoDB:
  `MONGODB_URI_TEST=mongodb://127.0.0.1:27017/fsf_test npm test`

## Rolling it out (order matters)
1. **Deploy the backend first** (Render/Railway). The new website calls `/api/public` and `/api/admin`,
   which don't exist on the old backend. The old website and the mobile app work fine on the new backend.
2. Deploy the website (Netlify). `public/_redirects` makes links like `/data/users` work on refresh.
3. Log in as an admin and add store links to items (Inventory → Edit). They appear on the public
   needs list as soon as an item runs low.

## To fill in
- **Amazon wish list link** → `src/config/org.js` (`links.amazonWishlist`). The button stays hidden until set.
- Double-check the other links and team bios in the same file.
- Have a native speaker check the two Spanish wording tweaks in `src/survey/strings/es.js`.

## Mobile app follow-ups
- Show and edit store links (`sources`) instead of only Amazon.
- Add the public home page numbers and needs list for guests.
- The admin data screens are web-only for now. On a phone, the website works well in the browser.
