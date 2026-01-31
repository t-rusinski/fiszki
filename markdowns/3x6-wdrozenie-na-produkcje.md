---
title: "[3x6] Wdrożenie na produkcję"
course: "10xdevs-2"
source: "Przeprogramowani.pl"
exported: "2026-01-14"
format: "markdown"
---

![Ilustracja z lekcji](https://assets-v2.circle.so/zc82lsojqlczz3ng79fcf4yt3lyg)

## Wprowadzenie

W tej lekcji rozwijany przez ciebie projekt ma szansę trafić na produkcję. Nie zależy nam jednak na szybkim i niestarannym wypchnięciu kilku plików na serwer (#umniedziała), ale wypracowaniu procesu biorącego pod uwagę skalowanie zespołu i wymagania biznesu.

AI pomoże zbudować niezbędny tooling, a także dobrać odpowiednie podejście co do samego wdrożenia. Zaprezentujemy je w dwóch podejściach - jedno szybkie, dopasowane do Astro i 10xCards, a drugie, oparte o Dockera i GitHub Packages, bardziej uniwersalne i niezależne od stacku technicznego.

**👉 Wybierz najlepsze fragmenty:** Ze względu na omówienie dwóch wariantów całego procesu, do tej lekcji możesz podejść na dwa sposoby (resztę traktuj jako materiał opcjonalny):

- **“Regular” pod Astro i 10xCards:** Analiza deploymentu + Deployment Cloudflare
- **“Full opcja”:** Feature flagi → Analiza deploymentu → deployment Cloudflare / Docker

---

**🎖️ Certyfikacja:** Publikacja aplikacji nie jest wymagana do uzyskania certyfikatu głównej ścieżki 10xDevs - najważniejsze kryterium to z repozytorium na GitHubie oraz udokumentowania postępów rozwijania funkcjonalności i logiki biznesowej ✅

Publikacja aplikacji jest wyzwaniem dla ambitnych programistów którzy są w stanie połączyć kod aplikacji z docelową infrastrukturą. Ten krok, wraz z innymi autorskimi rozwiązaniami, może pomóc w uzyskaniu **certyfikatu z wyróżnieniem**. To potwierdzenie ukończenia pełnej ścieżki rozwijania projektu przy wsparciu AI z 10xDevs, od planowania aż po wdrożenie 🤖.

## Feature flagi - bezpieczna produkcja

Na start przyjrzymy się kluczowej koncepcji nowoczesnego procesu wytwarzania oprogramowania - różnicy między deploymentem a releasem oraz temu, jak tzw. [feature toggle](https://martinfowler.com/articles/feature-toggles.html) mogą zmienić sposób, w jaki udostępniasz funkcjonalności użytkownikom.

W świecie ciągłej integracji i dostarczania (CI/CD), te pojęcia często są mylone, ale ich rozróżnienie ma fundamentalne znaczenie dla efektywnego zarządzania ryzykiem i kontroli nad tym, co i kiedy trafia do rąk użytkowników. Na czym polega różnica?

**Deployment** to proces techniczny - umieszczenie nowego kodu na serwerze produkcyjnym. 

**Release** to decyzja biznesowa - udostępnienie danej funkcjonalności użytkownikom.

Z technicznego punktu widzenia, łatwość wdrażania kodu na produkcję (deployment) to stan oczekiwany, a nawet wymarzony - team działa sprawnie, procesy są lekkie, rollbacki łatwe a zgoda managera nie jest wymagana do zamknięcia ticketu. Release to inna bajka - biznes chce mieć kontrolę nad usystematyzowanym “otwieraniem” nowych elementów produktu, przygotowując odpowiednie materiały treningowe czy kampanie marketingowe.

Jedno z drugim powinno działać niezależnie, szczególnie kiedy aplikacja jest już na produkcji, a zespół nie chce utrzymać tzw. długożyjących branchy (problem z integrowaniem kodu od wielu programistów).

Ale jak to osiągnąć? **Feature toggle** (przełączniki funkcjonalności) pozwalają oddzielić te dwa procesy, dając większą elastyczność zarówno programistom jak i biznesowi.

W pierwszym klipie tej lekcji pokażę ci, jak implementuję tę koncepcję w aplikacji 10xRules przy pomocy edytora Cursor. Zobaczysz krok po kroku, jak projektować i wdrażać własny moduł do zarządzania ”flagami”, który umożliwi Ci bezpieczne wdrażanie niedokończonego kodu na produkcję i sterowanie stanem aplikacji między środowiskami. Na start nie musi to być SaaS, a prosty moduł w jednym pliku.

W przyszłości zaprezentowane podejście może być rozszerzone, a flagi pobierane z serwera zdalnego, niezależnego od samej aplikacji. Dzięki temu uzyskujesz możliwość natychmiastowego wyłączania problematycznych funkcji bez konieczności wycofywania całego deploymentu, co bywa procesem angażującym dużą część zespołu. 

**👉 Komentarz** \- poniższy fragment to etap wyłącznie dla istniejących projektów takich jak 10xRules, gdzie pojawia się faktyczna potrzeba rozdzielania deploymentu i release’ów. Jeśli feature flagi nie są dla ciebie niezbędne a projekt chcesz wystrzelić w stronę produkcji, możesz przejść do kolejnej sekcji.

🎥 **VIDEO**: [Watch here](https://player.vimeo.com/video/1073916093?app_id=122963&byline=0&badge=0&portrait=0&title=0)

W filmie pracę rozpoczynam od następującego prompta:

Prompt [Projektowanie Systemu Feature Flags](https://10xrules.ai/prompts?org=10xdevs&collection=m3-prod&segment=l6-deploy&prompt=331a5467-84a2-4114-8d6d-63277e4e2840).

Dwa słowa komentarza już po nagraniu - wdrażając tę zmianę, zdecydowałem się na korektę podejścia do wartości domyślnych. Zwracanie “local” mogłoby powodować, że błędnie skonfigurowane środowisko uzyskało by setup lokalny, a tam mamy zwykle wszystko włączone. Zamiast tego przeszedłem na obsługę nulla - taka wartość “enva” automatycznie przestawia flagę na false:

![Ilustracja z lekcji](https://assets-v2.circle.so/9xs88sppr9yk74pwdj68j53cnf2d)

Do tego, w buildzie produkcyjnym dostosowałem jeszcze “ENV\_NAME” biorąc pod uwagę wymagania samego Astro i Vite:

![Ilustracja z lekcji](https://assets-v2.circle.so/q6cjsykhnoei0x4t0wiyatn72a0r)

W kontekście filmu, aby zabezpieczenie komponentów client-side w React działało również na produkcji, rozszerzyłem zmienną ENV\_NAME o nowy prefix - PUBLIC\_:

```
// .env.example (oraz .env.prod, .env.integration, etc.)
PUBLIC_ENV_NAME=###
```

Dla wygody zdecydowałem się też odwrócić relację środowisk i flag - teraz nadrzędne są “envy”, a flagi konfiguruję pod nimi (na filmie rozpocząłem odwrotnie ale po czasie nie było to optymalne):

```
const featureFlags: FeatureConfig = {
  local: {
    auth: false,
    collections: false,
  },
  integration: {
    auth: true,
    collections: true,
  },
  prod: {
    auth: false,
    collections: false,
  },
};
```

Tak skonfigurowane flagi pozwoliły mi tymczasowo ukryć release logowania i kolekcji (powód wyjaśniam na filmie), ale sam deployment produkcyjny jest jak najbardziej możliwy. Do dzieła!

## Analiza

Przygotowanie do produkcyjnego wdrożenia rozpoczniemy od analizy dostępnych usług, na których może działać nasza aplikacja. W każdym stacku technicznym te sugestie będą nieco inne, ale przygotowany prompt pozwoli ci oszczędzić czas na przeglądanie i porównywanie stron dostawców.

Poza samymi technologiami ważny będzie również kontekst - w końcu czym innym jest nowy, hobbystyczny projekt do portfolio, a czym innym pierwszy krok do prawdziwego biznesu. Czym innym będzie projekt prywatny, rozwijany na własne potrzeby, a czym innym rozwijany w większym ekosystemie.

Zobaczmy jak z tym problemem poradził sobie Gemini 2.5 Pro, którego wybrałem z powodu najdalej posuniętego cutoff date, czyli granicy danych treningowych (styczeń 2025).

🎥 **VIDEO**: [Watch here](https://player.vimeo.com/video/1073915945?app_id=122963&byline=0&badge=0&portrait=0&title=0)

**👉 Zaktualizuj dokumentację** \- Uzyskana analiza i docelowa platforma / forma hostingu powinna stać się teraz częścią dokumentacji README / tech-stack.md (Deployments & Releases).

Jeśli zależy ci wdrożeniu projektu-hobby, każde z “top 3” będzie odpowiednie - z wykorzystaniem tzw. Adapterów, zarówno Vercel, Netlify jak i Cloudflare Pages chętnie przyjmą twój projekt w Astro. Jeśli jednak planujesz działania komercyjne, to Vercel - wg oficjalnej polityki (kwiecień 2025) - będzie wymagał subskrypcji płatnej.

Prompt z filmu znajdziesz poniżej:

[hosting-analysis.pl.md](https://assets-v2.circle.so/knhi1djtgexm3qbd6vchxfhzzad5)

Wersja w języku angielskim:

[hosting-analysis.md](https://assets-v2.circle.so/djyjq969mb5nx4nlknhc5zi26x6k)

### Pierwsze kroki z Cloudflare

Jeśli chcesz korzystać z Cloudflare, na start załóż darmowe konto - <https://pages.cloudflare.com/>

Po założeniu konta, w sekcji “Workers & Pages” utwórz nowy projekt poprzez “Create”:

![Ilustracja z lekcji](https://assets-v2.circle.so/pfglxqu1xicluorv93q7ayh0e73l)

Przejdź do zakładki “Pages”, następnie dodaj uprawnienia do twojego konta GitHub i wybierz projekt rozwijany w 10xDevs:

![Ilustracja z lekcji](https://assets-v2.circle.so/j12jz7g6400ri2otiivqvb5xgq0a)

Dla ułatwienia dalszej konfiguracji, możesz wybrać “Framework preset” i od razu dodać zmienne środowiskowe, które będą wymagane w twojej aplikacji:

![Ilustracja z lekcji](https://assets-v2.circle.so/gtxqyzwi4lynxlc3bh7nr18lbhft)

Jeśli w ramach projektu chcesz również tworzyć środowiska preview pod Pull Requesty wymagające odrębnej konfiguracji, wejdź do sekcji Settings (1), przejdź na środowisko Preview (2) i w sekcji “**Variables and Secrets”** ustaw odpowiednie zmienne środowiskowe.

![Ilustracja z lekcji](https://assets-v2.circle.so/1l6gs1mzezmrjeml3g7toyqzqzi5)

Przechodząc w pełni na kontrolowane deploymenty z poziomu GHA i Cloudflare API, wyłącz automatyzację poprzez Branch Control (1) oraz ustawienia dla mastera (2) i preview (3).

**👉 Ważne:** Jeśli na start pozostajesz z domyślną konfiguracją i automatycznymi deploymentami po wrzuceniu zmian na mastera, poniższy krok możesz pominąć. Dopiero przejście na kontrolowane scenariusze z GHA wymusza potrzebę tej zmiany - możesz to zrobić w momencie, kiedy automatyczne wdrożenia zadziałają, a ty zobaczysz aplikację na produkcji.

![Ilustracja z lekcji](https://assets-v2.circle.so/i22mh4zbiiik7h5fzdxd0nbtozqa)

## Wdrożenie Astro na Cloudflare Pages

W kolejnym filmie poznasz sposób na przygotowanie zarówno projektu, jak i scenariusza CI/CD pod produkcyjne wdrożenia z brancha master:

🎥 **VIDEO**: [Watch here](https://player.vimeo.com/video/1074082406?app_id=122963&byline=0&badge=0&portrait=0&title=0)

Wykorzystane reguły z rozbudowanymi narzędziami do akcji znajdziesz poniżej:

[github-action.mdc](https://assets-v2.circle.so/c9wgomk66uswtfbbqf4a41z4r624)

Bazowy prompt możesz dostosować do swoich potrzeb:

Prompt [Konfiguracja Deploymentu Cloudflare Pages](https://10xrules.ai/prompts?org=10xdevs&collection=m3-prod&segment=l6-deploy&prompt=0d6b5d9d-334e-4e95-b3a1-66f70f9a0c2b).

**👉 Ważne:** [Cloudflare i jego funkcje serverless](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#environment-variables-and-secrets) podchodzą nieco inaczej do wstrzykiwania i odczytywania zmiennych środowiskowych (np. w kliencie Supabase i modułach server-side).

![Ilustracja z lekcji](https://assets-v2.circle.so/gzqe50efr5bra94h6bntw8poepw4)

Aby zapobiec problemom, możesz wykorzystać moduł astro:env który wprowadza bezpieczny sposób odczytywania zmiennych już po wdrożeniu na serwer produkcyjny:

<https://docs.astro.build/en/guides/environment-variables/#variable-types>

### Node.js vs Cloudflare Runtime

Aplikacje Astro wykorzystujące adapter Cloudflare wdrażane są w modelu serverless - oznacza to, że każdy endpoint backendowy działa jak niezależna mikro-aplikacja bez współdzielonego serwera czy systemu plików. To istotna różnica, którą warto brać pod uwagę względem środowiska lokalnego.

Środowiskiem uruchomieniowym na produkcji **nie jest pełny Node.js**, a tzw. **Workers Runtime**. Jest to środowisko, którego kompatybilność z Node [stopniowo rośnie](https://developers.cloudflare.com/workers/runtime-apis/nodejs/#supported-nodejs-apis), ale niektóre różnice utrzymywane są celowo - przykładowo, zależność na system plików, dostęp do stanu globalnego czy czytanie zmiennych z “process.env”. Każdy z tych elementów ma swoje zalety, ale w modelu Cloudflare ogranicza skalowanie i globalną dystrybucję aplikacji. Włączenie tych elementów jest możliwe, ale wymaga dodatkowego ustawienia (tzw. [compatibility flags](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)).

Jeśli twój projekt nie wymaga zależności na stan serwera, system plików czy współdzielone procesy między funkcjami, to nie musisz niczego zmieniać. Jeśli jednak zauważysz taką potrzebę, lub będzie jej wymagać jedna z zależności całego projektu, to możesz ją włączyć w zakładce “Settings → Runtime”:

![Ilustracja z lekcji](https://assets-v2.circle.so/3au3gxiaxav7w3u2zxt2dngwc2xm)

W tym miejscu dodaj flagę “**nodejs\_compat**” oraz wybierz preferowaną datę/wersję środowiska (_Compatibility date_) - Cloudflare wersjonuje kolejne zmiany środowiska tak, aby nie popsuć wdrożonych wcześniej aplikacji. W świeżych projektach możesz po prostu wybrać najnowszą możliwą opcję.

A dlaczego nie jest to włączone domyślnie? Całość działa podobnie do tzw. [polyfilli](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill) w środowisku przeglądarki - każda dodatkowa funkcja lub moduł zapewniający kompatybilność to pewien narzut na czas startu i rozmiar funkcji. Cloudflare preferuje podejście _serverless_, więc unika dodawania elementów, które łamią ten bezstanowy model działania aplikacji.

Jeśli potrzebujesz klasycznego stanowego backendu a nie chcesz zmieniać hostingu, już wkrótce na Cloudflare pojawi się możliwość wykorzystywania konteneryzacji ([więcej tutaj](https://blog.cloudflare.com/cloudflare-containers-coming-2025/)). Alternatywą jest klasyczne wdrożenie oparte o _Dockera_, opisywane w dalszej części lekcji.

### Debugowanie Cloudflare Functions

Jeśli w trakcie wdrożenia napotkasz problemy z ładowaniem strony, do zidentyfikowania problemu wykorzystaj podgląd logów Cloudflare Functions w zakładce Deployments → Functions. 

Przedstawiamy tę funkcję na krótkim klipie poniżej:

🎥 **VIDEO**: [Watch here](https://player.vimeo.com/video/1081400489?app_id=122963&byline=0&badge=0&portrait=0&title=0)

## Wdrożenia z Dockerem

[Docker](https://www.docker.com/) (i jego alternatywy jak [Podman](https://podman.io/)) to sprawdzony sposób na ujednolicenie procesu wdrażania aplikacji poprzez tzw. konteneryzację.

Konteneryzacja rozwiązuje problem “u mnie działa” poprzez tworzenie spójnego środowiska uruchomieniowego niezależnego od infrastruktury hostującej. Kluczowe elementy tego procesu to:

1. Dockerfile - plik konfiguracyjny definiujący jak zbudować obraz
2. Obrazy (images) - niezmienne szablony zawierające kod, runtime, biblioteki i zależności
3. Kontenery - uruchomione instancje obrazów, izolowane od siebie i od systemu hosta

W procesie wdrażania, deweloperzy tworzą obraz, publikują go w rejestrze (np. GitHub Container Registry, Docker Hub lub rejestr prywatny), a następnie pobierają i uruchamiają na serwerach produkcyjnych. Można to zautomatyzować za pomocą systemów CI/CD.

Do rozpoczęcia procesu wdrażania aplikacji z Dockerem będziemy potrzebowali obrazu dopasowanego do stacku technicznego. Proces generowania zobaczysz poniżej:

🎥 **VIDEO**: [Watch here](https://player.vimeo.com/video/1074259992?app_id=122963&byline=0&badge=0&portrait=0&title=0)

W procesie wykorzystałem Gemini 2.5 Pro oraz poniższy prompt:

[docker-builder.md](https://assets-v2.circle.so/vn5emaf449vesn4komyu5yyoypqd)

Wykorzystywane reguły (dostosuj zawartość do swojego kontekstu):

[docker.mdc](https://assets-v2.circle.so/9nz9icefek47q83ghshwv11phkoh)

### 💬 Komentarz do zmiennych i konfiguracji

W poprzednich lekcjach korzystaliśmy z pliku “.env” oraz “.env.test” - czy w tej lekcji w obrazie powinniśmy umieszczać “.env.prod”? Nie!

Chociaż to najłatwiejsza opcja skonfigurowania aplikacji, to sekrety w pliku pozostaną w tym kontenerze już na stałe. Zdecydowanie bezpieczniejszą opcją będzie albo wykorzystanie zewnętrznego dostawcy sekretów (np. Vault / [OpenBao](https://openbao.org/)) lub właśnie - tak jak na filmie - podawanie sekretów z poziomu parametrów, na czas builda i uruchamiania obrazu.

Hostując aplikację na Digital Ocean platforma wykona za nas automatyczne przekazanie zmiennych środowiskowych tak jak robiliśmy to lokalnie poprzez “docker run -e …”.

### Wdrożenie na Digital Ocean

Jedną z potencjalnych platform, na których w łatwy sposób umieścisz przygotowany kontener, jest [Digital Ocean](https://www.digitalocean.com/). Projekty tworzone na tej platformie mogą bazować na kontenerach umieszczanych na tzw. [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), a cały proces można opakować w jeden scenariusz CI/CD.

Będzie on rozdzielony na trzy etapy:

1) Etap QA - Ogólna ocena jakości brancha master (lint, unit test)

2) Przygotowanie kontenera i opublikowanie go na GHCR.io

3) Request w kierunku DigitalOcean API aby pobrać kontener i wykonać nowy Deployment

![Ilustracja z lekcji](https://assets-v2.circle.so/2asp48j9tzvct4pyz2ksi8x71ohv)

W tym celu będziemy potrzebować nowego scenariusza:

Prompt [Pipeline Deploymentu Docker DigitalOcean](https://10xrules.ai/prompts?org=10xdevs&collection=m3-prod&segment=l6-deploy&prompt=ca4d09a8-2a85-439d-84ef-1eb2e855a5ff).

Po odpowiedzi na pytania (głównie w kontekście sekretów) musiałem poprawić jedną z akcji:

Prompt [Naprawa Wersji GitHub Action](https://10xrules.ai/prompts?org=10xdevs&collection=m3-prod&segment=l6-deploy&prompt=5bfa1be4-af8b-410e-b864-cef7f56bd101).

Instrukcje i odpowiedzi z Github API pozwoliły wymienić akcję na [**digitalocean/action-doctl@v2**](https://github.com/digitalocean/action-doctl):

![Ilustracja z lekcji](https://assets-v2.circle.so/o41clhzlem62z2tht6y25cnn1t33)

Uzyskany scenariusz możesz wykorzystać w swojej aplikacji (pierwsze uruchomienie opublikuje kontener na GHCR ale Deployment nie zadziała - do tego potrzebujesz konfiguracji opisanej poniżej):

[master-docker.yml](https://assets-v2.circle.so/lqaz0oy31tw878sub4ukgnarjj50)

### Nowy projekt i konfiguracja Digital Ocean

Proces wymaga nowych sekretów na GitHubie pod środowisko “production” - po założeniu konta na DigitalOcean wygenerujesz [TOKEN pod tym linkiem](https://cloud.digitalocean.com/account/api/tokens):

```
DIGITALOCEAN_ACCESS_TOKEN
DIGITALOCEAN_APP_ID (wartość z URLa projektu)
```

A jak utworzyć sam projekt? Skorzystaj z App Platform:

![Ilustracja z lekcji](https://assets-v2.circle.so/n4nqyw9nivscwy8pyxj7irfa8qgy)

W konfiguracji podaj właściwy klucz kontenera APP\_OWNER/APP\_NAME:

![Ilustracja z lekcji](https://assets-v2.circle.so/kg8833naozjc5898qqf13cb8kjjr)

Na start możesz wybrać najmniejszą instancję (niestety nie ma opcji darmowych) - na tym samym widoku możesz również dodać zmienne środowiskowe (nieco niżej).

![Ilustracja z lekcji](https://assets-v2.circle.so/2jf3xmnwjjfvvxdmoalygigbds4y)

Jeśli konfiguracja obrazu, scenariusza CI/CD i samej aplikacji przebiegła poprawnie, już teraz możesz testować aplikację na produkcji! To naprawdę konkretne wyzwanie, które realizujesz w 10xDevs 🔥

![Ilustracja z lekcji](https://assets-v2.circle.so/z0l03exb14ukkms77bkv1fgmx1mr)

## 🏁 Podsumowanie lekcji

Gratulacje!

Ten etap kończy pierwszą połowę szkolenia 10xDevs o kryptonimie “greenfield”, a także proces budowania full-stackowej aplikacji webowej przy współpracy z Agentem AI 🤖

Było naprawdę intensywnie - na tym etapie aplikacja to już nie tylko kod, ale infrastruktura, wiele środowisk, zarządzanie sekretami oraz proces wdrożeń z CI/CD - prawdziwa rakieta! 🚀

Trzymamy kciuki za realizację projektów w oparciu o materiały z lekcji, a w razie pytań czekamy na wątki w sekcji [#Dyskusje - praktyka \[10X\]](https://bravecourses.circle.so/c/watki-dotyczace-lekcji-i-cwiczen) \- przed nami kolejne moduły - LEGACY & INNOVATE!

## Ćwiczenia praktyczne

### **Zadanie 1: Master Branch Workflow**

**Cel:** Wprowadzenie finalnego potwierdzenia jakości brancha master przed wdrożeniem na produkcję

**Instrukcje:** Wprowadź nowy scenariusz CI/CD rozwijając go na branchu master, w pliku .github/workflow/master.yml

1. Reaguj na nowe zmiany na branchu master
2. Wykonaj podstawową ocenę jakości - linting i unit testy (pomiń E2E i czyszczenie produkcji 😅)
3. Dla chętnych - rozważ wydzielenie wspólnych etapów z master.yml i pull-request.yml do reużywalnych [Composite Actions](https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action).

### 🎖️ **Zadanie 2: Opublikuj aplikację LIVE!**

**Cel:** Wykonaj produkcyjne wdrożenie aplikacji realizowanej w trakcie 10xDevs 🚀

**Instrukcje:** Rozbuduj scenariusz .github/workflow/master.yml w sposób dopasowany do twojego stacku technicznego i typu projektu.

1. Dla projektów Astro - wykorzystaj popularne chmury frontendowe (FREE)
2. Dla stacków “non-Astro” - przeprowadź deployment na wybrany hosting dopasowany do stacku (np. w oparciu o DigitalOcean i Dockera, lub własny serwer aplikacji).
![Ilustracja z lekcji](https://assets-v2.circle.so/ekrtcr8j44qd531ut1i2iwox5c9h)