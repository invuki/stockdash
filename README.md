# Stock Performance Dashboard

A React and TypeScript dashboard that turns stock quote API responses into an interactive S&P 100 market overview. The project demonstrates API integration, data validation and transformation, responsive data presentation, and resilient loading and error states.

## Skills demonstrated

### API handling

- Provides a `/api/quotes` endpoint that requests stock snapshots and daily bars from Alpaca's IEX feed.
- Keeps Alpaca credentials on the server rather than exposing them to browser code.
- Validates upstream payloads and reports API, network, and invalid-response errors.
- Uses a short server-side cache and returns deterministic mock quotes when Alpaca credentials are not configured.

### Data display

- Presents advancing stocks, the top gainer, and the average daily change in a market summary.
- Highlights the top three performers and updates the ranking when the selected change metric changes.
- Lets users search by ticker or company and sort by one-, three-, or seven-day change in dollars or percent, as well as price, company, and volume.
- Adapts the stock list between a desktop table and mobile cards, with dark and light themes.

### Loading and error handling

- Shows skeleton placeholders while data is first loading and during manual refresh.
- Automatically refreshes quotes every 30 seconds; the manual refresh button has a 30-second cooldown.
- Retains the last successful data if a background refresh fails and displays an error message.
- Cancels obsolete requests and validates API responses before using them in the interface.

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Without Alpaca credentials, the local API serves mock data. To use Alpaca, copy `.env.example` to `.env.local` and set `ALPACA_API_KEY` and `ALPACA_API_SECRET`. Keep `.env.local` private; it is ignored by Git.

## Scripts

```bash
npm run dev    # Start the Vite development server
npm run build  # Type-check and create a production build
npm run lint   # Lint the project
npm run preview # Preview the production build locally
```

## Project structure

- `src/` — React interface, stock data hook, components, and styles.
- `src/data/sp100.ts` — S&P 100 symbol and company-name list.
- `api/quotes.ts` — Quote API handler and Alpaca data mapping.
- `vite.config.ts` — Local development middleware for `/api/quotes`.

Quotes use Alpaca's IEX feed and may differ from consolidated market data. This dashboard is for demonstration purposes and is not investment advice.
