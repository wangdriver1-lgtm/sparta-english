# SPARTA English

A complete static English training website for GitHub Pages. Learners' records stay in their own browser. No backend, paid API key, or server account is required.

## Features

- Four progressive courses with reading, browser speech playback, daily original workplace cloze exercises and explanations.
- Six different study days in a Monday–Sunday week, counted in Asia/Taipei, plus a passed lesson (2/3), unlock the next course. Maximum one advancement per week. Opening the site automatically records the day's local check-in.
- Six curated workplace words rotate daily; up to two additional words are extracted from current BBC Business headlines and verified by Free Dictionary API. The 78-word workplace collection repeats every 13 days for review.
- Daily news reading prompts, source links, date labels, vocabulary quizzes and saved words.
- Warm, light and night themes, larger text, focus timer, responsive layouts and keyboard-accessible dialogs.
- Export and merge JSON progress backups. Different people should use their own browser profiles. Clearing site data, changing the website origin, private browsing or using another browser starts a separate record unless a backup is imported.

This is a personal habit tracker. Local records and the device clock can be edited; there is no secure authentication or anti-cheating enforcement. No learner progress is sent to GitHub or included in the repository.

## Publish to GitHub

1. Create a **public** repository under `wangdriver1-lgtm`, for example `sparta-english`. Upload the contents of **this directory** to its root on the `main` branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. Run **Actions → Update lessons and publish Pages → Run workflow**. The workflow installs dependencies, fetches content, runs tests, builds and deploys.
4. The workflow reports the deployed URL. For a repository called `sparta-english`, the expected address is `https://wangdriver1-lgtm.github.io/sparta-english/`; it is live only after a successful Pages deployment.

`base: './'` in `vite.config.ts` supports both repository Pages and a root `username.github.io` repository. The workflow needs permission to write contents and deploy Pages; it declares these scopes. A repository or organisation policy may restrict them.

## Daily updates

`.github/workflows/publish.yml` runs daily at **23:37 Asia/Taipei** (15:37 UTC). It prepares dated sets for today and tomorrow, commits `public/data/daily.json`, builds and publishes the site. GitHub schedules can run late; preparing tomorrow's set in advance reduces midnight gaps. Inactive public repositories can have scheduled workflows disabled by GitHub; inspect the Actions tab if updates stop.

The browser checks the date every 30 seconds and when the page regains visibility, switches to the dated set, and records the new study day. If a scheduled snapshot is missing, six workplace words still rotate using the local date. News availability is clearly marked. Source failures preserve an existing same-date news snapshot; otherwise a partial dated set is published. Future runs retry automatically. No official exam questions are scraped.

## Sources

- BBC Business RSS: https://feeds.bbci.co.uk/news/business/rss.xml (headlines and source links only)
- Free Dictionary API: https://dictionaryapi.dev/ (verified news-word definitions)
- ETS official TOEIC information: https://www.ets.org/toeic/about/listening-reading.html (daily connectivity check and source link)

Exercises and workplace examples are independently authored. TOEIC® is an ETS trademark; this project is not affiliated with ETS. Speech playback uses the browser/operating system's available voices and may not work in every browser.

## Development

Use Node.js 24 and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm update-content
pnpm test
pnpm dev
pnpm build
```

The generated website is `dist/`. Development runs at `http://127.0.0.1:5173/`. Refreshing content is a Node task; it does not depend on browser CORS access to news providers.
