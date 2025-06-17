# Surveasy - Kandidaat Analyse Prototype

Surveasy is een front-end-only prototype applicatie ontworpen om sollicitaties te analyseren. Het extraheert en rangschikt relevante vaardigheden op basis van het CV (PDF) van een kandidaat en een sollicitatiegesprek (audiobestand). De app helpt gebruikers kandidaten te categoriseren op basis van hoe goed hun vaardigheden overeenkomen met een reeks vooraf gedefinieerde prioriteiten.

**Belangrijk:** Dit is een prototype. Alle verwerking gebeurt lokaal in de browser. Het downloaden van modellen (voor spraakherkenning en NLP) kan de eerste keer traag zijn. De applicatie en de modellen zijn geoptimaliseerd voor de Nederlandse taal.

## Features

*   Uploaden van CV (PDF) en interviewopname (audioformaten zoals MP3, WAV).
*   Automatische transcriptie van het interview (Nederlands).
*   Extractie van vaardigheden uit zowel CV als transcript.
*   Mogelijkheid om prioritaire vaardigheden en hun gewicht in te voeren.
*   Rangschikking van geëxtraheerde vaardigheden op basis van frequentie, bron en prioriteit.
*   Berekening van een matchpercentage met de prioritaire vaardigheden.
*   Categorisering van de kandidaat (bijv. Hooggekwalificeerd, Potentieel, etc.).
*   Alle verwerking gebeurt in de browser (geen backend).

## Tech Stack

*   **Framework:** React (met Vite)
*   **PDF Parsing:** `pdfjs-dist`
*   **Audio Transcriptie:** `Transformers.js` (`Xenova/whisper-small` model)
*   **Natural Language Processing (NLP):** `Transformers.js` (`Xenova/bert-base-multilingual-cased-ner-hrl` model voor Named Entity Recognition)
*   **Taal:** Nederlands

## Setup Instructies

1.  **Download of Clone de Code:**
    *   Zorg ervoor dat je de `surveasy-app` map hebt.
2.  **Navigeer naar de Projectmap:**
    ```bash
    cd pad/naar/surveasy-app
    ```
3.  **Installeer Dependencies:**
    ```bash
    npm install
    ```
4.  **Start de Development Server:**
    ```bash
    npm run dev
    ```
5.  Open de applicatie in je browser (meestal op `http://localhost:5173` of een vergelijkbare URL die in de terminal wordt getoond).

## Gebruiksgids

1.  **CV Uploaden:**
    *   Sleep een PDF-bestand van het CV van de kandidaat naar de "CV Uploaden (PDF)" zone, of klik om een bestand te selecteren.
    *   De geëxtraheerde tekst uit het CV verschijnt in het resultatenpaneel.
2.  **Interview Audio Uploaden:**
    *   Sleep een audiobestand (bijv. MP3, WAV) van het interview naar de "Interview Uploaden (Audio)" zone, of klik om te selecteren.
3.  **Start Transcriptie:**
    *   Klik op de knop "Interview Transcriptie Starten".
    *   Wacht tot de transcriptie voltooid is. Dit kan even duren, vooral de eerste keer dat het model wordt gedownload. De status wordt getoond.
    *   De getranscribeerde tekst verschijnt in het resultatenpaneel.
4.  **Prioritaire Vaardigheden Invoeren:**
    *   In het veld "Prioritaire Vaardigheden", voer een komma-gescheiden lijst van vaardigheden in die belangrijk zijn voor de functie.
    *   Je kunt een gewicht toekennen aan elke vaardigheid met een dubbele punt. Bijvoorbeeld: `javascript:5, react:4, communicatie:3, analytisch denken:2`. Hogere gewichten geven meer belang aan de vaardigheid. Als er geen gewicht wordt opgegeven, wordt een standaardgewicht gebruikt.
5.  **Analyseer Teksten:**
    *   Klik op de knop "Analyseer & Categoriseer".
    *   De applicatie zal nu NLP toepassen om vaardigheden te extraheren, deze te rangschikken, een matchpercentage te berekenen en de kandidaat te categoriseren.
6.  **Resultaten Bekijken:**
    *   In het "Resultaten Overzicht" paneel vind je:
        *   De status van de kandidaat, inclusief matchpercentage en categorie.
        *   Een gerangschikte lijst van alle unieke vaardigheden met hun scores.
        *   Lijsten van automatisch geëxtraheerde vaardigheden (apart voor CV en transcript).
        *   Geëxtraheerde tekst van CV en interview.


## Belangrijke Opmerkingen & Beperkingen

*   **Prototype Status:** Dit is een proof-of-concept. De nauwkeurigheid van transcriptie en vaardigheidsextractie kan variëren.
*   **Prestaties:** Alle verwerking vindt plaats in de browser. Grote bestanden of de eerste keer dat AI-modellen worden geladen, kunnen traag zijn. Zorg voor een stabiele internetverbinding voor het downloaden van de modellen.
*   **Nederlandse Taal:** De applicatie en de gebruikte modellen zijn primair gericht op en getest met Nederlandstalige content.
*   **NLP Model:** Het gebruikte NER-model (`Xenova/bert-base-multilingual-cased-ner-hrl`) is een algemeen meertalig model. Een specifiek op Nederlandse vaardigheden getraind model zou de resultaten kunnen verbeteren.
*   **Vaardigheidsdefinities:** De lijst met trefwoorden (`dutchSkillKeywords`) en de logica voor het herkennen van vaardigheden kunnen verder worden uitgebreid en verfijnd.
```
