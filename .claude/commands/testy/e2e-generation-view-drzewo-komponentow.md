Oto drzewo komponentów ASCII dla GenerationView.tsx:

GenerationView                                                                                                                                                                                                                      │
├─── <div> (Success Message)                                                                                                                                                                                                      
│    └─── <svg> (check icon - inline)                                                                                                                                                                                             
│
├─── <div> (Error Message)
│    └─── <svg> (alert icon - inline)
│         └─── <button> (Zamknij)
│
├─── GenerationForm
│    ├─── <select> (model selection)
│    │    ├─── <optgroup> "Darmowe modele"
│    │    │    └─── <option> (x7)
│    │    └─── <optgroup> "Płatne modele"
│    │         └─── <option> (x6)
│    ├─── <textarea> (source text input)
│    └─── <div> (action buttons)
│         ├─── Button "Generuj fiszki" (submit)
│         └─── Button "Wyczyść" (outline variant)
│
├─── LoadingState (conditional: when generating)
│    ├─── Loader2 (lucide-react icon - animated)
│    └─── <button> "Anuluj" (optional)
│
└─── SuggestionsList (conditional: when reviewing)
├─── SuggestionCard (multiple items in grid)
│    │
│    ├─── (View Mode)
│    │    ├─── <input type="checkbox">
│    │    ├─── <div> (front text)
│    │    ├─── <div> (back text)
│    │    ├─── <span> "Edytowane" badge (conditional)
│    │    └─── <div> (actions)
│    │         ├─── Button "Edytuj" (outline + Pencil icon)
│    │         └─── Button "Odrzuć" (destructive + X icon)
│    │
│    └─── (Edit Mode)
│         ├─── <textarea> (edit front)
│         ├─── <textarea> (edit back)
│         └─── <div> (edit actions)
│              ├─── Button "Anuluj" (outline)
│              └─── Button "Zapisz"
│
└─── BulkActions (sticky footer)
├─── <div> (selection counter)
└─── <div> (action buttons)
├─── Button "Zapisz wszystkie" (outline)
└─── Button "Zapisz zaznaczone"

Legenda:
- GenerationView - główny kontener widoku (src/components/generation/GenerationView.tsx:9)
- GenerationForm - formularz do wprowadzania tekstu i wyboru modelu (GenerationForm.tsx:34)
- LoadingState - wskaźnik ładowania podczas generowania (LoadingState.tsx:9)
- SuggestionsList - lista propozycji fiszek z AI (SuggestionsList.tsx:19)
- SuggestionCard - pojedyncza karta fiszki (SuggestionCard.tsx:19)
- BulkActions - pasek akcji zbiorczych (BulkActions.tsx:11)
- Button - komponent UI z shadcn/ui
- Card - komponent UI z shadcn/ui
- Loader2, Pencil, X - ikony z lucide-react
