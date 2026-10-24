# Vienna guide ("וינה של אמא")

A one-page Hebrew (RTL) web app that works like a phone app, built for my mom and her friend for a four-day trip to Vienna. My mom is around 60 and not comfortable with technology, so the design borrows from apps she already knows: a WhatsApp-style green header, Google Maps-style place cards with a blue "take me there" button, Instagram-style category circles and a bottom tab bar.

## Do not publish before November 2, 2026

This copy is anonymized: the real hotel, flight times and trip dates were replaced with generic values (the hotel is "Hotel, Stephansplatz"; the days are weekdays without dates). Even so, keep it off the live site until after the trip.

## Files

- `index.html`: the whole app (styles, data, script) in one file. No framework; only the Heebo font from Google Fonts.
- `apple-touch-icon.png`: the red map-pin icon for the iPhone home screen.
- `favicon.png`: the browser tab icon.

## What it does

- **Day plan**: a tentative schedule per day, with a "want something else?" link from each stop to its category. It opens on today's day when a day has a real date.
- **Categories**: seven groups (breakfast, coffee and cake, restaurants, palaces and museums, walks, shopping, evening), sorted by distance from the hotel.
- **Map**: a drawn map of the old town. There is no live location (the first version ran as a Claude artifact, which can't read GPS), so she picks where she is and sees the nearest places in walking minutes. A button opens Google Maps for her real position.
- **Every place**: walking directions in Google Maps, a full-screen "show the driver" card (German name and address, large, plus a walking option), and "read more" with Hebrew text-to-speech that can pause and continue from the sentence where it stopped.

## Constraints that shaped it

- She does not eat meat abroad, but eats cooked fish; her friend eats meat. Every restaurant has both.
- Taxis only, no public transport, so every place has the driver card.
- The last day was a public holiday (shops closed), and the Jewish museum closes early on Friday and all day Saturday, so the plan was ordered around opening hours.

## Where to edit

All content lives in three arrays inside `index.html`: `P` (places), `DAYS` (the plan) and `CATS` (categories).

## Ideas for the case study

- Real user, real problem, built in a few hours, used on the trip. Ask her afterwards what she used and what she ignored.
- Bugs found in testing: the read-aloud fell back to an English voice before Hebrew voices loaded; pausing restarted from the beginning; the time label squeezed the cards.
