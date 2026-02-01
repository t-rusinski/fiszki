# Cloudflare Pages Deployment

Projekt jest automatycznie wdrażany na Cloudflare Pages przy każdym pushu do gałęzi `master`.

## Wymagana konfiguracja GitHub Secrets

Przed uruchomieniem deployment workflow należy skonfigurować następujące sekrety w ustawieniach repozytorium GitHub (Settings → Secrets and variables → Actions):

### Cloudflare

- `CLOUDFLARE_API_TOKEN` - Token API Cloudflare z uprawnieniami:
  - Account → Cloudflare Pages → Edit
  - Account → Cloudflare Pages → Read
  - Zone → Zone → Read (jeśli używasz custom domain)

  Wygeneruj token na: https://dash.cloudflare.com/profile/api-tokens

- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare

  Znajdziesz je w URL dashboard: https://dash.cloudflare.com/{account_id}

- `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu Cloudflare Pages

  Nazwa projektu utworzonego w Cloudflare Pages

### Aplikacja

- `SUPABASE_URL` - URL projektu Supabase
- `SUPABASE_KEY` - Klucz API Supabase (anon/public key)
- `OPENROUTER_API_KEY` - Klucz API OpenRouter

## Wymagana konfiguracja Cloudflare

### 1. Utwórz projekt Cloudflare Pages

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Przejdź do **Workers & Pages**
3. Kliknij **Create application** → **Pages** → **Connect to Git**
4. Wybierz repository (lub pomiń ten krok jeśli konfigurujesz manual deployment)
5. Ustaw nazwę projektu (ta sama co w `CLOUDFLARE_PROJECT_NAME`)

### 2. Skonfiguruj zmienne środowiskowe w Cloudflare

W ustawieniach projektu Cloudflare Pages (Settings → Environment variables) dodaj:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENROUTER_API_KEY`

**Ważne:** Ustaw te zmienne zarówno dla środowiska **Production** jak i **Preview**.

### 3. Skonfiguruj KV Namespace (opcjonalne - dla sesji)

Jeśli aplikacja używa sesji:

1. Utwórz KV Namespace:
   - Workers & Pages → KV
   - Create namespace
   - Nazwij namespace np. `fiszki-sessions`

2. Powiąż namespace z projektem:
   - Settings → Functions → KV namespace bindings
   - Add binding
   - Variable name: `SESSION`
   - KV namespace: wybierz utworzony namespace

### 4. Konfiguracja Build Settings

Upewnij się, że w projekcie Cloudflare Pages ustawione są:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (lub pozostaw puste)

## Workflow

### Master Branch Deployment

Workflow `.github/workflows/master.yml` wykonuje:

1. **Lint** - Sprawdzenie jakości kodu (ESLint)
2. **Unit Tests** - Uruchomienie testów jednostkowych z coverage
3. **Build** - Build aplikacji dla Cloudflare
4. **Deploy** - Deployment na Cloudflare Pages

Deployment jest wykonywany automatycznie po każdym pushu do `master`.

### Manual Deployment

Możesz również uruchomić deployment ręcznie:

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Wybierz workflow **Deploy to Cloudflare Pages**
3. Kliknij **Run workflow**
4. Wybierz branch `master`
5. Kliknij **Run workflow**

## Weryfikacja Deployment

Po zakończeniu workflow:

1. URL deployment zostanie wyświetlony w logach w kroku "Output deployment URL"
2. Deployment będzie widoczny również w GitHub Deployments
3. Możesz sprawdzić status w Cloudflare Dashboard → Workers & Pages → [nazwa projektu]

## Troubleshooting

### Build fails z błędem "Invalid binding `SESSION`"

Oznacza to, że aplikacja wymaga KV namespace dla sesji. Wykonaj krok 3 z sekcji "Wymagana konfiguracja Cloudflare".

### Environment variables nie działają

Upewnij się, że:
- Zmienne są ustawione zarówno w GitHub Secrets jak i Cloudflare Environment Variables
- Zmienne w Cloudflare są ustawione dla odpowiedniego środowiska (Production/Preview)
- Nazwy zmiennych są identyczne w obu miejscach

### Deployment succeeds ale aplikacja nie działa

1. Sprawdź logi w Cloudflare Dashboard → Workers & Pages → [projekt] → Logs
2. Upewnij się, że wszystkie zmienne środowiskowe są poprawnie skonfigurowane
3. Sprawdź czy adapter Cloudflare jest poprawnie skonfigurowany w `astro.config.mjs`

## Dokumentacja

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler Action](https://github.com/cloudflare/wrangler-action)
