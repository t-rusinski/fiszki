Przejdz przez kluczowe komponent powiazane z tym scenariuszem dodajac atrybyty data-test-id o wartosciach dopasowanych do znaczenia danego elementu lub akcji

Scenariusze testowe E2E dla GenerationView
1. Happy Path - Pełny flow generowania i zapisywania fiszek

- Użytkownik otwiera stronę generowania fiszek
- Wybiera model AI z listy (domyślnie: Mistral 7B)
- Wkleja tekst źródłowy (1500 znaków)
- Licznik znaków pokazuje "1500 / 10000" w kolorze zielonym
- Widzi komunikat walidacji "Długość tekstu OK. Możesz wygenerować fiszki."
- Klika przycisk "Generuj fiszki"
- Widzi LoadingState z komunikatem "Generowanie fiszek w toku..."
- Po wygenerowaniu widzi listę 5-10 propozycji fiszek
- Strona automatycznie przewija do sekcji z propozycjami
- Zaznacza 3 fiszki używając checkboxów
- Licznik pokazuje "3 fiszek zaznaczonych"
- Klika "Zapisz zaznaczone (3)"
- Widzi komunikat sukcesu "3 fiszki zostały zapisane pomyślnie!"
- Formularz resetuje się do stanu początkowego

2. Zapisywanie wszystkich fiszek

- Użytkownik generuje fiszki (kroki 1-9 z Happy Path)
- Bez zaznaczania pojedynczych fiszek klika "Zapisz wszystkie (10)"
- Wszystkie fiszki zostają zapisane
- Widzi komunikat sukcesu "10 fiszek zostało zapisanych pomyślnie!"

3. Walidacja - Tekst za krótki

- Użytkownik wkleja tekst 500 znaków
- Licznik pokazuje "500 / 10000" w kolorze czerwonym
- Widzi komunikat "Tekst jest za krótki. Potrzebujesz jeszcze 500 znaków."
- Przycisk "Generuj fiszki" jest zablokowany (disabled)
- Próba wysłania formularza nie powoduje żadnej akcji

4. Walidacja - Tekst za długi

- Użytkownik wkleja tekst 12000 znaków
- Licznik pokazuje "12000 / 10000" w kolorze czerwonym
- Widzi komunikat "Tekst jest za długi. Przekroczono limit o 2000 znaków."
- Przycisk "Generuj fiszki" jest zablokowany


