Jestes specjalista Github Actions w srodowisku @.ai/tech-stack.md @package.json

utworz scenariusz "pull-request.yml" powinen dzialac nastepujaco:

- lintowanie kodu,
- nastepnie dwa rownolegle -unit-test i e2e-test
- finalnie -status-comment (komentarz do PRa o statusie całości

Dodatkowe uwagi:
-status-comment uruchamia sie tylko kiedy zestaw 3 poprzednich kroków zakonczyl sie sukcesem
- w e2e pobieraj przegladarki w @playwright.config.ts
- w e2e ustaw środowisko "integration" i zmienne z zekretów w @.env.example
- zbieraj coverage unit testow i testow e2e