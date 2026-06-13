<!-- Generated: 2026-06-13T16:13:04.755Z | Subject: sql | Model: claude-sonnet-4-6 -->

# Datenbankmanagement – Komplette Lernnotizen

---

## 1 Grundbegriffe

### 1.1 Beispieldatenbank (ER-Modell)

Das Skript arbeitet durchgehend mit einer Beispieldatenbank aus 3 Tabellen:

**Suppliers** (Händler):
- sno: varchar(8), NOT NULL → Primärschlüssel
- sname: nvarchar(15), Ja (NULL erlaubt)
- status: int, Ja
- city: nvarchar(31), Ja

**Supp_Parts** (Zwischentabelle):
- sno: varchar(8), NOT NULL → zusammengesetzter PK + FK zu Suppliers
- pno: varchar(8), NOT NULL → zusammengesetzter PK + FK zu Parts
- qty: int, Ja

**Parts** (Teile):
- pno: varchar(8), NOT NULL → Primärschlüssel
- pname: nvarchar(55), NOT NULL
- color: nvarchar(8), Ja
- weight: float, Ja
- city: nvarchar(31), Ja

Die drei Tabellen sind miteinander verknüpft: Supp_Parts hat zwei Fremdschlüssel, einen zu Suppliers (über sno) und einen zu Parts (über pno). Das ist eine klassische n:m Auflösung.

### 1.2 Das Datenbanksystem-Modell (Blockdiagramm)

**Das DBS-Blockdiagramm zeigt 6 Ebenen von oben nach unten:**

Das Diagramm ist ein Schichtenmodell. Ganz oben ist die **Benutzungsschnittstelle**, von dort geht es runter durch alle Ebenen bis zur eigentlichen Datenbank.

- **Ebene 1: Benutzungssprache** → Input-/Output-Prozessor → Parser, Autorisierungskontrolle, Pre-Compiler
- **Ebene 2: Anfragebearbeitung** → Integritätsprüfung, Update-Prozessor, Query-Prozessor, Optimierer
- **Ebene 3: Zugriffsstrukturen und Codeerzeugung** → Zugriffsplanerstellung, Codeerzeugung
- **Ebene 4: Synchronisation paralleler Zugriffe** → Transaktionsverwaltung: Scheduler, Recovery-Manager
- **Ebene 5: Hauptspeicherverwaltung** → Buffer-Manager, Data-Manager
- **Ebene 6: Speichergeräteverwaltung** → Data-Dictionary, Datenbank, Datenbank, Log-Buch

Quelle: i.A.a. VOSSEN 2008

---

## 2 Das Relationale Datenmodell

### 2.1 Entwicklung des Modells

**CODD, Edgar F. (Ted) 1970:**
Veröffentlichte "A Relational model of Data for Large Shared Data Banks" in:
- Communications of the ACM, Volume 13, Issue 6 (June 1970), Pages 377-387, ISSN:0001-0782

Kernideen:
- Datensicht als **zweidimensionale Tabelle**
- Basierend auf der **mathematischen Theorie der Relationen und Prädikatenlogik 1. Ordnung**
- Anwendung von systematischen Methoden

Aufbauende Verfahren daraus:
- **Normalisierungstheorie**
- **Relationale Abfragesprache**

### 2.2 Mathematische Grundlage

**Definition (Teil II/IV):**
- Gegeben sind nicht notwendigerweise disjunkte Mengen (Domänen) D1, D2, …, Dn
- **R** wird als Relation auf diesen Mengen bezeichnet, wenn R eine Menge von geordneten n-Tupeln ist, sodass d1 ∈ D1, d2 ∈ D2 und dn ∈ Dn gehört
- Di wird als **Wertebereich** von R bezeichnet
- n wird als **Grad** von R bezeichnet
- Darstellung der Relation erfolgt in Form von Spalten und Zeilen (Tabelle)
- Spalten werden als **Attribute** bezeichnet
- Zeilen bilden die **n-Tupel**

**Definition (Teil III/IV) – Relationenschema:**
- Relationenschema R(A1, A2, ..., An) besteht aus: Relationenname R und Attributliste
- R.Ai = Rollenname (Attribut) A eines bestimmten Wertebereichs D im relationalen Schema R
- Funktion **'dom'** ordnet Attribut Ai Wertebereich Di zu: Di = dom(Ai)
- **Grad** = Anzahl der Attribute (n)
- Beispiel: `Book(ISBN, BuchTitel, Edition)`

**Definition (Teil IV/IV) – Relation r(R):**
- Menge von n-Tupeln: r = {t1, t2, ..., tm}
- **Kardinalität** = Anzahl der Tupel (m)
- n-Tupel: t = (v1, v2, ..., vn): geordnete Liste von n Werten
- Forderung: vi ∈ Di = dom(Ai) oder spezieller Null-Wert
- t[Ai] oder t.Ai: i-ter Wert im Tupel t
- t[X]: Wertekombination bzgl. Attributmenge X des Tupels t
- r(R) ⊆ dom(A1) × dom(A2) × ... × dom(An) = mathematische Relation

#### 2.2.1 Beispiel 1 (Book-Datenbank)

```
A1 = ISBN        D1 = ISBN = {1234, 2234, ...}           D1 = dom(A1)
A2 = BuchTitel   D2 = Titel = {"DBMS", "ORACLE", ...}    D2 = dom(A2)
A3 = Edition     D3 = Edition_Number = {1,2,3,4, ...}    D3 = dom(A3)
```

Relationenschema: `Book(ISBN:ISBN, BuchTitel:Titel, Edition:Edition_Number)`
- Grad = 3
- Book.ISBN, Book.BTitel, Book.Edition sind Attribute von Book

Relation:
- r(Book) = {t1, t2, ..., tm}
- t1 = (1234, "DBMS", 7) → v1 = 1234 ∈ ISBN; v2 = "DBMS" ∈ Titel; v3 = 7 ∈ Edition_Number
- t2 = (2345, "ORACLE", 2) → t2[ISBN] = 2345; t2[BuchTitel] = "ORACLE"; t2[Edition] = 2

#### 2.2.2 Beispiel 2

```
ti ∈ dom(A1) × dom(A2) × dom(A3)
t1 ∈ D1 × D2 × D3
t1 ∈ ISBN × Titel × Edition_Number
r(Book) = {t1, ..., tm} ⊆ ISBN × Titel × Edition_Number
```

### 2.3 Definitionen und Folgerungen

**Definitionen (III/III):**
- Jedes Attribut besitzt einen **eindeutigen Namen**
- Jedes Attribut wird durch seinen Namen **referenziert**
- Attribute unterliegen **keiner Ordnung**
- Attribute in einer Tabelle müssen **atomar** sein
- Jede Zeile in einer Tabelle ist **eindeutig**
- Die **Kardinalität** ist die Anzahl der Zeilen zu einem Zeitpunkt

**Folgerungen – Modellierung von Beziehungen:**
- Wegen der Eindeutigkeit einer Zeile existiert immer ein Schlüssel
- Primärschlüssel dienen zur Modellierung von Beziehungen zwischen Relationen
- Typen:
  - **Primärschlüssel**
  - **Fremdschlüssel**
  - **Zusammengesetzter Primärschlüssel**
  - **Zusammengesetzter Fremdschlüssel**
  - **Schlüsselkandidat**

### 2.4 Relationenschema

**Beispiel FLUGGAST:**

Relationenschema: `FLUGGAST { Nation, PassNr, VName, NName, Titel }`

- Relation: FLUGGAST
- Attribute: Nation, PassNr, Vname, Nname, Titel
- Primärschlüssel: Nation + PassNr (zusammengesetzt)

Die Tabelle FLUGGAST enthält folgende Beispieldaten:

| Nation | PassNr | VName | NName | Titel |
|--------|--------|-------|-------|-------|
| Schweiz | 1234 | Peter | Mair | Dipl.-Ing. |
| Austria | 3198 | Arnold | Egger | (leer) |
| Deutschland | 4545 | Hugo | Faber | (leer) |
| Deutschland | 8713 | Emil | Gartner | Dr. |

---

## 3 SQL-Anweisung

### 3.1 Entwicklungsgeschichte von SQL

- **IBM SEQUEL (Structured English Query Language) 1971** → Prototyp System R
- **Relational Software Inc.** → 1979, kommerzielles System: Oracle V2
- **IBM SQL/DS 1981**
- **ISO-SQL1 (1986, ANSI), (1987, ISO)** → Addendum (1989)
- **ISO-SQL2 (1992)**
- **ISO-SQL3 (1999)**
- **ISO-SQL:2003 (2003)**
- **ISO-SQL:2006 (2006)**

**SQL-Implementierungsmethoden:**
- **Direktes SQL** = SQL-Anweisungen interaktiv
- **Modulsprache** = SQL-Anweisungen in Programmen in getrennter Form
- **Call Level Interface (CLI)** = SQL-Anweisungen eingebettet durch SQL-Implementierung mittels einer Bibliothek für Programmiersprachen
- **Embedded SQL** = SQL-Anweisungen innerhalb der Programmiersprache

**SQL92 – Sprachbestandteile:**
- Befehle zur Definition des Datenbankschemas → **Data Definition Language (DDL)**
- Befehle zur Datenmanipulation (Projektion, Abfrage, Ändern, Einfügen, Löschen) → **Data Manipulation Language (DML)**
- Befehle für die Rechteverwaltung → **Data Control Language (DCL)**

**SQL92 – Neue Features:**
- Erweiterte Datentypen
- Auf-/Abbau von Client-/Server-Verbindung
- Dynamisches SQL
- Cursor (scrollable)
- Outer-Joins
- Intersection-, Minus-Operator

### 3.2 Datentypen

**Numerische Datentypen:**
- **integer (integer4)** = 4 Byte Zahl
- **integer (integer2)** = 2 Byte Zahl
- **numeric (p, q)** = Dezimalzahl mit **genau** p Stellen, davon q hinter dem Dezimalzeichen
- **decimal (p, q)** = Dezimalzahl mit **mindestens** p Stellen, davon q hinter dem Dezimalzeichen
- **real** = Einfach genaue Gleitpunktzahl (4 Byte)
- **float (p)** = Gleitpunktzahl, mindestens p Stellen genau
- **double** = Doppelt genaue Gleitpunktzahl (8 Byte)

**Zeichen-Datentypen:**
- **char{acter} (n)** = Zeichenkette mit **genau** n Zeichen; Speicherbedarf: n Byte
- **char{acter} varying (n) / varchar (n)** = Zeichenkette mit **höchstens** n Zeichen; Speicherbedarf: Länge der Zeichenkette

**Erweiterte Datentypen (Zeit, Datum usw.):**
- bit(n)
- bit varying(n)
- date
- time
- timestamp
- datetime
- blob
- clob
- stream

**Datentypenkonvertierung (Oracle PL/SQL – implizite Konversionen):**

Die Slide zeigt eine Matrix für "Possible Implicit PL/SQL Data Type Conversions" mit den Typen BLOB, CHAR, CLOB, DATE, LONG, NUMBER, PLS_INTEGER, RAW, UROWID, VARCHAR2. Wichtige Konversionen (mit "Yes" markiert):
- BLOB → RAW
- CHAR → CLOB, DATE, LONG, NUMBER, PLS_INTEGER, RAW, UROWID, VARCHAR2
- DATE → CHAR, LONG, VARCHAR2
- NUMBER → CHAR, LONG, PLS_INTEGER, VARCHAR2
- VARCHAR2 → CHAR, CLOB, DATE, LONG, NUMBER, PLS_INTEGER, RAW, UROWID

Außerdem gibt es eine zweite Konversionstabelle für MS SQL Server (MSDN), die zwischen expliziter Konversion (schwarzer Punkt), impliziter Konversion (weißer Punkt) und "Conversion not allowed" (kein Symbol) sowie einem Sonderfall (*) mit Hinweis auf erforderliches CAST unterscheidet. Die Tabelle deckt Typen wie binary, varbinary, char, varchar, nchar, nvarchar, datetime, smalldatetime, decimal, numeric, float, real, bigint, int(INT4), smallint(INT2), tinyint(INT1), money, smallmoney, bit, timestamp, uniqueidentifier, image, ntext, text, sql_variant ab.

### 3.3 Operatoren

- **Zahlen:** +, -, *, /, %
- **Zeichenketten:** (keine arithmetischen Operatoren gelistet, implizit Verknüpfung)
- **Datum-/Zeitangaben:** +, -
- **Boolesche Verknüpfung:** and, or, not
- **Vergleiche:** =, >, <, >=, <=, <>
- **Typkonversion**

### 3.4 SELECT-Anweisung

**Grundsyntax:**
```sql
SELECT < expression >
FROM < table-name >
[WHERE < search-condition >]
[GROUP BY …
  [HAVING …] ]
[ORDER BY …]
```

**Selektion (alle Spalten):**
```sql
SELECT *
FROM parts;
```
Resultat: alle 6 Zeilen der parts-Tabelle (P1-P6) mit pno, pname, color, weight, city

**Bessere Alternative (explizite Spalten):**
```sql
SELECT pno, pname, color, weight, city
FROM parts;
```

**Projektion (nur eine Spalte):**
```sql
SELECT color
FROM parts;
```
Resultat: 6 Zeilen mit color (red, green, blue, red, blue, red) – mit Duplikaten!

#### 3.4.1 DISTINCT-Klausel

Keine Mehrfachnennung:
```sql
SELECT DISTINCT color
FROM parts;
```
Resultat: blue, green, red (3 row(s) affected) – Duplikate werden eliminiert

#### 3.4.2 Spaltennamen

Mit AS können Spalten umbenannt werden:
```sql
SELECT pno AS part_no,
       pname AS part_name,
       color AS part_color
FROM parts;
```
Resultat: Spaltenüberschriften heißen jetzt part_no, part_name, part_color

#### 3.4.3 Sortierung

```sql
SELECT pno, color
FROM parts
ORDER BY color DESC, pno ASC;
```
Resultat: Absteigend nach Farbe (red zuerst), bei Gleichstand aufsteigend nach pno:
P1 red, P4 red, P6 red, P2 green, P3 blue, P5 blue

### 3.5 Restriktion

**Einfache WHERE-Bedingung:**
```sql
SELECT pname, color
FROM parts
WHERE city = 'Paris';
```
Resultat: Bolt green, Cam blue (2 row(s) affected)

**BETWEEN:**
```sql
SELECT pname, weight
FROM parts
WHERE color = 'red' AND weight BETWEEN 13 AND 20;
```
Resultat: Screw 14.0, Cog 19.0

**Äquivalent ohne BETWEEN:**
```sql
WHERE color = 'red' AND weight >= 13 AND weight <= 20;
```
Gleiche Ergebnisse!

**LIKE (Patternmatching):**
```sql
SELECT pno, pname
FROM parts
WHERE pname LIKE 'C_%';
```
→ Welche Teilenamen haben wenigstens 2 Buchstaben und fangen mit 'C' an?
- `C` = Muster für C am Anfang
- `_` = genau ein weiteres Zeichen
- `%` = beliebige weitere Zeichen
- Resultat: P5 Cam, P6 Cog (2 row(s) affected)

### 3.6 Berechnete Spalten

```sql
SELECT pno,
       weight / 0.4536 AS wgt,
       'lbs' AS unit
FROM parts
WHERE weight / 0.4536 > 30
ORDER BY weight;
```
→ 1 lb = 0,4536 kg. Welche Teile wiegen mehr als 30 Pfund?
Resultat: P4 (30.86 lbs), P2 (37.47 lbs), P3 (37.47 lbs), P6 (41.88 lbs)

**Wichtig:** Die Berechnung `weight / 0.4536` muss zweimal geschrieben werden (einmal in SELECT, einmal in WHERE), weil der Alias wgt in der WHERE-Klausel noch nicht bekannt ist!

### 3.7 Verarbeitungsreihenfolge von SQL-Anweisungen

Das erklärt warum man nicht den Alias in WHERE nutzen kann:

1. **Kreuzprodukt** über alle Tabellen, die FROM benennt
2. **Restriktion**: Zeilen bestimmen, welche die WHERE-Bedingung erfüllen
3. **Gruppenbildung**
4. **Gruppen-Restriktion**
5. **Mengenbildung**
6. **Sortieren**
7. **Projektion**: Spalten gemäß SELECT-Klausel auswählen

### 3.8 Unterabfragen

**Unterabfrage mit genau einer Ergebniszeile:**
```sql
SELECT pno, pname
FROM parts
WHERE city = (
    SELECT city
    FROM suppliers
    WHERE sno = 'S1'
);
```
→ Welche Teile liegen in der selben Stadt, in der S1 sitzt?
Resultat: P1 Nut, P4 Screw, P6 Cog (3 row(s) affected)

**Unterabfragen liefern entweder:**
1. **genau eine Ergebniszeile** → Ergebnis der Unterabfrage wird mit Attributen der Hauptabfrage verglichen
2. **mehrere Ergebniszeilen** → WHERE-Bedingung arbeitet mit Mengenoperationen:
   - **IN**: prüft ob ein Wert in der Unterabfrage enthalten ist
   - **EXISTS**: prüft ob wenigstens eine Zeile eine Bedingung erfüllt
   - **< Θ > ANY, < Θ > SOME**: prüfen, ob irgendeine Zeile den Operator erfüllt
   - **< Θ > ALL**: prüft, ob alle Zeilen den Operator erfüllen
   - **Θ-Operator**: =, <, <=, >, >=, <>

**Unterabfrage mit IN:**
```sql
SELECT pno, pname, city
FROM parts
WHERE city IN (
    SELECT city
    FROM suppliers
);
```
→ Welche Teile sind in Städten gelagert, in denen auch Händler sitzen?
Resultat: P1 Nut London, P2 Bolt Paris, P4 Screw London, P5 Cam Paris, P6 Cog London (5 row(s) affected)

**Unterabfrage mit ALL:**
```sql
SELECT pno, pname, color
FROM parts
WHERE weight > ALL (
    SELECT weight
    FROM parts
    WHERE color = 'blue'
);
```
→ Welche Teile sind schwerer als das schwerste blaue Teil?
Resultat: P6 Cog red (nur eine Zeile!)

**Unterabfrage mit ANY:**
```sql
SELECT sno, qty
FROM supp_parts
WHERE pno = ANY (
    SELECT pno
    FROM parts
    WHERE pname = 'Screw'
);
```
→ Wer hat wie viel Schrauben verkauft?
Resultat: S1 400, S1 200, S4 300 (3 row(s) affected)

**Unterabfrage mit EXISTS:**
```sql
SELECT sname, city
FROM suppliers
WHERE EXISTS (
    SELECT *
    FROM parts
    WHERE city = suppliers.city
);
```
→ Welche Händler sitzen in einer Stadt, die auch Teile hat?
Resultat: Smith London, Jones Paris, Blake Paris, Clark London (4 row(s) affected)

**Wichtig bei EXISTS:** Die Unterabfrage referenziert die Hauptabfrage mittels `suppliers.city`. Das Attribut `city` ist in beiden Tabellen vorhanden, deshalb muss man es qualifizieren!

**NOT IN:**
```sql
SELECT sname, city
FROM suppliers s
WHERE city NOT IN (
    SELECT city
    FROM parts
);
```
→ Alle Händler aus Städten, wo es keine Teile gibt.
Resultat: Adams Athens

### 3.9 SQL integrierte Standardfunktionen

**Skalare Funktionen:**

Mathematische Funktionen:
- ABS, ACOS, ASIN, ATAN, ATN2, CEILING, COS, COT, EXP, FLOOR, LOG, LOG10, PI, POWER, RADIANS, ROUND, SIGN, SIN, SQRT, SQUARE, TAN

Zeichenketten-Funktionen:
- CHARINDEX/INSTR, LEFT, LEN, LOWER, LTRIM, RIGHT, RTRIM, SUBSTRING, UPPER

Zeit- und Datumsfunktionen:
- CURRENT DATE, CURRENT TIME, CURRENT_TIMESTAMP, DAY, MONTH, SYSDATE, TRUNC, TO_DATE, YEAR

**Aggregatfunktionen:**
- AVG, MAX, MIN, SUM, STDEV, COUNT

**Beispiel:**
```sql
SELECT MIN(qty) AS mini,
       MAX(qty) AS maxi,
       AVG(qty) AS schnitt
FROM supp_parts;
```
Resultat: mini=100, maxi=400, schnitt=258

**NULL-Werte und SELECT:**
```sql
CREATE TABLE nullBsp (n INT);
INSERT INTO nullBsp (n) VALUES(NULL);
INSERT INTO nullBsp (n) VALUES(1);
INSERT INTO nullBsp (n) VALUES(2);

SELECT COUNT(*) AS tutti FROM nullBsp;         -- zählt alle Zeilen inkl. NULL
SELECT COUNT(n) AS really FROM nullBsp;        -- zählt nur non-NULL Werte
SELECT AVG(n) schnitt from nullBsp;            -- ignoriert NULL bei Berechnung

-- nicht erlaubt:
-- select avg(*) as stutti from nullBsp

-- CAST für echten Durchschnitt:
SELECT avg (CAST(n AS real)) AS dschnitt FROM nullBsp;

DROP TABLE nullBsp
```

### 3.10 Gruppierung

**GROUP BY** verarbeitet Aggregatfunktionen auf Teilmengen von Zeilen:
```sql
SELECT sno, SUM(qty) as total
FROM supp_parts
GROUP BY sno;
```
→ Wie viele Teile wurden insgesamt durch einen Händler verkauft?
Resultat: S1=1300, S2=700, S3=200, S4=900

**HAVING** schränkt die Verarbeitung der Aggregatfunktionen ein:
```sql
SELECT sno, SUM(qty) as total
FROM supp_parts
GROUP BY sno
HAVING count(qty) > 1;
```
→ Aber keinen Händler ausgeben, der nur einmal verkauft hat.
Resultat: S1=1300, S2=700, S4=900 (S3 fällt raus!)

**Kombination WHERE + GROUP BY + HAVING:**
```sql
SELECT sno, SUM(qty) as total
FROM supp_parts
WHERE qty >= 200
GROUP BY sno
HAVING count(qty) > 1;
```
→ Keine Verkäufe kleiner als 200 + nur Händler mit mehr als einem Verkauf.
Resultat: S1=1100, S2=700, S4=900

**Verarbeitungsreihenfolge:** Erst WHERE filtert Einzelzeilen, dann GROUP BY gruppiert, dann HAVING filtert Gruppen!

### 3.11 Verbünde (Joins)

**JOIN** verbindet zwei Tabellen unter Angabe der Schlüsselbeziehung (PK-FK):

```sql
SELECT s.sname, sp.pno
FROM supp_parts sp
JOIN suppliers s
ON s.sno = sp.sno
WHERE sp.pno = 'P1';
```
Resultat: Smith P1, Jones P1 (2 row(s) affected)

**Alte SQL-Syntax (gleichwertig):**
```sql
SELECT s.sname, sp.pno
FROM supp_parts sp, suppliers AS s
WHERE s.sno = sp.sno AND sp.pno = 'P1';
```

**Join-Berechnung – 4 Schritte (Zusammenfassung):**
1. **Kreuzprodukt** aller Tabellen
2. **Zusammengehörige Zeilen** gemäß ON-Bedingung bestimmen
3. **Restriktion** gemäß WHERE
4. **Projektion**, um die gewünschten Spalten zu bestimmen

**Join-Berechnung im Detail:**

Die Beispiel-Tabellen für die Berechnung:

**Suppliers AS s:** S1 Smith 20 London (rowID 1), S2 Jones 10 Paris (2), S3 Blake 30 Paris (3), S4 Clark 20 London (4)

**Supp_Parts AS sp:** 12 Zeilen von S1/P1/300 bis S4/P5/400

Schritt I (Kreuzprodukt): Jede Zeile von s mit jeder Zeile von sp kombinieren → 4 × 12 = 48 Zeilen

Schritt II (ON-Bedingung): Nur Zeilen behalten wo s.sno = sp.sno → reduziert auf zusammengehörige Paare

Schritt III (WHERE sp.pno = 'P1'): Weiter filtern auf nur P1-Einträge

Schritt IV (Projektion SELECT s.sname, sp.pno): Nur die gewünschten Spalten

**Join-Regeln:**
- Spaltentypen müssen kompatibel sein (Empfehlung: identische Typen = schneller)
- Spaltennamen müssen **nicht** identisch sein
- JOIN-Operator: =, >, <, >=, <=
- Restriktionsbedingungen zulässig
- Tabellenanzahl für Join vom DBMS abhängig
- JOIN-Operator = wird als **Equi-Join** bezeichnet

**Natural Join** (verbindet gleiche Spaltennamen):
```sql
SELECT s.sname, sp.pno
FROM supp_parts sp
NATURAL JOIN suppliers s
WHERE sp.pno = 'P1';
```
Gleiche Ergebnisse wie normaler Join!

**Kaskadierte Joins** (mehr als zwei Tabellen):
```sql
SELECT s.sname, sp.pno
FROM supp_parts sp
INNER JOIN suppliers s ON sp.sno = s.sno
INNER JOIN parts p ON sp.pno = p.pno
WHERE qty > 300;
```
Resultat: Smith Screw 400, Jones Bolt 400, Clark Cam 400 (3 row(s) affected)

### 3.12 Inner-/Outer-Join

- **JOIN-Bedingung ON** kann eine Eingabe von NULL haben
- **INNER JOIN** verwirft Zeilen mit Join-Attributen, die NULL sind
- **OUTER JOIN** erlaubt dies:
  - **LEFT OUTER JOIN**: linke Tabelle NULL
  - **RIGHT OUTER JOIN**: rechte Tabelle NULL
  - **FULL OUTER JOIN**: linke oder rechte Tabelle NULL

**LEFT OUTER JOIN Beispiel:**
```sql
SELECT sno, pno
FROM suppliers s
LEFT OUTER JOIN parts p
ON s.city = p.city
```
→ Händler ohne entsprechendes Teil sollen gelistet werden (als NULL).
Resultat: S1/P1, S1/P4, S1/P6, S2/P2, ..., S3/P5, S4/P1, ..., **S5/NULL** (11 row(s) affected)
→ S5 (Adams aus Athens) hat kein Teil in seiner Stadt, erscheint aber trotzdem mit NULL bei pno!

**RIGHT OUTER JOIN Beispiel:**
```sql
SELECT sno, pno
FROM suppliers s
RIGHT OUTER JOIN parts p
ON s.city = p.city
```
→ Teile ohne entsprechende Händler sollen auch gelistet werden.
Resultat: S1/P1, ..., S3/P2, **NULL/P3**, S1/P4, S4/P4, ..., S4/P6 (11 row(s) affected)
→ P3 (Screw aus Rome) hat keinen Händler in seiner Stadt, erscheint als NULL/P3!

**FULL OUTER JOIN Beispiel:**
```sql
SELECT sno, pno
FROM suppliers s
FULL OUTER JOIN parts p
ON s.city = p.city
```
→ Beide Seiten: Teile ohne Händler UND Händler ohne Teile werden gelistet.
Resultat: S1/P1, ..., S3/P2, NULL/P3, S1/P4, S4/P4, ..., S4/P6, **S5/NULL** (12 row(s) affected)

### 3.13 Mengenoperationen

- **UNION**: Vereinigung der Ergebniszeilen (Duplikate werden eliminiert)
- **UNION ALL**: Vereinigung der Ergebniszeilen **inkl. Dupletten**
- **INTERSECT**: Schnittmenge der Ergebniszeilen
- **MINUS**: Restmenge der Ergebniszeilen; erstes SELECT \ zweiter SELECT

**UNION Beispiel:**
```sql
SELECT city
FROM suppliers
UNION
SELECT city
FROM parts;
```
→ Alle Städte, in denen Händler oder Teile sind.
Resultat: Athens, London, Paris, Rome (4 row(s) affected) – keine Duplikate!

**UNION-Regeln:**
- Beliebig viele Zeilenmengen können vereinigt werden
- Spaltennamen der Zeilenmengen können verschieden sein
- Spaltentypen müssen kompatibel sein
- Spaltentyp der Ergebnismenge wird von **erster Zeilenmenge** bestimmt

---

## 4 Data Manipulation Language

### 4.1 INSERT-Anweisung

**Syntax:**
```sql
INSERT INTO <table_name>
    [(col1, col2, …, colN)]
    VALUES (val1, val2, …, valN)
```

- Anzahl an col und der angegebenen Werte val muss übereinstimmen
- Reihenfolge bestimmt die Zuordnung
- Nicht angegebene Attribute werden mit DEFAULT-Wert oder NULL belegt
- In der ersten Klammer fehlende Attribute müssen mit DEFAULT-Wert oder NULL-Wert definiert sein

**Beispiel:**
```sql
INSERT INTO suppliers
    (sno, sname, status, city)
    VALUES ('S6', 'Miller', 10, 'Orlando')
```

**INSERT mittels Abfrage (kopieren eines Abfrageergebnisses):**
```sql
BEGIN TRANSACTION
    INSERT INTO parts(pno, pname, color, weight, city)
    SELECT 'TRN_' + pno, pname, color, weight, city FROM parts;
    SELECT * FROM parts;
ROLLBACK
```
→ Verdoppelt alle parts mit vorangestelltem 'TRN_' im pno, aber durch ROLLBACK wird es rückgängig gemacht.

**Kombiniertes INSERT & UPDATE Beispiel:**
```sql
BEGIN TRANSACTION
    INSERT INTO suppliers (sno, sname, status, city)
        VALUES ('S7', 'Smith', 10, 'Orlando');
    INSERT INTO supp_parts(sno, pno, qty)
        VALUES ('S7', 'P1', 1200);
    UPDATE supp_parts SET qty = 1300
        WHERE sno = 'S7' AND pno = 'P1';
    UPDATE suppliers SET sno = 'S8'
        WHERE sno = 'S7';
    SELECT * FROM suppliers;
    SELECT * FROM supp_parts WHERE qty > 1000;
ROLLBACK
```

### 4.2 DELETE-Anweisung

**Syntax:**
```sql
DELETE FROM <table_name>
[ WHERE <search_condition> ]
```

- WHERE schränkt den Umfang des Löschens ein
- DELETE entfernt die Daten aus der Datenbank
- DELETE löscht Daten unter Beachtung der **Foreign-Key-Constraints**
- Datenbankschema sollte bekannt sein, um "Effekte" durch das Löschen beurteilen zu können
- **Zum Löschen Transaktionen nutzen!**

**Beispiel:**
```sql
BEGIN TRANSACTION
    SELECT count(*) FROM supp_parts;
    SELECT count(*) FROM suppliers WHERE sno <= 'S3';
    DELETE FROM suppliers WHERE sno <= 'S3';
    SELECT * FROM suppliers;
    SELECT count(*) FROM supp_parts;
ROLLBACK
```
→ Löscht S1, S2, S3. Wenn Fremdschlüssel-Constraints gesetzt sind, können auch abhängige supp_parts-Einträge gelöscht werden (CASCADE)!

### 4.3 Tabelle löschen

**Syntax:**
```sql
DELETE TABLE <table_name>
[ CASCADE ]
```

- Löscht die Tabelle inkl. aller Daten
- **CASCADE** entfernt abhängige Datensätze in anderen Tabellen

### 4.4 UPDATE-Anweisung

**Syntax:**
```sql
UPDATE <table_name>
SET col = val
[ WHERE <search_condition> ]
```

- UPDATE verändert die Daten der Tabelle
- UPDATE sollte **in einer Transaktion** ausgeführt werden

**Beispiel:**
```sql
BEGIN TRANSACTION
    SELECT * FROM suppliers WHERE sno = 'S6';
    UPDATE suppliers
        SET status = 15, city = 'Houston'
        WHERE sno = 'S6';
    SELECT * FROM suppliers WHERE sno = 'S6';
ROLLBACK
```
→ Händler Miller zieht nach Houston um und bekommt Status 15.

---

## 5 Sichten (Views)

**Sichten – Views:**
- Virtuelle Tabellen
- Attribute und deren Datentypen stammen von den Basistabellen
- Berechnung der "Tupel" zur **Laufzeit** (Abfrage) – nicht gespeichert!
- Anpassung an spezielle Benutzerbedürfnisse, Datenschutz usw.
- Zum Verbergen von "komplexen" Strukturen (z.B. Join-Beziehungen)

**Vorteile:**
- Adaption an verschiedene Benutzerklassen
- Nur relevante Daten werden angezeigt
- Spalten können benutzungsfreundlich präsentiert werden
- Schemaänderungen sind möglich

**Syntax:**
```sql
CREATE VIEW <view_name>
    [(<column_name> [, <column_name> …] ) ]
    AS <query_expression>
    [ WITH CHECK OPTION ]
```

**View-Beispiel (alle roten Teile):**
```sql
CREATE VIEW red_parts
AS
    SELECT *
    FROM parts
    WHERE color = 'red'

SELECT * from red_parts;
```
Resultat: P1 Nut red 12.0 London, P4 Screw red 14.0 London, P6 Cog red 19.0 London (3 row(s) affected)

**INSERT in View:**
```sql
INSERT INTO red_parts VALUES('P7', 'Washer', 'pink', 12, 'Rome');
INSERT INTO red_parts VALUES('P8', 'Cog', 'red', 0.5, 'Rome');
INSERT INTO red_parts VALUES('P9', 'Nut', 'red', 15, 'Rome');
```
→ P7 mit 'pink' wird trotzdem eingefügt (in die Basistabelle), erscheint aber nicht in red_parts weil color != 'red'. Das ist ein Problem!

**WITH CHECK OPTION verhindert das:**

View auf schwere, rote Teile (basiert auf red_parts):
```sql
CREATE VIEW highweight_red_parts
AS
    SELECT *
    FROM red_parts
    WHERE weight >= 10.0
```
Resultat zeigt: P1/12.0, P4/14.0, P6/19.0, P9/15.0 (4 row(s) affected)

Wenn man jetzt versucht einzufügen was die Bedingung verletzt:
```sql
INSERT INTO highweight_red_parts
    VALUES ('PA', 'Washer', 'red', 5, 'Stuttgart');
```
→ Fehler! Msg 550, Level 16 – The attempted insert or update failed because the target view either specifies WITH CHECK OPTION or spans a view that specifies WITH CHECK OPTION...

**Umfassendes VIEW-Beispiel (Städtestatistik):**

Sicht, die Anzahl aller Händler und Teile je Stadt angibt. Resultat:
| city | TAnz | HAnz |
|------|------|------|
| Athens | NULL | 1 |
| London | 3 | 2 |
| Orlando | NULL | 1 |
| Paris | 2 | 2 |
| Rome | 1 | NULL |

**Voraussetzungen für das Ändern auf Sichten:**
- Nur **eine Basisrelation**
- Schlüssel muss **(komplett) sichtbar** bleiben
- Keine Verwendung von:
  - Aggregaten
  - Gruppierungen
  - Duplikateliminierung (DISTINCT)

---

## 6 Data Definition Language (DDL)

**SQL-Data Definition Language – Definition der:**
- Datenbankstruktur (Tabellenerstellung usw.)
- Speicherungsstrukturen (Heap usw.)
- Zugriffshilfsstrukturen (Indizes usw.)

### 6.1 Tabelle erstellen

**Syntax:**
```sql
CREATE TABLE <table-name>
    (Spaltendefinition1, …, SpaltendefinitionN
    [, Integritätsregel1, …, IntegritätsregelM] )
```

Wobei:
```
SpaltendefinitionI ::= Spaltenname Typeangabe
                       [DEFAULT Klausel]
                       [Spaltenintegritätsregel]
```

- **Tabellenname** muss innerhalb eines Schemas eindeutig sein
- **Spaltenname** muss innerhalb einer Tabelle eindeutig sein
- Spaltenintegritätsregel z.B.: `NOT NULL`

**Beispiel (2-spaltige Tabelle ohne NULL-Werte):**
```sql
CREATE TABLE example
(
    id    INT   NOT NULL,
    value FLOAT NOT NULL
);
```

#### 6.1.1 Integritätsbedingungen

**Operationale Integrität:**
- Gewährleisten der Funktion nach Hardwarefehlern, Vandalismus
- Sicherung gegen Probleme durch Mehrbenutzerbetrieb

**Semantische Integrität** (Konsistenz zur Laufzeit):
- **Entitäts-Integrität**: Eine Zeile ist in der Tabelle eindeutig (z.B. CREATE UNIQUE INDEX, UNIQUE, PRIMARY KEY)
- **Wertebereichs-Integrität**: Ein Wert wird auf eine gültige Domäne beschränkt (z.B. CHECK, DEFAULT, NOT NULL)
- **Referentielle-Integrität**: Fremdschlüsselbeziehungen werden überwacht (z.B. FOREIGN KEY)
- **Benutzerdefinierte-Integrität**: Modellierte Bedingungen (z.B. Trigger)

#### 6.1.1.1 Primärschlüssel

Attribut einer Tabelle, welches einen Satz eindeutig charakterisiert (Entitäts-Integrität):

```sql
CREATE TABLE p
(
    id   INT         NOT NULL,
    name VARCHAR(32),
    PRIMARY KEY (id)
);

INSERT INTO p VALUES (1, 'Ulf');   -- OK
INSERT INTO p VALUES (2, 'Ute');   -- OK
INSERT INTO p VALUES (1, 'Uwe');   -- FEHLER! PK-Verletzung!
```

**Zusammengesetzter Primärschlüssel** (wenn ein Attribut nicht eindeutig ist):
```sql
ALTER TABLE Supp_Parts
ADD CONSTRAINT PK_Supp_Parts
PRIMARY KEY
(
    sno,
    pno
);
```

#### 6.1.1.2 Eindeutige Spalten

Nicht-Primärschlüssel-Attribute können mit UNIQUE auf Eindeutigkeit geprüft werden. UNIQUE-Attribute werden als **Schlüsselkandidaten** bezeichnet:

```sql
CREATE TABLE p
(
    id   INT         NOT NULL,
    name VARCHAR(32),
    PRIMARY KEY (id),
    UNIQUE (name)
);

INSERT INTO p VALUES (1, 'Ulf');   -- OK
INSERT INTO p VALUES (2, 'Ute');   -- OK
INSERT INTO p VALUES (3, 'Ulf');   -- FEHLER! UNIQUE-Verletzung!
```

#### 6.1.1.3 Check-Bedingung

Bedingung für erlaubte Attributwerte:
```
CHECK <Bedingung>
```
Bedingung wird formuliert analog zur WHERE-Klausel:

```sql
CREATE TABLE p
(
    id   INT         NOT NULL,
    name VARCHAR(32),
    anr  char(4),
    PRIMARY KEY (id),
    CHECK (anr IN ('Frau', 'Herr'))
);

INSERT INTO p VALUES (1, 'Ulf', 'Herr');  -- OK
INSERT INTO p VALUES (2, 'Ute', 'Frau');  -- OK
INSERT INTO p VALUES (3, 'Don', 'Mr.');   -- FEHLER! 'Mr.' nicht erlaubt
```

#### 6.1.1.4 Default-Bedingung

Standardwert für ein Attribut, wenn beim INSERT nicht spezifiziert:

```sql
CREATE TABLE p
(
    id   INT         NOT NULL,
    name VARCHAR(32) DEFAULT current_user,
    PRIMARY KEY (id),
);

INSERT INTO p (id) VALUES (1234);
-- name bekommt automatisch den angemeldeten Datenbankbenutzer
```

### 6.1.2 Referentielle Integrität

**Das Diagramm zeigt die Beziehung:**
- Parts (PK: pno) ←→ Supp_Parts (PK,FK2: sno / PK,FK1: pno / qty) ←→ Suppliers (PK: sno)
- Die Pfeile zeigen die Fremdschlüsselbeziehungen an

**Syntax:**
```sql
CONSTRAINT <constraint_name> FOREIGN KEY
(
    <attribute_name>
) REFERENCES <table> ( <attribute_name> )
{ ON DELETE [NO ACTION | CASCADE | SET NULL | SET DEFAULT ] }
{ ON UPDATE [NO ACTION | CASCADE | SET NULL | SET DEFAULT ] }
```

**Bedeutung der Schlüsselwörter:**
- **NO ACTION**: DELETE oder UPDATE der Herkunftstabelle wird verweigert, wenn es einen abhängigen Satz gibt
- **CASCADE**: DELETE oder UPDATE der Herkunftstabelle wird an die abhängige Tabelle **durchgereicht**
- **SET NULL**: Betroffene Zeilen der abhängigen Tabelle werden auf NULL gesetzt
- **SET DEFAULT**: Betroffene Zeilen der abhängigen Tabelle werden auf den DEFAULT-Wert gesetzt

**Vollständiges Beispiel:**
```sql
CREATE TABLE supp_parts
(
    sno VARCHAR(8) NOT NULL,
    pno VARCHAR(8) NOT NULL,
    qty int NULL,
    CONSTRAINT PK_supp_parts
        PRIMARY KEY (sno, pno),
    CONSTRAINT FK_supp_parts_parts FOREIGN KEY (pno)
        REFERENCES parts (pno)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_supp_parts_suppliers FOREIGN KEY (sno)
        REFERENCES suppliers (sno)
        ON DELETE CASCADE ON UPDATE CASCADE
);
```
→ Supp_parts ist von parts UND suppliers abhängig. Jede Änderung wird weitergereicht (CASCADE).

---

## 7 Einführung

### 7.1 Grundbegriffe

**Datenmanagement – konkrete Aufgabenbereiche (alle ständig durchzuführen):**
- Spezifikation und Realisierung des Datenmodells (Datenanalyse)
- Inproduktionsnahme des Datenmodells
- Organisation der Datenbeschaffung
- Wartung und Pflege des DBMS-System

**Informationssystem (Definition):**
Werkzeug zur Erfassung und Kommunikation von Informationen zum Zwecke der Erfüllung der Anforderungen seines Benutzers, der (Geschäfts-) Aktivitäten ihres Unternehmens und zur Erreichung der Unternehmensziele. Ein Informationssystem umfasst Daten, Datenbanksoftware, Rechner-Hardware, Personen, welche die Daten benutzen und verwalten, relevante Anwendungssoftware sowie Programmierer, die diese entwickeln.

**Daten und Informationen (Diagramm):**

Das Diagramm zeigt einen Kreislauf:
- **Daten** (oben links): Umfangreich, strukturierte Darstellung der Realität, zweckneutral, teilweise bedeutungslos → durch Verkettung, Extraktion, Auswertung → **Informationen** (unten links)
- **Informationen**: Wissen über Realität, zweckgerichtet (fallbezogen) → durch Anwendung → **Entscheidung** (oben rechts)
- **Entscheidung**: Auswahl aus einer Menge von Alternativen → durch Realisierung → **Aktion** (unten rechts)
- **Aktion**: Durchführung zielgerichteter Handlungen → durch Generierung → zurück zu **Informationen**

**Funktionen von Informationen (zweites Diagramm):**
Informationen haben 3 Funktionen:
- **Dokumentationsfunktion**: dokumentieren Ergebnisse
- **Entscheidungsunterstützungsfunktion**: unterstützen Entscheidungen
- **Steuerungsfunktion**: steuern Handlungsabläufe

Forderungen an **Daten**: Verfügbarkeit, Aktualität, Genauigkeit, Kosten, Nützlichkeit

**Bedeutung von Informationen für die Wirtschaft:**
- Informationen sind die Basis für einen effektiven und effizienten Einsatz von Produktionsfaktoren
- Funktionen: Kontrolle, Durchführung, Planung, Entscheidung, Steuerung

**Strategische Bedeutung:**
- Informationen bestimmen das Überleben der Weltwirtschaft
- Zur richtigen Zeit, die richtigen Informationen, am richtigen Ort
- Entscheidungsunterstützung durch: Datenbanken, Data Warehouse, OLAP, Data Mining, MIS, Knowledge Management, CRM

**Wissensmanagement:**
- Inhalt: Aufbau und Sicherung von Wissen, Fakten (Wissen) zur Verfügung stellen, Optimierung der Wissensverteilung
- Bereiche: Allgemeinwissen, Fach Know-How (Was + Wie), Soft-Skills (Wann)
- Problem: "Informationsüberflutung"

**Customer Relationship Management (CRM):**
- Warum: Globalisierung der Märkte, steigende Transparenz und Zunahme von Informationsquellen, Kundenanforderung bzgl. Produkte nehmen zu
- Inhalt: Ausrichtung der Geschäftsprozesse auf Kundenbedürfnisse, Identifikation der profitablen Kunden, segmentspezifische Marketingstrategien zur Akquisition neuer Kunden

**Prinzipien/Sichten:**

Zerlegung: Top-Down oder Bottom-up

Sichten:
- **funktionsorientiert**: Funktionen und Unterfunktionen / keine explizite Programm-übergreifende Datenmodellierung
- **datenorientiert**: ERM, Data Dictionary
- **objektorientiert**: Klassen, Objekte, Attribute, Methoden, Kapselung, Vererbung / gleichzeitige Modellierung von Daten und Funktionen
- **prozessorientiert**: Ereignis und Prozess

**Methoden (Diagramm):**

Das Diagramm zeigt die Zuordnung verschiedener Methoden zu Phasen:
- **Konzeption** ← Funktionsbaum, Geschäftsprozesse, DFD, Petri-Netz, ER, DD
- **Spezifikation** ← Jackson-Diagramm, Struktogramm, PAP
- **Realisierung** ← Entscheidungstabelle, Pseudocode

**Requirement Engineering:**
Anforderungstechnik. Das systematische, disziplinierte und quantitativ erfassbare Vorgehen beim Spezifizieren, d.h. Erfassen, Beschreiben und Prüfen von Anforderungen an Software. Verstehen und Beschreiben, was der Kunde wünscht oder braucht.

**Ebenen der Modellierung:**

Systemanalyse = Systematische Vorgehensweise zur Anforderungsermittlung. Festlegen der quantitativen und qualitativen Eigenschaften des zu entwickelnden Softwareproduktes (Sollkonzept)

Ebenen: Design, Realisierung, Inbetriebnahme/Wartung

Meilenstein-Phasen: Projektvorbereitung → Konzeption → Spezifikation → Realisierung

### 7.2 Datenspeicherung

**Unstrukturiert (Beispiel Word-Dokument):**
Unklar formatierte Personendaten wie "Willi Meier, Schillerstr. 3, 023123" oder "Müller, Hans, 80000 München, Geburtstag: 23.4.1987, Schuhverkäufer" – kein einheitliches Schema.

**Strukturiert (Dateien):**
| Name | Vorname | Straße | Nr. | PLZ | Ort | Datum |
|------|---------|--------|-----|-----|-----|-------|
| Meier | Willi | Schillerstr. | 3 | 8000 | München | 23.04.02 |
| Müller | Hans | Fischerstr. | 3 | 45884 | Gelsenkirchen | 23.04.87 |

Merkmale strukturierter Datenspeicherung in Dateien:
- Sequenzielle Abarbeitung der Dateien (z.B. Magnetbänder, -kassetten)
- Sprachen zur Verwaltung großer Datenbestände: **COBOL, FORTRAN, PASCAL**
- Applikationen speichern "eigene Daten" isoliert in "eigenen Files"
- Datenspeicherung und Zugriff auf Daten nur durch spezielle Anwendungen

---

## 8 Datenmodellierung

### 8.1 Grundlagen

**Datenmodellierung (Definition):**
Gegenstand der Datenmodellierung ist es, alle relevanten Informationen eines Systems, z.B. eines betrieblichen Funktionsbereiches (Vertrieb), zu beschreiben. Man benötigt dazu eine Syntax, die den Sachverhalt möglichst einfach, mit wenigen Syntaxelementen aber genügend formal, um exakt sein zu können, zu beschreiben.

**Einsatzgebiete:**
- Entwicklung von Anwendungssystemen → Individualsoftware im technischen oder kommerziellen Bereich
- Einführung von Informationssystemen → Standardsoftware (SAP, ALCIB, ALCIM)
- Organisationsprojekte → z.B. Business Process Redesign

**Datenorientiertes Vorgehen – Warum?**
"Daten leben ewig!"
- Hardware besteht einige Jahre
- Software übersteht die Hardware
- Daten überleben mehrere Softwarezyklen

Außerdem:
- Datenmodelle sind schnell umsetzbar, Vermeidung von Redundanz
- Betriebswirtschaftliche Basis für Integration und Standardisierung
- Datenorganisation bestimmt wesentlich die Systemleistung und die Datensicherheit/Datenschutz

**Sinn der Datenmodellierung:**
Unterschiedliche Zielgruppen stellen unterschiedliche Ansprüche und verwenden unterschiedliche Fachsprachen.

Dient als Kommunikationsmittel zwischen: IS-Entwickler, Endbenutzer und Management (Auftraggeber)

Durch Modellierung Abbildung der:
- Aufbauorganisation
- Daten
- Funktionen
- Ablauforganisation

**Zweck der Modellierung für verschiedene Gruppen:**
- **IS-Entwickler**: Kommunikation, Qualitätssicherung und Dokumentation
- **Endbenutzer**: Kommunikation, Standardisierung, transparente Dokumentation der Aufgabe
- **Management**: Aufwandschätzung, Gestaltungsspielräume aufzeigen, Kommunikation, Projektplanung, Investitionsentscheidungen, Dokumentation der Geschäftsprozesse

### 8.2 Phasen

**Die 5 Phasen der Datenmodellierung (Diagramm mit Beispielbildern für jede Ebene):**

| Ebene | Objekt | Methode |
|-------|--------|---------|
| Ebene 1 | Reale Welt | Verkauf, Produktion |
| Ebene 2 | Betriebswirtschaft Modellierung | Betriebliche Funktionen, Methode: Istanalyse |
| Ebene 3 | Semantische Modellierung | ERM |
| Ebene 4 | Logische Modellierung | Normalisierung, Relationales Modell |
| Ebene 5 | Physische Modellierung (Datenbank) | DB Know-how, Tabellen |

**Betriebswirtschaftliche Modellierung (Phase 2):**
- Abgrenzung Miniwelt (Umwelt)
- **Informationsbedarfsanalyse**: Erhebung der Informationsobjekte, Interviews, Analyse vorhandener Systeme, Methoden der Istanalyse, Sammeln und Einordnen von Begriffen und Aussagen

**Problematische Begriffe bei der Analyse:**
- **Homonyme Begriffe**: Begriffe mit unterschiedlicher Bedeutung (Bank/Bank)
- **Äquipollenzen** (lateinisch aequipollens = gleichviel geltend): Unterschiedliche Sichtweisen der selben Objekte (z.B. Mitarbeiter, Aufträge aus rechtlicher, organisatorischer, buchhalterischer Sicht)
- **Vage Begriffe**: Dinge, die jeder erwähnt, aber nicht genau definiert sind (Bsp. Multimedia)
- **Bezeichner**: Problem der Identifikation von z.B. Artikelnummern (unterschiedlich in verschiedenen Bereichen)

**Semantische Modellierung (Phase 3):**
- Semantik = Lehre von der Bedeutung sprachlicher Zeichen
- Modellierung der Miniwelt aus Unternehmenssicht durch Fachabteilung
- Von der Implementierung und Datenbanksystem **unabhängig**
- Semantisches Datenmodell (ERM): wirklichkeitsnah, ohne technische Gesichtspunkte, wenig Symbole → verständlich, Kommunikation Informationssystem ↔ Business

**Vorteile der semantischen Modellierung:**
- Verbessern der Kommunikation zwischen Anwender und Entwickler
- Verbessern der Analysefähigkeit und Wartbarkeit
- Verbessern der Dokumentation
- Erhöhen der Datenqualität durch bessere Interpretierbarkeit der Begriffe
- Dient als Entscheidungsgrundlage für die Auswahl von Standardsoftware
- Schaffen eines einheitlichen unternehmensweiten Sprachgebrauches

**Logische Modellierung (Phase 4):**

Auswahl logisches Paradigma:
- Netzwerkmodell
- Hierarchisches Modell
- **Relationales Modell** (das wichtigste)
- Objektorientiertes Modell

Relationales Modell erfordert:
- Auflösung von n:m-Beziehungen
- Normalisierung
- Felddatentypen zuweisen

Datenzeitpunkt: statisch oder dynamisch

Datenattribut: numerisch, alphanumerisch, grafisch, funktional

Datenoperatoren: syntaktisch oder semantisch

**Physische Modellierung (Phase 5):**
- Festlegung von Zugriffsrechten (Insert, Update, Delete, Select)
- Optimierung des Datenbankzugriffs (Indizes)
- Datenintegrität sicherstellen (Master/Detail)
- Trigger, Verteilung, Backup usw.
- Arbeitsbereich eines **Datenbank-Administrators**

**Strukturierte Analyse (Gesamtübersicht):**

| | semantische DM | logische DM | physische DM |
|---|---|---|---|
| **Phasen** | → | → | → |
| **Ergebnis** | semantisches Datenmodell | logisches Datenmodell | physisches Datenmodell |
| **Aufgaben/Inhalte** | Betriebswirtschaftliche Begriffsbildung | Formal pragmatisch logisches Datenmodell | Programmierung, Zugriffsoptimierung |
| **Methoden/Ansätze** | Entity-Relationship-Ansatz | Relationales Datenmodell, Normalisierung | Abfragesprachen, Softwareentwicklung |

### 8.3 Basismethoden

**Strukturierte Analyse – Funktionsbaum:**

Das Diagramm zeigt einen Baum mit:
- **Root Funktion (0. Ebene)** → logische Verbindung (Pfeil nach rechts)
- **Hauptfunktionen (1. Ebene)** (mehrere Kästen auf Ebene 1)
- **Unterfunktionen (2-n. Ebene)** (weitere Kästen darunter)

Beschreibung:
- zur Identifizierung der Geschäftsfunktionen, die innerhalb einer Organisation ausgeführt werden
- Eine **Funktion** ist eine fachliche Aufgabe bzw. Tätigkeit an einem Objekt zur Unterstützung eines oder mehrerer Unternehmensziele
- Zerlegung bis zu **Elementarfunktionen** = Funktionen,

die notes wurden abgeschnitten bei "Zerlegung bis zu Elementarfunktionen = Funktionen, die betriebswirtschaftlich nicht mehr sinnvoll zerlegbar sind." – jetzt weiter ab da:

---

**Prinzipien des Funktionsbaums:**
- jede Funktion muss durch ihre Teilfunktionen **vollständig repräsentiert** werden
- **keine Abläufe** abbilden
- **keine Reihenfolge** angeben
- **keine Organisationsstrukturen** abbilden

**wichtige Unterscheidung – Funktion vs. Prozess:**
Das Diagramm zeigt: Start → Prozess → Ende (mit Pfeil von links nach rechts, gestrichelte Linie). Eine Funktion hat KEIN Start/Ende – das ist ein Prozess! Funktionen sind statische Aufgaben, Prozesse haben einen zeitlichen Ablauf.

**Beispiel Unternehmensfunktionen (Funktionsbaum):**

Das Diagramm zeigt einen Funktionsbaum mit dem Root "Unternehmensfunktionen" (0. Ebene), darunter 4 Hauptfunktionen (1. Ebene): lagern, einkaufen, produzieren, vertreiben. Unter "produzieren" gibt es: Produktion planen, Produktion steuern. Unter "vertreiben" gibt es: Anfrage annehmen, Angebot erstellen, Auftrag annehmen, Auftrag verfolgen.

**Symbole der Strukturierten Analyse:**

Das Diagramm zeigt 4 Symbole mit Erklärungen:
- **Oval/Ellipse mit Rechteck** = Funktion: "Eine vom Unternehmen ausgeführte Funktion, die Informationen transformiert bzw. benutzt. Die Funktionshierarchie wird durch die Dezimalklassifikation kenntlich gemacht."
- **Rechteck mit doppelter Linie links** = Datenspeicher: "speichern Informationen über einen gewissen Zeitraum (z.B.: Datenbank, Formular)"
- **Pfeil mit Beschriftung** = Datenfluss: "Informationsströme innerhalb eines Unternehmens und zwischen einem Unternehmen und der Umwelt."
- **Rechteck** = Externe Subjekte: "Externe Subjekte, die mit dem Unternehmen einen Informationsaustausch pflegen (z.B.: Kunden, Lieferanten)"

### 8.4 Spezialmethoden

**Datenflussdiagramm (DFD) – Ausgangsbeispiel Buchbeschaffung:**

Aufgabe: Ein Mitarbeiter fragt an, ob ein Fachbuch im Unternehmen vorhanden ist. Die Anfrage wird im System abgespeichert und anschließend bearbeitet. Im Rahmen der Bearbeitung erfolgt die Überprüfung, ob das Buch in der Abteilungsbibliothek oder in der Unternehmensbibliothek existent ist. Gegebenenfalls wird das Buch in einer Buchhandlung bestellt.

**Kontextdiagramm** (Level 0):
Das Diagramm zeigt: Mitarbeiter (Rechteck) → Anfrage → 1. Buch beschaffen (Oval) → Bestellung → Buchhandlung (Rechteck). Vom Oval zurück zum Mitarbeiter: Buch vorhanden.

**Grundregeln für DFDs – 3 Regeln:**

Das Diagramm zeigt eine Tabelle mit drei Zeilen:

| Ausgangspunkt | Resultat | Regel |
|---|---|---|
| 1. Durchführen Reservierung (eine Funktion) | 1.1 Daten eingeben → 1.2 Ticket drucken | Funktionen mit verbindendem Datenfluss |
| 1. Reservierung und Check-In (eine Funktion) | 1.1 Durchführen Reservierung ↔ Reservierungsdatei ↔ 1.2 Durchführen Check-In | Funktionen mit verbindendem Datenspeicher |
| 1. Check-In (eine Funktion) | 1.1 Passkontrolle, 1.2 Gepäckaufgabe (ohne Verbindung) | Funktionen ohne Verbindung |

**Flugreservierung-Beispiel (vollständiges DFD):**

Das DFD zeigt:
- Passagier (externes Subjekt) → Ansuchen um Reservierung → 1.1 Durchführen der Reservierung → Reservierungsdatei (Datenspeicher)
- Aus Reservierungsdatei → reservierte Flugkarte → zurück zum Passagier
- Passagier → Check-In-Anfrage → 1.2 Durchführen des Check-Ins
- 1.2 → Bordkarte oder Umbuchungsmeldung → Passagier
- Beide Funktionen 1.1 und 1.2 gehören zur übergeordneten Funktion "1. Reservierung und Check-In"

**Buchbeschaffungs-DFD Lösung – Ebene 1 (Funktionen mit verbindendem Datenfluss):**

Das DFD zeigt:
- Mitarbeiter → Anfrage → 1.1 Speichern der Anfrage → Anfragespeicher (Datenspeicher) → 1.2 Bearbeiten der Anfrage → Bestellung → Buchhandlung
- 1.2 → Buch vorhanden → zurück zu Mitarbeiter
- Beide Funktionen unter: "1. Buch beschaffen"

**Buchbeschaffungs-DFD Lösung – Ebene 2 (Funktionen mit verbindendem Datenspeicher = 1.2 Bearbeiten der Anfrage aufgebrochen):**

Das DFD zeigt:
- Anfragespeicher → 1.2.1 Überprüfen des Buchs → Buch nicht verfügbar → 1.2.2 Bestellen des Buchs → Bestellung → Buchhandlung
- 1.2.1 → Buch vorhanden → Mitarbeiter

**Buchbeschaffungs-DFD Lösung – Ebene 3 (Funktionen ohne Verbindungen = 1.2.1 Überprüfen des Buchs aufgebrochen):**

Das DFD zeigt:
- Anfragespeicher → 1.2.1.1 Überprüfen in Abt.-Bibliothek (nutzt Abt.-katalog) → Buch nicht vorhanden → 1.2.2 Bestellen des Buchs
- Anfragespeicher → 1.2.1.2 Überprüfen in Hauptbibliothek (nutzt Zentralkatalog) → Buch vorhanden → Mitarbeiter

**Datenmodellierung Überblick (Übersichtstabelle aller Methoden):**

Das Diagramm zeigt eine große Übersichtstabelle mit 7 Spalten (Sichten) und mehreren Zeilen. Von links nach rechts:

| Funktionale Sicht | Datenorientierte Sicht | Objektorientierte Sicht | Algorithmische Sicht | Regelbasierte Sicht | Zustandsorientierte Sicht | Szenariobasierte Sicht |
|---|---|---|---|---|---|---|
| Funktionale Hierarchie | Informationsfluss, Datenstrukturen, Entitäten & Beziehungen | Klassenstrukturen | Kontrollstrukturen | Wenn-Dann-Strukturen | Endlicher Automat, Nebenläufige Strukturen | Interaktions-Strukturen |
| Funktionsbaum | Datenflussdiagramm (1966), Data Dictionary (1979), Entity Relationship (1976) | Klassendiagramm (1980) | Pseudocode, Struktogramm (1973), Jackson-Diagramm (1975), Programm-Ablauf-Plan (1966) | Entscheidungstabelle (1957), Warnier-Orr-Diagramm (1972), Regeln | Zustandsautomat (1954), Petri-Netz (1962) | Interaktions-Diagramm (1962) |

"seltener verwendet" ist auf der Y-Achse links als Label angegeben – die unteren Zeilen werden seltener verwendet.

---

## 9 Entity-Relationship-Modell

### 9.1 Grundlagen

**Definition ERM:**
Ein Entity-Relationship-Modell (ER-Modell) ist eine anschauliche und leicht kommunizierbare Beschreibung der Datenwelt. Es ist Ergebnis der konzeptionellen Modellierung und stellt einen Ausschnitt der Realität dar, der für eine Problemstellung wichtig ist. Es beschreibt Objekte der Realwelt und ihre Beziehungen zueinander.

**Bestandteile des ERM (Diagramm):**

Das Diagramm zeigt 4 Symbole:
- **Rechteck** (mit name drin) = **Entitätsmengen**
- **Raute** (Diamant mit name drin) = **Beziehungstypen**
- **Oval** (mit name drin) = **Attribute**
- **Rechteck mit Raute und Zahl 1 an beiden Seiten** = **Kardinalitäten** (Beispiel: name –1–◇–1– name)

**Datenmodellierung im ERM – 8 Schritte:**
1. Problemrahmen transparent machen
2. Entitätsmengen ermitteln
3. Beziehungen & Kardinalitäten festlegen
4. Attribute definieren
5. Schlüssel (Primär, Sekundär) festlegen
6. Überführen in das Relationenmodell
   - Redundanz beseitigende Normalisierung
   - Wertebereiche
   - n:m-Beziehungen auflösen
7. Beschreibung der Integritätsbedingungen
8. Überprüfung des Modells

Das Diagramm zeigt dann: ERM (Kasten, blau) → Pfeil nach unten → Relationenmodell (Kasten, blau)

**Kontrolle nach Erstellung des ERM:**
- Die Entitätsmengen müssen mindestens ein Attribut besitzen
- Entitätsmengen = Substantive; Beziehungstypen = Verben (Singular) beschrieben
- Attribute im Singular
- Sind zwei Entitätsmengen identisch (Kardinalität 1:1) / durch die selben Relationen mit der Umwelt verbunden / besitzen sie die selben Schlüsselelemente bzw. die selben Attribute
- Bringt jede Entitätsmenge bzw. Beziehungstyp neue Informationen in das Modell

**Grundbegriffe – Dozenten/Vorlesungen Beispiel:**

Das Diagramm zeigt zwei Tabellen nebeneinander:

**Dozenten:**
| DozentNr. (PK) | Name | Vorname | TeleNr. |
|---|---|---|---|
| 15 | Krause | Willi | 471112 |
| 28 | Meier | Jürgen | 081515 |
| 17 | Bendisch | Roman | 200300 |

**Vorlesungen (mit FK DozentNr.):**
| VorlNr. (PK) | Bezeichnung | Stunden | DozentNr. (FK) |
|---|---|---|---|
| 1234 | BWL | 18 | 28 |
| 1345 | Statistik | 24 | 17 |
| 1432 | Engineering | 36 | 17 |

Das Diagramm beschriftet: Primärschlüssel (bei DozentNr. und VorlNr.), Relation (der Pfeil zwischen), Attribute (die anderen Spalten), Fremdschlüssel (DozentNr. in Vorlesungen), Tupel (eine Zeile, beim Beispiel 1345 Statistik 24 17 eingekreist).

### 9.2 Entitäten

**Entitätsausprägungen (Diagramm):**
Das Diagramm zeigt eine Ellipse (grün) mit den Namen "Erna Hippe", "Walter Windig", "Rudi Ratlos" darin – das sind die Entitätenausprägungen: Student. Ein Pfeil deutet auf "Student" → das ist der Entitätstyp (dargestellt als großes Rechteck mit "Student").

**Beschreibung Entitäten:**
- **Entitätsmenge**: Synonym Entity, Entitätstyp, Objekttyp, Entität
- Eine Entitätsmenge enthält Entitäten (Ausprägungen)
- **Entitätsmenge**: Zusammenfassung von Entitäten mit gleichen Eigenschaften
- **Entität**: Individuelle, identifizierbares Exemplar von Dingen, Personen oder Begriffen der realen oder Vorstellungswelt, wird durch Eigenschaften beschrieben
- muss ein **Substantiv (Singular)** sein

**Schwache Entitäten:**
- Enthalten Entitäten, die nur in **Abhängigkeit** einer anderen Entität bestehen können
- Beispiel-Diagramm: Kunde (Rechteck mit doppeltem Rand = **voll partizipierender Entitätstyp**) –erteilt– Auftrag (Rechteck mit doppeltem Rand = **schwacher Entitätstyp**)
- Der schwache Entitätstyp (Auftrag) kann ohne den voll partizipierenden Entitätstyp (Kunde) nicht existieren

**Zirkulierende Entitäten:**
- sind nach Möglichkeit zu vermeiden
- können zu Problemen bei der Implementierung führen
- Beispiel-Diagramm: Kunde –1– bestellt –n– Auftrag –1– (Auftrag gehört zu einer Rechnung, n Rechnungen erhält ein Kunde) → das bildet einen Kreislauf (Zirkel) zwischen Kunde, Auftrag und Rechnung

### 9.3 Attribute

**Attribute (Muss, Kann) – Diagramm:**

Das Diagramm zeigt zwei Entitäten mit Attributen:

**Student:**
- * Matrikelnummer (Schlüsselfeld, Mussfeld)
- * Name (Mussfeld)
- O Telefon (Kannfeld)

**Fach:**
- * Fachname (Schlüsselfeld, Mussfeld)
- * Art (Mussfeld)

Legende:
- `*` = Mussfeld (muss ausgefüllt sein)
- `O` = Kannfeld (optional)
- `unterstrichen` = Schlüsselfeld

Das obere Bild zeigt die "rohen" Daten: Student hat Matrikelnr., Name, Telefon; Fach hat Nummer, Bezeichnung, Wert – und konkrete Ausprägungen wie 0815, Ratlos, 0209/121212 etc.

**Beschreibung Attribute:**
- **Attribut**: Synonym Property, Eigenschaft
- Eigenschaft, die allen in einer Entitätsmenge enthaltenen Entitäten gemeinsam ist
- Substantiv (Singular)
- Attribute werden im ERM häufig aufgrund der Übersichtlichkeit **nicht dargestellt** (nur Primary Keys und Foreign Keys)

**Zusammengesetzte Attribute:**
- werden durch eine Kombination von mehreren Attributen gebildet
- Beispiel: Straße, Plz, Ort → zusammen ergeben sie die **Adresse**
- Das Diagramm zeigt eine geschwungene Klammer unter "Straße Plz Ort" mit dem Label "Adresse" darunter

**Mehrwertige Attribute:**
- Attribute die mehr als einen Wert aus einer definierten Wertemenge (Werteliste, Ausprägungen, Domänen) annehmen können
- Beispiel: feste Zeitintervalle (2, 4, 6 Stunden)
- Plausibilitätsprüfung im Anwendungsprogramm

### 9.4 Domänen

**Beschreibung Domänen:**
- Festlegen der Wertebereiche von Attributen
- Wertebereiche sind **entitätsmengenübergreifend**
- Die Elemente eines Wertebereiches müssen **atomar** sein
- Sinn: Beschreibung oder **Beschränkung** der Attributausprägung
  - Sicherstellen der Verknüpfbarkeit von Entitätsmengen
  - Absicherung vor falschen Eingaben

### 9.5 Beziehungen

**Beziehungen (Diagramm):**

Das Diagramm zeigt zwei Ellipsen (Mengen): Student (links, mit Erna Hippe, Rudi Ratlos, Walter Windig) und Fach (rechts, mit Maschinenbau, Recht, Volkswirtschaft). Pfeile von jedem Studenten zu den Fächern zeigen die "absolviert"-Beziehung. Darunter → das ERM: Student –absolviert– Fach.

**Beschreibung Beziehungstypen:**
- **Beziehungstyp**: Synonym Relationstyp, Assoziation, Relationship
- muss ein **Verb (Singular)** sein
- Zum Beziehungstyp gehört die **Kardinalität**
- Setzt ein oder mehrere Entities zweier Entitätsmengen in **Verbindung** miteinander

**Rekursive Beziehungen:**

Das Diagramm zeigt zunächst eine Kette: Hauptabteilungsleiter –1– ist Vorgesetzter von –n– Abteilungsleiter –1– ist Vorgesetzter von –n– Mitarbeiter. Das kann vereinfacht werden zu einer rekursiven Beziehung: Mitarbeiter –1– ist Vorgesetzter von –n– Mitarbeiter (der Pfeil geht von Mitarbeiter zurück auf sich selbst, also auf die gleiche Entitätsmenge!).

### 9.6 Kardinalitäten

**Beschreibung Kardinalitäten:**
- **Kardinalität**: Synonym Komplexitätsgrad
- Gibt an, mit wie vielen A-Entitäten eine B-Entität in Verbindung stehen kann
- Kombinationen:
  - **1:1**
  - **1:n**
  - **n:m**
- **Merke: Kardinalität immer von beiden Seiten betrachten!**

**1:1 Beziehung:**

Diagramm: Direktor –1–◇leitet◇–1– Schule
- Attribute von Direktor: Name, Titel
- Attribute von Schule: Zimmer, Art
- Bedeutung: Ein Direktor leitet eine Schule. Eine Schule wird von einem Direktor geleitet.

**1:n Beziehung:**

Diagramm: Auftrag –1–◇besteht aus◇–n– Auftragspos.
- Attribute von Auftrag: Eingangsdatum, Kundennr.
- Attribute von Auftragspos.: Art. Bezeichnung, Einzelpreis, Menge

**n:m Beziehung:**

Diagramm: Student –n–◇nimmt teil an◇–m– Klausur
- Attribute von Student: Name
- Attribute von Beziehung "nimmt teil an": Semester, Note
- Attribute von Klausur: Fach
- Bedeutung: Ein Student nimmt an keiner, einer oder mehrerer Klausuren teil, die mit einer Note bewertet werden. An einer Klausur in einem Semester nehmen n Studenten teil.
- **Warum nicht 1:n?** 1:n würde bedeuten: Ein Student nimmt an n Klausuren teil. An einer Klausur nimmt aber jeweils nur ein Student teil – das stimmt nicht!

**Auflösung n:m Beziehung:**

Das Diagramm zeigt die Auflösung des n:m als Zwischentabelle:

Aus: Student –n– nimmt teil an –m– Klausur (mit Semester, Note in der Beziehung)

Wird: Student –n– (1:n) Student_Klausur (n:1) –m– Klausur

Neue Tabellen:
- **Student**: Name (PK unterstrichen)
- **Student_Klausur**: Name (FK), Fach (FK), Semester, Note
- **Klausur**: Fach (PK)

→ Das ist exakt was wir aus dem SQL-Teil schon kennen! n:m Beziehungen werden durch eine Zwischentabelle mit zusammengesetztem PK aufgelöst.

### 9.7 Spezielles

**Generalisierung:**

Beschreibung: Vererbung von gemeinsamen Attributen von Entitäten zu einer gemeinsamen übergeordneten Entität.

Das Diagramm zeigt:
- **Person** (oben, mit Attribut P-Nr.)
  - –ist ein– Beziehung (Raute)
    - **Kunde** (unten links, mit P-Nr.)
    - **Mitarbeiter** (unten rechts, mit P-Nr., Ort, Name)

→ Person ist die übergeordnete Entität, Kunde und Mitarbeiter erben von Person. Das ist wie Vererbung in der OOP.

**Aggregation:**

Beschreibung: eine Beziehung mit Über-/Unterordnung zwischen Entitäten.

Das Diagramm zeigt:
- **Motorrad** (oben)
  - –Teil von– → **Motor** (hat Teile: Bolzen, Ventil)
  - –Teil von– → **Felge** (hat Teile: Speiche)
  - –Teil von– → **Rahmen** (hat Teile: Gabel)

→ Motorrad besteht aus Motor, Felge, Rahmen. Die Teile sind Teil von dem übergeordneten Objekt. Das ist eine "hat-ein" Beziehung, im Gegensatz zur Generalisierung die eine "ist-ein" Beziehung ist.

---

## 10 Relationen Modell

### 10.1 Grundlagen

**Relationales Datenbankmodell:**

Das relationale Modell:
- Relationale Datenmodell, **1970 von Edgar F. (Ted) Codd**
- **weit verbreitetste** Datenmodell
- Grundelement ist die **Tabelle**
- unterstützt einfache, mächtige Datenbanksprache (erstellen, manipulieren, ...)

Anforderungen an den DB-Entwurf:
- **Redundanzfreiheit** (Vermeidung von Mehrfachspeicherungen)
- **Datenintegrität** (Vollständigkeit / Nutzbarkeit der Daten)
- **Datenkonsistenz** (Widerspruchsfreiheit)

**Relationale Integritätsregeln:**

**Integrität** = Unversehrtheit:
- Keine widersprüchlichen Daten
- NICHT: Sicherstellung der Richtigkeit eingetragener Daten (das ist eine andere Sache!)

**Entity Integrität:**
- Keine Datenobjekte ohne eindeutigen Schlüssel dürfen eingegeben werden

**Referenzielle Integrität:**
- Beziehung zwischen Entitäten sind unversehrt
- Beispiel: PK-Datensatz wird gelöscht und abhängige Datensätze bleiben erhalten → das ist eine Verletzung der referenziellen Integrität!

**12 Regeln von Codd für relationale Datenbanksysteme:**

1. **Logische Informationsdarstellung** erfolgt nur durch Tabellen.
2. **Zugriff auf Attribute** erfolgt über Tabellen- und Attributname.
3. Der Wert **"Null"** muss darstellbar sein.
4. **Tabellenschemata** müssen ebenfalls als Tabelle verfügbar sein.
5. Allumfassende **(Abfrage-, Manipulations-, Definition-)Sprache** muss verfügbar sein.
6. **Views** müssen permanent aktuell gehalten werden.
7. **Einfüge-, Lösch- und Pflegeoperationen** müssen genauso mächtig sein wie die Abfragesprache.
8. **Physische Unabhängigkeit** der Anwendungen.
9. **Logische Unabhängigkeit**: Logische Einzelsichten auf die Daten sind von der logischen Gesamtheit unabhängig.
10. **Integritätsbedingungen** sind in der zu Grunde liegenden Sprache zu formulieren.
11. **Verteilte Datenbanken** sind transparent darzustellen.
12. **Integritätsbedingungen** dürfen nicht umgangen werden können.

**Tupel:**
- Eine relationale DB besteht aus Tabellen
- Objekte und Beziehungen der Realwelt (Entities) werden als Elemente der Relationen (Tupel, Tabellenzeilen) abgebildet
- Entität (eine Ausprägung/Datensatz) wird als **Tupel vom Grad n** bezeichnet (n = Anzahl der Attribute)
- Es darf zu keinem Zeitpunkt zwei Tupel mit identischen Attributwerten geben
- Die Reihenfolge der Tupel ist nicht definiert

**Felder:**
- Attribute dürfen nicht zusammengesetzt, müssen **atomar** sein
- Jedes Attribut kann einen **Wertebereich** haben
- Die Reihenfolge der Attribute ist nicht definiert
- Typen von Attributen:
  - **identifizierend** (eindeutige Abgrenzung eines Objektes zu anderen Objekten) z.B. Personalnummer
  - **klassifizierend** (Zuordnung Beziehungen zu Klassen) z.B. Zuordnung einer Kostenart oder ob Mitarbeiter leitend/nicht leitend
  - **chronologische Attribute** (Zuordnung Beziehungstyp zu Zeitpunkt/Periode) z.B. Personal bearbeitet Vorgang für einen Zeitraum
  - **deskriptive Attribute** (beschreibend) Eigenschaften eines Objektes, z.B. Materielle Anforderung oder Modellierung

**3-Ebenen-Architektur (ANSI-SPARC):**

Das Diagramm zeigt ein Schichtenmodell von oben nach unten:
- **Externes Schema / Externes Schema / Externes Schema** (drei externe Sichten nebeneinander) → logische Datenunabhängigkeit (externe/konzeptionelle Abbildung)
- **Konzeptionelles Schema** → Physische Datenunabhängigkeit (konzeptionelle/interne Abbildung)
- **Internes Schema** → Abbildung auf Speicherungs- und Datenstrukturen
- **Datenbank** (ganz unten)

**Externes Schema (Sicht):**
- Wird auch **Benutzersicht** genannt
- Teilausschnitt des logischen Schemas für jeweils unterschiedliche Anwender
- Datenschutz, Datensicherheit
- Reduktion der Komplexität für Benutzer
- Anwendungsprogramme und Benutzerdaten

**Internes Schema (Sicht):**
- Regelt wie und wo die Daten gespeichert werden sollen
- Zugriffspfade
- physische Datenstrukturen, Dateien
- Datenverteilung

**Konzeptionelles/Logisches Schema (Sicht):**
- Beschreibung sämtlicher Datenobjekte
- Darstellung der Beziehung zwischen Datenobjekten
- Definition der Integritätsbedingungen
- Unabhängig vom verwendeten Datenbanksystem
- Logische Gesamtsicht auf die Daten

**Information/Data Dictionary:**
- Strukturiertes zweckbezogenes Wissen (automatisch weiterverarbeitbar)
- Dokumentation der Datenstrukturen (Beziehungen zwischen den Daten), Datenfeldern (Wertebereiche, Format, Typ) und Datenverwendung (in welchen Anwendungen, Zugriffe)
- Synonyme: **Meta-Datenbanken, Repository, Datenkatalog**

**Überführung ERM → Relationenmodell (Theorie):**

**1:n Beispiel:**

ERM: Auftrag –1–◇besteht aus◇–n– Auftragspositionen

wird zu:

| **Auftrag** | | | | **Auftragspositionen** |
|---|---|---|---|---|
| Auftragsnr. (PK) | Eingangsdatum | Kundennr. | | Auftragsnr. (PK, FK) | Posnr. (PK) | Bez. | Preis | Menge |

→ Der PK der "1"-Seite (Auftragsnr.) wandert als FK in die "n"-Seite!

**n:m Beispiel:**

ERM: Student –n–◇nimmt teil an◇–m– Klausur (Attribute: Semester, Note in Beziehung)

wird zu:

| **Studenten** | | **Teilnahme** | | | | **Klausuren** | |
|---|---|---|---|---|---|---|---|
| Matrikelnr. (PK) | Name | Matrikelnr. (PK, FK) | Klausurnr. (PK, FK) | Semester | Note | Klausurnr. (PK) | Fach |

→ Die Beziehungstabelle "Teilnahme" mit zusammengesetztem PK aus beiden FKs!

### 10.2 Normalisierung

**Definition Normalisierung:**
Als Normalisierung bezeichnet man den **Prozess der Verbesserung der Datenstruktur** um Qualitätskriterien (= den Normalformen) gerecht zu werden. Die Qualitätskriterien sollen sogenannte **Anomalien verhindern**.

**Formen von Anomalien:**

- **Einfügeanomalie**: Ein Tupel kann nur eingetragen werden, wenn alle beteiligten Schlüsselwerte vorliegen (d.h. ein neues Buch vorliegt, dass ausgeliehen wird)
- **Löschanomalie**: Beim Löschen eines Tupel geht Information von Autor + Buch + Ausleiher verloren. Wünschenswert?
- **Änderungsanomalie**: Bei der Änderung eines Attributs müssen mehrere Tupel geändert werden (z.B.: Änderung eines Namens), andernfalls Inkonsistenzen

**Normalformen (BOYCE/CODD):**
1. Normalform (1. NF)
2. Normalform (2. NF)
3. Normalform (3. NF)

Die drei bauen aufeinander auf → höhere Zahl = **höhere Qualität**

**Warum Normalisierung?**
- Primärer Einsatz bei der Datenmodellierung
- Vermeidung unerwünschter **Abhängigkeiten**
- Eliminierung von **Redundanzen**
- Vermeidung von **Anomalien** (Delete, Insert, Update)

**Funktionale Abhängigkeit (Definition):**
Ein Attribut oder eine Attributkombination Z wird als **funktional abhängig** von einem Attribut oder einer Attributkombination Y der gleichen Relation R bezeichnet, wenn zu einem Wert von Y höchstens ein Wert von Z möglich ist. Wir schreiben auch Y → Z(R) oder einfach kurz Y → Z.

Beispiel: `Pers# ← Name` (Die Pfeilrichtung zeigt: Name ist funktional abhängig von Personalnummer)
→ Der Name ist funktional abhängig von der Personalnummer

**Volle funktionale Abhängigkeit:**
Y bestehe aus einem oder mehr als einem Attribut. Ist nun Z von Y, jedoch **nicht von einzelnen Teilen** der Attributkombination Y funktional abhängig, so ist Y **voll (funktional) abhängig**.

Beispiel 1: `Pers# ← Name` → Der Name ist **voll** funktional abhängig von der Personalnummer ✓

Beispiel 2: `Name, ISBN ← Lehrbuch` → Das Lehrbuch ist **nicht** voll funktional abhängig von dem Namen und ISBN, weil das Lehrbuch nur von einem Teil (ISBN) abhängig ist! ✗

**Ausgangssituation Normalisierungsbeispiel:**

Informationen über Studierende:
- Student 0815 heißt Meier. Er belegt Seminare in WI und VWL aus dem Fach Wiwi.
- Müller mit der Matrikelnummer 4711 belegt Seminare in Marketing, WI (Wiwi) und alte Geschichte.
- Schmidt mit der Matrikelnummer 1188 belegt ein Seminar in Trigonometrie aus dem Fach Physik.
- Student 1234 Schulz hat bisher kein Seminar belegt.
- Die Informationen, welcher Dozent unterrichtet welches Seminar fehlt.

**Erste Strukturierung (nicht normalisiert):**

| MatrNr./Name | Seminar | Fach | Professor |
|---|---|---|---|
| 0815, Meier | WI, VWL | Wiwi | (leer) |
| 4711, Müller | Marketing, WI, Alte Geschichte | Wiwi, Geschichte | (leer) |
| 1188, Schmidt | Trigonometrie | Physik | (leer) |
| 1234, Schulze | (leer) | (leer) | (leer) |

Problem: Mehrere Werte in einer Zelle, kein einheitlicher PK → verletzt 1. NF!

**1. Normalform (1. NF) – Definition:**
Eine Relation befindet sich in der ersten Normalform, wenn die Attribute klar definiert sind und wenn **alle Attribute nur atomare Werte (nicht weiter zerlegbar sind)** beinhalten.

**Schritte zur 1. NF:**
- Betrachtung einzelner Tupel (Zeilen)
- **Atomare Werte** schaffen
- Auflösung von **Wiederholungsgruppen**
- Eventuelle Erweiterung des Primärschlüssels
- Eventuell zusätzliche Informationen in das Modell einfügen
- Informationen korrigieren
- **Null-Werte im PK werden nicht erlaubt**

**Ergebnis 1. NF:**

| MatrNr | Name | Seminar | Fach | Professor |
|---|---|---|---|---|
| 0815 | Meier | WI | Wiwi | Mittel |
| 0815 | Meier | VWL | Wiwi | Klein |
| 4711 | Müller | Marketing | Wiwi | Groß |
| 4711 | Müller | WI | Wiwi | Mittel |
| 4711 | Müller | Alte Geschichte | Geschichte | Hinz |
| 1188 | Schmidt | Trigonometrie | Mathematik | Kunz |

→ Kein Schulze (1234) weil er kein Seminar hat – Null im PK nicht erlaubt!
→ Die Relation befindet sich in der ersten Normalform!
→ **PK ist zusammengesetzt: (MatrNr + Seminar)**

**2. Normalform (2. NF) – Definition:**
Eine Relation befindet sich in der zweiten Normalform, wenn diese sich in der 1. Normalform befindet, und **jedes nicht zum Schlüssel gehörende Attribut von diesem voll funktional abhängig ist**.

Problem in der 1. NF-Tabelle: "Name" ist nur von "MatrNr" abhängig, nicht von "Seminar" – das ist eine partielle Abhängigkeit! → verletzt 2. NF.

**Ergebnis 2. NF:**

Tabelle wird aufgeteilt in 2 Tabellen:

**Tabelle 1 – Studenten:**
| MatrNr (PK) | Name |
|---|---|
| 0815 | Meier |
| 4711 | Müller |
| 1188 | Schmidt |
| 1234 | Schulze |

→ Jetzt ist auch Schulze dabei! Name hängt nur von MatrNr ab.

**Tabelle 2 – Belegung (Beziehung):**
| MatrNr (PK, FK) | Seminar (PK) |
|---|---|
| 0815 | WI |
| 0815 | VWL |
| 4711 | Marketing |
| 4711 | WI |
| 4711 | Alte Geschichte |
| 1188 | Trigonometrie |

Die Tabelle wird erweitert um FBNr. (Fachbereichsnummer):

**Seminar-Tabelle (erweitert):**
| Seminar (PK) | Professor | FBNr. | Fach |
|---|---|---|---|
| WI | Mittel | 03 | Wiwi |
| VWL | Klein | 03 | Wiwi |
| Marketing | Groß | 03 | Wiwi |
| Alte Geschichte | Hinz | 16 | Geschichte |
| Trigonometrie | Kunz | 17 | Mathematik |

**3. Normalform (3. NF) – Definition:**
Eine Relation ist in dritter Normalform, wenn sie in 2. Normalform ist und es **kein Attribut, welches nicht Teil des Schlüssels ist, gibt, welches transitiv vom Schlüssel abhängt**.

Problem in der Seminar-Tabelle: Seminar → FBNr. → Fach. Das Attribut "Fach" ist **transitiv** abhängig vom Schlüssel "Seminar" (über den Umweg FBNr.) → verletzt 3. NF!

**Ergebnis 3. NF:**

Die Seminar-Tabelle wird weiter aufgeteilt:

**Tabelle – Seminar/FBNr.:**
| Seminar (PK) | FBNr. |
|---|---|
| VWL | 03 |
| Marketing | 03 |
| WI | 03 |
| Alte Geschichte | 16 |
| Trigonometrie | 17 |

**Tabelle – Fachbereich:**
| FBNr. (PK) | Fach |
|---|---|
| 03 | WiWi |
| 16 | Geschichte |
| 17 | Mathematik |

→ Jetzt keine transitive Abhängigkeit mehr. FBNr. → Fach ist eine direkte Abhängigkeit in ihrer eigenen Tabelle. 3. NF erreicht!

---

## 11 Datenbank-Systeme (DBS)

### 11.1 Einführung

#### 11.1.1 Grundbegriffe

**Definition Datenbank/DBMS/DBS:**

- **Datenbank (DB)**: zentral verwalteter Datenbestand, der über anwendungsunabhängige Zugriffsverfahren nutzbar gemacht wird
- **DBMS**: verwaltet diesen Datenbestand und ermöglicht gleichzeitigen Zugriff mehrerer Anwendungsprogramme/Nutzer
- **Datenbanksystem (DBS)**: besteht aus einem DBMS, einer DB sowie zusätzlichen Programmen, die die Bearbeitung, Verwaltung und Auswertung gespeicherter Daten vereinfachen

**Bedeutung der Daten (Zitat MARTIN 1981, S. 299):**
"Die Daten des Unternehmens sind ein solch wichtiger und wertvoller Produktionsfaktor, dass der Verantwortliche für die Daten für so wichtig wie der Finanzchef zu erachten ist."

**DBMS – Bestandteile:**
- Data Dictionary
- Datenmanipulationssprache **(DML)**
- Datendefinitionssprache **(DDL)**
- Datenkontrollsprache **(DCL)**
- Werkzeuge für Reports, Maske, Grafiken usw.

DBMS = "Software", die zum Zugriff und Modifikation der Datenbank benötigt wird

**Client-Server-Konzept (Diagramm):**

Das Diagramm zeigt 5 verschiedene Varianten der Client-Server-Aufteilung nebeneinander, von links nach rechts:
1. **Verteilte Präsentation**: Datenbank + Anwendungslogik auf Server, Präsentation auf Client und Server geteilt
2. **Ausgelagerte Präsentation**: Datenbank + Anwendungslogik auf Server, nur Präsentation auf Client
3. **Verteilte Verarbeitung**: Datenbank auf Server, Anwendungslogik auf Server UND Client geteilt, Präsentation auf Client
4. **Ausgelagerte Datenhaltung**: Datenbank auf Server, Anwendungslogik + Präsentation auf Client
5. **Verteilte Datenhaltung**: Datenbank auf mehreren Servern, Präsentation auf Client

Oben: Serverprozess → ganz links: Datenserver + Anwendungsserver. Unten: Clientprozess → ganz rechts: Client. Gestrichelte Linie trennt Server (oben) von Client (unten).

**Definition Constraint/Trigger:**
- Ändert sich ein Datensatz (oder wird er eingefügt oder gelöscht), lösen manche Datenbanken einen Alarm aus → einen sogenannten **Trigger**
- Ein **Constraint** (engl.: Einschränkung) wird häufig in Programmiersprachen verwendet, um den Wertebereich einer Variablen einzuschränken

**Dateiorientierte Datenorganisation (Problem-Diagramm):**

Das Diagramm zeigt: 3 Anwendungen (A, B, C) für Auftragserfassung, Kundenverwaltung, Rechnungsprüfung. Jede Anwendung hat eigene Dateien (A→Datei A+B, B→Datei C+D, C→Datei E+F). Alle drei Dateien-Paare enthalten "Kundenadressen" → **Redundanz**! Das ist das Problem mit dem roten X markiert.

**Datenbankorientierte Datenorganisation (Lösung-Diagramm):**

Das Diagramm zeigt: Die gleichen 3 Anwendungen (Auftragserfassung, Kundenverwaltung, Rechnungsprüfung) greifen jetzt alle auf **ein zentrales Datenbanksystem** zu, das aus DBMS, Datenbank (mit "Kunden") und Data Dictionary besteht. Keine Redundanz mehr!

**Vergleich Dateisystem vs. Datenbanksystem (Tabelle):**

| Eigenschaft | Dateisystem | Datenbanksystem (relational) |
|---|---|---|
| Datenunabhängigkeit | Keine, da Datenstruktur im Programm | Durch Projektion und Views sowie Trennung in externes, konzeptionelles und physisches Schema |
| Datensicherheit | Tagessicherung | Logging aller Datenänderungen |
| Zugriffsschutz | Dateiebene | Auf Satz- und Feldebene, inhaltsbezogen |
| Beziehungen | – | Durch Fremdschlüssel |
| Redundanz | hoch | gering |
| Konsistenz | – | Erhaltung wird durch Transaktionskonzept unterstützt |
| Integrität | – | Referentielle Integrität; Definition von Integritätsregeln |
| Aktualität | weitgehend | Ja, durch direkte Änderung |
| Abfragesprache | – | SQL |
| Schneller Zugriff | B*-Baum, Hash | Indizes |
| Zugriffsform | Einzelsatz-Zugriff | Mengenzugriff |
| Synchronisation im Mehrbenutzerbetrieb | Sperren auf Satzebene | Sperren auf Transaktionsebene |
| Tools | wenige | (Viele) Tools für die Anwendungserstellung |

**Entwicklungsumgebungen – bekannte DBMS:**

| Produkt | Hersteller | Typ |
|---|---|---|
| Access | Microsoft | Relational |
| ADABASE | Software AG | Relational |
| DB2 | IBM | Relational |
| ASE | Sybase | Relational |
| Informix | Informix | Netzwerk |
| Oracle | Oracle | Relational |
| UDS | SNI | Netzwerk |
| SQL-Server | Microsoft | Relational |

→ Oftmals durch firmeninterne Gegebenheiten oder Anforderungen des Auftraggebers vorgegeben.

**Anforderungen an ein DBMS (Diagramm):**

Das Diagramm zeigt ein Netz/Stern aus Anforderungen, alle zeigen auf eine Mitte (DBMS-Symbol):
- **Flexibilität** (oben)
- **Effizienz/Performanz** (oben rechts)
- **Datenintegrität (Master/Detail)** (rechts)
- **Benutzungsfreundlichkeit** (unten rechts)
- **Datenunabhängigkeit** (unten)
- **Redundanzfreiheit** (unten links)
- **Mehrfachzugriff** (links)
- **Datensicherheit** (oben links)
- **Datenschutz** (ganz links oben)

#### 11.1.2 Verteilung und Speicherung

**Definition Datenverteilung:**
Logisch zusammenhängende Datenbestände werden physisch verteilt (Verwaltung erfolgt übergeordnet durch das DBMS).

**ANSI-SPARC-Dreischichtenmodell (Diagramm):**

Das Diagramm zeigt das bekannte Modell von oben nach unten:
- Externes Schema | Externes Schema | Externes Schema (drei Sichten nebeneinander)
- ↕ logische Datenunabhängigkeit (externe/konzeptionelle Abbildung)
- **Konzeptionelles Schema** (Mitte, blau hervorgehoben)
- ↕ Physische Datenunabhängigkeit (konzeptionelle/interne Abbildung)
- **Internes Schema**
- ↓ Abbildung auf Speicherungs- und Datenstrukturen
- **Datenbank** (ganz unten, blau hervorgehoben)

**Gründe für Datenverteilung (Diagramm):**

Das Diagramm zeigt ein Netz mit 6 Punkten:
- **Verfügbarkeit** (oben)
- **Sicherheit** (oben rechts)
- **Effizienzsteigerungen** (rechts)
- **Mobilität** (unten)
- **Skalierbarkeit** (links)
- **Zuverlässigkeit** (oben links)

**Strukturierte Datenspeicherung in einer Datenbank:**
- Anwendung und Daten sind voneinander **unabhängig**
- Möglichkeiten eines DBMS:
  - anwendungsneutralen Zugriff auf Daten
  - Regelung der Zugriffsrechte
  - Mehrbenutzerfähigkeit über Netzwerke
  - Vermeidung von Redundanz, Gewährleistung von Konsistenz
  - Recovery-Konzept (Schutz vor Datenverlust-Datensicherheit)
- **DBMS als neue Schicht zwischen Anwendung und Daten**

#### 11.1.3 Historie

**Historische Entwicklung (Tabelle):**

| Jahrzehnt | Technik | Zugriffsart |
|---|---|---|
| 1950 | Lochkarte(n)/Magnetband | sequenziell |
| 1960 | Festplatte | random access |
| 1970 | Netzwerk, Hierarchisches DBMS | random access |
| 1980 | Relationale DBMS | random access |
| 1990 | Postrelationale DBMS | random access |

1990er = Postrelationale DBMS unterteilt in:
- objektrelationale (ORDBMS)
- objektorientierte (OODBMS)

#### 11.1.4 Datenbankmodelle

**Übersicht Datenbankmodelle (Diagramm):**

Das Diagramm zeigt 4 Datenbankmodelle als Baum:
- **Datenbankmodelle** (Root)
  - **Hierarchie** (mit Baumstruktur-Beispiel)
  - **Relationales** (mit 1:n Beispiel Kunde→Auftrag→Artikel)
  - **Netzwerk** (mit Netz-Beispiel)
  - **Objektorientiert** (mit Klasse/Methoden-Beispiel)

**Hierarchisches Datenbankmodell:**

Baumartige Verknüpfung verschiedener Sätze:
- Jeder Entitytyp hat nur **einen Vorgänger** (Ausnahme 1. Ebene)
- Jeder Entitytyp kann **mehrere Nachfolger** haben
- Beispiel: **IMS von IBM**

Vorteile:
- Effiziente "computergerechte" Datenorganisation
- sehr schnell

Nachteile:
- Benutzer muss die Datenstruktur genau kennen
- **Redundanzen sind möglich** (da keine n:m Beziehung möglich ist!)

**Beispiel Hierarchisches Modell (Diagramm):**

Erst abstrakt: "Eine Abteilung kann mehrere Mitarbeiter haben. Jeder Mitarbeiter kann in mehrere Projekten arbeiten." → Abteilung → Mitarbeiter → Projekt LINKS. "In jedem Projekt arbeiten ein oder mehrere Mitarbeiter" → Projekt → Mitarbeiter RECHTS. → Das zeigt warum Redundanz entsteht: Mitarbeiter taucht in beiden Hierarchien auf!

Dann konkret: Firma → Einkauf und Verkauf → Einkauf hat Projekt 1 und Projekt 2 → Projekt 1 hat Meier + Müller, Projekt 2 hat Schulze. Verkauf hat Projekt 3 → Projekt 3 hat Meier + Reinhard. **MEIER erscheint zweimal** weil er in zwei Projekten ist!

**Netzwerk Datenbankmodell:**

Entitytypen können **mehrere Vorgänger und Nachfolger** haben. Es kann mehrere Wege zu einer Information geben.

Vorteile:
- Relativ einfache Modellierung, da n:m Beziehung erlaubt ist
- Komplexe Strukturen können abgebildet werden

Nachteile:
- **Unübersichtlichkeit**
- Benutzer muss die Datenstruktur genau kennen

**Beispiel Netzwerk (Diagramm):** Gleiche Firma-Struktur wie oben, aber Meier erscheint nur EINMAL und hat Querverbindungen zu beiden Projekten. Keine Redundanz!

**Objektorientiertes Datenbankmodell:**
- Integration objektorientierter Eigenschaften in DBS
- **Kapselung**
- **Vererbung**
- **Polymorphismus**
- Kenntnisse der Objektorientierung erforderlich
- Darstellung komplexer Strukturen

#### 11.1.5 Rechte und Sicherheit

**Vergabe von Benutzerrechten:**

Rechte:
- **Insert** (einfügen von Datensätzen → erstmaliges anlegen)
- **Update** (aktualisieren von Datensätzen → überschreiben)
- **Delete** (löschen von Datensätzen → unwiderrufliches entfernen von Datensätzen)
- **Select** (anzeigen von Datensätzen)

Möglichkeiten:
- **Datenbankgesteuert**
- **Tabellengesteuert** (Individualsoftware)
- **Rollenbasiert**

**Datenbankgesteuert (SQL):**
```sql
grant insert, delete, select, update Benutzer on benutzerrechte to SH00002;
```

**Tabellengesteuert:**
```sql
create table benutzerrechte (
    benutzer varchar(20) constraint primary key,
    s number(1) not null,
    u number(1),
    d number(1),
    i number(1));
```

Beispiel-Tabelle für Tabellengesteuert:
| Benutzer | S | U | D | I |
|---|---|---|---|---|
| SH0002 | 1 | 1 | 0 | 1 |
| WW0034 | 1 | 0 | 0 | 0 |
| LE00123 | 1 | 0 | 0 | 1 |
| HH0111 | 1 | 1 | 1 | 1 |

**Profilgesteuert (SAP-Beispiel):**

Das Diagramm zeigt eine Tabelle in SAP-Stil mit Transaktionen (ILO1 = Anlegen, ILO2 = Andern, ILO3 = Anzeige) und Rollen (Stammdaten, Leiter, Vorarbeiter, Arbeiter ohne Auftragsbearbeitung, Arbeiter mit Auftragsbearbeitung). Kreuze zeigen an, welche Rollen welche Transaktionen ausführen dürfen:
- ILO1 (Anlegen): nur Stammdaten ✗
- ILO2 (Andern): nur Stammdaten ✗ (nur Leiter kann ändern)
- ILO3 (Anzeige): alle dürfen anzeigen ✗ ✗ ✗ ✗ ✗

**Datensicherung – Elemente (Diagramm):**

Das Diagramm zeigt einen Baum mit "Elemente" oben, dann 3 Äste:
1. **Grundsätze**: geschützt, rekonstruierbar (wiederherstellbar), überprüfbar (Revisionen), einbruchssicher (gegen bewusste Manipulation)
2. **Benutzeridentifizierung**: User, Kennwort
3. **Berechtigung**: Funktionsberechtigung, Tabellenberechtigung, Feldberechtigung

### 11.2 Relationenmodell

#### 11.2.1 Locking und Locks

**Mehrfachzugriff/Locks:**

Überschneidungen:
- mehrere Benutzer greifen zum gleichen **Zeitpunkt** auf Datenbestände zu (z.B. 2 Reisebüromitarbeiter wollen den letzten freien Platz buchen)
- Datenbankobjekte können (kurzzeitig) für eine Transaktion **gesperrt** werden

Lock-Möglichkeiten:
- ein **Feld**
- einen **Datensatz**
- komplette **Tabelle** (Administration)
- komplette **Datenbank** (Administration)

**Lock-Arten:**
- **Exclusive Locks**: Auf das gesperrte Datenbankobjekt ist kein Zugriff möglich
- **Shared Locks**: Lesen erlaubt, keine Manipulation

**Logfiles:**
- Alle durchgeführten Änderungen werden in einem **Logfile** protokolliert
- Im Falle eines Ausfalls kann der verloren gegangene Inhalt **rekonstruiert** werden
- existiert eine Ausgangszustand der DB zum Zeitpunkt t, so kann mit Hilfe der Logfiles der Zustand der DB zu jedem beliebigen Zeitpunkt **t + x** wieder hergestellt werden

**Erstellung Sicherheitskonzept:**
- Views als Sicherheitsmedium einrichten (Achtung Performance)
- Zugriffsregelung konzipieren und vergeben
- Sicherheitsverfahren konzipieren
- Backup konzipieren
- Berechnung der Datenbankmengen inkl. Puffer durchführen
- Eingabefehler durch Plausibilitätsprüfungen vermeiden

#### 11.2.2 Datenorganisation

**Sequenzielle Speicher:**

Beschreibung:
- Datensätze werden unmittelbar nacheinander abgespeichert
- können nur in der gespeicherten Folge verarbeitet werden
- Verwendung: z.B. Backup-Medium

Suchverfahren: **sequenziell** (nur das!)

**Adressierbare Speicher:**

Beschreibung:
- jeder beliebige Datensatz mit Kenntnis der Adresse sofort gelesen, geändert, gelöscht oder eingefügt
- Magnetplatte, Diskette, CD, RAM, ZIP-Medien

Suchverfahren:
- sequenziell
- **indizierte Organisation**
- **gestreute Organisation**

**Indizierte Organisation (Definition):**
Unter einem Index versteht man in der Informationsverarbeitung eine **Hilfsdatei oder -tabelle**, deren Datensätze neben den Schlüsseln der Hauptdatei die **Adressen** der zu diesem Schlüsseln gehörenden Datensätze beinhalten.

**Indizierte Organisation (Beispiel – Diagramm):**

Das Diagramm zeigt zwei Tabellen nebeneinander:

**Hauptdatei:**
| Adresse | Name | Ort |
|---|---|---|
| 1 | Gross | Essen |
| 2 | Klein | Bochum |
| 3 | … | … |
| 4 | … | … |

**Indexdatei:**
| Name | Adresse |
|---|---|
| Klein | 2 |
| … | … |
| Gross | 1 |
| … | … |

Darunter: Überlaufbereich (für neue Einträge die noch nicht einsortiert sind)

Der **Adressverweis** stellt die Verbindung zwischen Haupt- und Indexdatei dar. Zugriff von Index auf Hauptdatei:
- **unsortierter Index**: gesamter Index muss durchsucht werden
- **sortierter Index**: Suchprozess wird verkürzt

**Physisch sortierter Index:**

Inhalt:
- Reihenfolge der Speicherung entspricht der Sortierreihenfolge
- auf dem Datenspeicher wird der Index physisch gespeichert
- muss ständig aktualisiert werden

Einfügen von Datensätzen:
- **Überlaufbereich**, damit Daten nicht immer neu sortiert werden müssen
- wird ein Datensatz gesucht: 1. suche im oberen Teil per Index, 2. sequenzielle Suche im Überlaufbereich
- regelmäßige **Reorganisation** muss durchgeführt werden, damit alle Daten wieder sortiert sind

**Binäres Suchen:**
- Schnell, effizient, Voraussetzung = Daten sind sortiert
- Halbieren der Datenmenge bis man das Ergebnis gefunden hat (Vergleich der Adressenschlüssel)
- Beispiel: Suche der Zahl 297 (Zahlen von 1 - 1023)
  - 1 - 1023 (halbieren) → 512 Suchwert größer oder kleiner?
  - 0 - 512 (halbieren) → 256 Suchwert größer oder kleiner?
  - 256 - 512 (halbieren) → 384 Suchwert größer oder kleiner?
  - … (weiter bis 297 gefunden)

**M-Wege Suchen:**
- Alternative zum Binären Suchen
- der sortierte Datenbe

**M-Wege Suchen (Fortsetzung):**

- Alternative zum Binären Suchen
- der sortierte Datenbestand wird in **Blöcke** eingeteilt
- der Suchschlüssel wird zuerst mit dem **letzten Element des ersten Blockes** verglichen
- Ist der Suchschlüssel größer → Übergang zum nächsten Block
- Ist der Suchschlüssel kleiner → wird durch das binäre Suchverfahren weitergesucht

**M-Wege Suchen Beispiel (Diagramm):**

Das Diagramm zeigt Indexdatei und Hauptdatei nebeneinander:

**Indexdatei:**
| rel. Adresse | Name | Adressverweis |
|---|---|---|
| 1 (Block 1) | Becker | 4 |
| 2 (Block 1) | Hansen | 6 |
| 3 (Block 1) | Müller | 1 |
| 4 (Block 1) | Rehagel | 8 |
| 5 (Block 2) | (leer) | 2 |
| 7 (Block 2) | (leer) | (leer) |

**Hauptdatei:**
| Nr. | Adressverweis | Autor | Titel |
|---|---|---|---|
| 344 | 4 | Hansen | Hallo |
| 239 | 6 | Müller | Tag |
| 234 | 1 | Becker | Abend |
| 245 | 8 | Rehagel | Morgen |
| 222 | 2 | Schön | Nacht |

**Logisch versus Physisch sortierter Index:**

- Problem physisch sortierte Datenbestände → **Reorganisation** notwendig
- seltene Reorganisation → Suchzeiten **verlängern** sich durch langsames Suchen im Überlaufbereich
- regelmäßige Reorganisation → Reorganisationsläufe brauchen **erhebliche Rechnerzeiten**
- Logisch sortierter Index → **keine Reorganisation** ist notwendig
- zwei Methoden: **Kette** und **Baum**

### Kette (logisch sortierter Index)

- in jedem Datensatz wird die Adresse (**Pointer**) des in der Sortierreihenfolge nachfolgenden Satzes gespeichert
- **Anker** = Der Zeiger, der auf den ersten Datensatz zeigt

Ausgangspunkt: `Anker → Elson → Hansen → Mauser → Müller`

**Einfügen:** Neuer Datensatz "Karl" wird ans Ende des physischen Datenbestandes geschrieben. Es wird nur der **Zeiger verändert** (Mauser zeigt jetzt auf Karl, Karl zeigt auf Müller).

`Anker → Elson → Hansen → Mauser → Müller → Karl` (mit Umleitung)

**Löschen:** "Mauser" wird gelöscht → Es werden nur die Zeigeradressen geändert. Speicherplatz des gelöschten Datensatzes wird als überschreibbar gekennzeichnet.

`Anker → Elson → Hansen → [Mauser gelöscht] → Müller`

- **Vorteil:** einfacher Änderungsdienst
- **Nachteil:** nur **sequenzielles Suchen** möglich (von Adresse zu Adresse), z.B. bei Arbeitsspeichern

### Baum (logisch sortierter Index)

**Definition:** Eine Baumstruktur besteht aus einer Menge von Knoten und Kanten. Jede Kante zeigt auf einen Knoten. Drei Eigenschaften:
- Es gibt genau einen Knoten, der keinen Vorgänger hat → **Wurzel (Root)**
- Jeder Knoten, außer der Wurzel, hat genau einen unmittelbaren Vorgänger
- Zu jedem Nichtwurzelknoten gibt es genau **einen Weg von der Wurzel zum Knoten**

**Einfügen Beispiel (Diagramm):**

Der Baum zeigt: Hansen (Wurzel) → Danten (links), Wedelkind (rechts). Danten → Elson (links). Wedelkind → Mauer (links), Winter (rechts). Mauer → Karl (links), Müller (rechts).

"Karl" einfügen:
- Karl größer als Hansen? Ja → nach rechts
- Karl größer als Wedelkind? Nein → nach links
- Karl größer als Mauer? Nein → nach links
- Einfügen des Knotens an der logischen Position des Baumes

**Löschen:**
- Einfaches streichen von "Müller" (wenn der zu löschende Knoten keinen oder einen Nachfolger hat)
- "Wedelkind" löschen → **Vertauschoperation**: der nächst kleinere oder nächst größere Knoten ersetzt den zu löschenden Knoten → **aufwendige Vertauschoperation**

**Suchen:** Einfache Vergleichsoperationen

**Probleme:**
- Bäume können auf beiden Seiten sehr **unausgeglichen** sein – kommt auf die eingefügten Datensätze an → Daten müssen doch reorganisiert werden
- **Besser als Kette**, schlechter als binäres und M-Wege-Suchen
- Einsatz in DB-Systemen!

### Gestreute Organisation (Hash)

**Gestreute Organisation (I/V):**
- Bei der gestreuten Organisation wird **direkt aus dem jeweiligen Schlüssel die Adresse** des zugehörigen Datensatzes **errechnet**

**Gestreute Organisation (II/V) – Probleme:**
- Welche Funktion soll für die Berechnung verwendet werden?
- Da die Anzahl der verfügbaren Speicherplätze i.d.R. **geringer** ist als die der möglichen Schlüssel, muss eine Funktion gewählt werden, die eine Doppelbelegung (**Kollision**) einer Adresse zulässt. Die Art der Behandlung derartiger Kollisionen beeinflusst die Zugriffsdauer wesentlich

**Hash-Funktion:**
- Hier wird aus alphabetischen, numerischen oder alphanumerischen Schlüsseln eine Menge von Adressen **berechnet**
- Bei Kollisionen → sequenziell hintereinander schreiben (**Überlaufbereich**)

**Gestreute Organisation (III/V) – Beispiel:**

Diagramm zeigt: Schlüssel "Hansen" → Berechnung → Adresse in Speicherbereiche

- 10-stelliges alphabetisches Schlüsselfeld mit dem Inhalt "Hansen"
- Zeichen 8 Bit = 256 Werte (0-255)

**Gestreute Organisation (IV/V) – EBCDIC-Berechnung:**

Die Tabelle zeigt die EBCDIC-Kodierung von "Hansen":

| Position | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| 2^n | 2⁹ | 2⁸ | 2⁷ | 2⁶ | 2⁵ | 2⁴ | 2³ | 2² | 2¹ | 2⁰ |
| Buchstabe | H | A | N | S | E | N | (leer) | (leer) | (leer) | (leer) |
| EBCDIC | 100 | 193 | 213 | 226 | 197 | 312 | 64 | 64 | 64 | 64 |
| Wert | 100*2⁹ | 193*2⁸ | 213*2⁷ | 226*2⁶ | 197*2⁵ | 312*2⁴ | 64*2³ | 64*2² | 64*2¹ | 64*2⁰ |

Rechnung:
- 100 * 2⁹ + 193 * 2⁸ + … + 64 * 2⁰ =
- 100 * 2569 + 193 * 2568+ … + 64 * 2560 =
- **948048930278549498118208** → Schlüssel "Hansen"

**Schlüsseltransformationsfunktion (engl. Hash function):** riesige Anzahl von möglichen Schlüsseln auf eine akzeptable Menge von Adressen abbilden.

Rest der Division 948048930278549498118208 / 1117 = **403 [Adresse]**

**Gestreute Organisation (V/V) – DML:**
- **Einfügen** = sehr einfach (über Formel)
- **Löschen** = sehr einfach (löschen aus Speicherraum)
- **Suchen** = sehr einfach (effizient) sofern keine Kollisionen entstehen, z.B. Arbeitsspeicher

---

## 11.3 Online Transaction Processing (OLTP), Data Warehouse (DWH) und Data Mining

### 11.3.1 Management Information System (MIS)

**Managementunterstützungssysteme:**
- sind die Summe aller Informationssysteme zur **Unterstützung** sämtlicher Managementebenen

**Pyramide der Managementebenen (Diagramm):**

Das Diagramm zeigt eine Pyramide mit 3 Ebenen von unten nach oben:
- **Mittleres Management** (unten) → **Management Information System (MIS)**
- **Stäbe & Assistenten** (Mitte) → **Decision Support System (DSS)**
- **Top** (oben) → **Executive Information System (EIS)**

**Entstehung (Zeitstrahl-Diagramm):**

Das Diagramm zeigt einen Zeitstrahl von 1960 bis 2010 (X-Achse = Jahr, Y-Achse = Technologie), mit farbigen Balken die zeigen wann die Technologien entstanden/verbreitet waren:
- **MIS**: ca. 1960-1975
- **DSS**: ca. 1975-1990
- **EIS**: ca. 1985-2000
- **OLAP**: ca. 1990-2010
- **MOLAP/ROLAP**: ca. 1995-2010

→ Jede Technologie baut auf der vorherigen auf!

**MIS – Beschreibung:**
- sind Informationssysteme, die Mitarbeiter bei der Erledigung ihrer täglichen anfallenden Fachaufgaben unterstützen (**Routineaufgaben**)
- Orientierung auf operative, meist interne Informationen (**harte Informationen**)
- **Berichtsorientierung** mit Standardberechnungen (z.B. Summen-, Durchschnittsbildung)
- Basis für DSS und EIS

**DSS – Beschreibung:**
- computergestütztes Informationssystem, das einen oder mehrere **Entscheidungsträger** bei **semistrukturierten Entscheidungsprozessen** unterstützen
- **Algorithmische Orientierung**
- Modell- und Methodendatenbanken
- Sensitivitätsbetrachtungen/Zielwertberechnungen

**Methoden im DSS:**
- **Finanzmathematische Methoden:** Kapitalwertmethode, Annuitätenberechnungen, Interne Zinsfußmethode, Diskontierungs-/Inflationsberechnungen
- **Statistische Methoden:** Risiko-Analyse (Mittelwertbetrachtungen (Modus, Median usw.), Regressionsanalysen/Prognose (Forecasting)
- **What-if-Methoden:** Sensitivitätsbetrachtungen, Zielwertanalysen, Signifikanztests
- **Umfassende Modelle:** Modelle für multidimensionale Konsolidierungen, Modelle zur Investitionsanalyse, Modelle für Vertriebs-/Marketingauswertungen

**EIS – Beschreibung:**
- computergestütztes Informationssystem, das es einem **Top Manager (Executive)** in Abhängigkeit von seinen individuellen **kritischen Erfolgsfaktoren (critical success factor (CSF))** erlaubt, auf einfache Art und Weise auf externe und interne Daten zuzugreifen

---

### 11.3.2 Data Warehouse (DWH)

**Data Warehouse – Definition:**

Ist ein umfassendes Konzept zur **Entscheidungsunterstützung** von Mitarbeitern aller Bereiche und Ebenen. Kern ist eine integrierte DB mit entscheidungsrelevanten Informationen über die Geschäftsfelder, die aus den operativen DB und externen Quellen **bedarfsgerecht destilliert** wird. Der direkte Zugriff wird den Endbenutzern durch einen **Informationskatalog** erleichtert, der über die Inhalte, Formate und Auswertungsmöglichkeiten des Data Warehouse Auskunft gibt. Eine dritte wesentliche Komponente sind die **Softwarewerkzeuge und Anwendungsprogramme**, mit denen Daten des Data Warehouse abgefragt, transformiert, analysiert und präsentiert werden können.

**Data Mining (Neuronale Netze):**

Bezeichnet man die softwaregestützte Ermittlung **bisher unbekannter Zusammenhänge, Muster und Trends** in sehr großen DB. Dabei kann der Benutzer bestimmte Ziele vorgeben, für die das System angemessene Beurteilungskriterien ableitet und damit die Objekte der DB analysiert. Oder das System teilt automatisch auf eine vage Frage hin eine gegebene Menge von Objekten in **Cluster** auf.

**Data Warehouse Merkmale:**

- **Subjektorientierung:** Operative Daten werden von Applikationen weiterverarbeitet. Dispositive Daten werden vom Manager zur Unterstützung seiner Entscheidungen benötigt
- **Integration:** Data-Warehouse nutzt Daten aus verschiedenen Quellen und formalisiert sie für die Auswertung (Report) neu
- **Zeitbezogenheit:** Operative Daten entsprechen aktuellem Stand. Dispositive Anwendungen benötigen auch **Daten aus der Vergangenheit**
- **Beständigkeit:** Operative Daten werden laufend durch die Anwendungen überschrieben. Data-Warehouse **liest nur Daten** (kein Überschreiben!)

**Data Warehouse – Gründe (warum braucht man es?):**
- "Wie laufen unsere Kerngeschäfte?" → Unternehmensfakten (-wissen), bestehen Möglichkeiten, auf die man reagieren soll?
- "Ich brauche diese Information sofort!" → Herkömmliche Berichterstattung funktioniert nicht; Ad-hoc Abfragen gibt es nicht in herkömmlichen Operativsystemen
- "Wie sah die Entwicklung vor einem Jahr aus?" → historische Daten, subjektorientierte Daten
- "Warum habe ich keinen Zugriff auf diese Informationen?" → keine gewöhnliche DB, verschiedene Informationsquellen

**Data Warehouse – Ziele:**
- **Unternehmensweite konsistente Daten** = eine Datenquelle für Berichte und Analysen
- **Bessere Performance** bei ad-hoc-Anfragen = Trennung zwischen OLTP-Tabellen und Tabellen des Abfragesystems
- **Einfache Zugriffsmöglichkeiten** durch den Endbenutzer = leistungsfähige Werkzeuge für das Reporting, Zugriff ohne vorherige Einmischung der EDV-Abteilung

**Data Warehouse Architektur (I/II) (Diagramm):**

Das Diagramm zeigt einen Datenfluss von links nach rechts:

Linke Seite (Quellen):
- **operative Batchdaten** (oben)
- **operative Transaktionsdaten** (Mitte)
- **externe Daten** (unten)

→ Diese fließen alle in die **Data Warehouse Management Software** (Mitte)

Rechte Seite (Output):
- **Meta Daten** (oben rechts)
- **Dispositive Datenbank** (Mitte rechts)
- **Werkzeuge für den Datenzugriff** (ganz rechts)

**Beschreibung:** Werkzeuge formen die operativen Daten um, speisen sie in eine dispositive Datenbank ein und stellen sie dem Endanwender bereit. Die benötigten Definitionen sind in den **Meta-Daten** festgehalten.

**Data Warehouse Architektur (II/II) (Diagramm):**

Das Diagramm zeigt eine Schichtenarchitektur von unten nach oben:
- **Operative Systeme** (ganz unten) → Datenübergabe → **Data Warehouse** (Mitte)
- Data Warehouse ↔ **Data Dictionary** (links)
- Data Warehouse → Datenzugriffe + Datenanalysen → **Geschäftsmanagement** (oben)
- Geschäftsmanagement → Abfragen, Auswertungen (links) + Grafische Darstellung (rechts)

---

### 11.3.3 Online Analytical Processing (OLAP) und Online Transaction Processing (OLTP)

**Vergleich OLTP vs. OLAP (Tabelle):**

| Eigenschaft | Operative Datenbanken / OLTP (Online Transaction Processing) | Informative Datenbanken / OLAP (Online Analytical Processing) |
|---|---|---|
| **Transaktionsvolumen** | hohes Volumen | mittleres bis niedriges Volumen |
| **Antwortzeit** | sehr schnell, im Sekundenbereich | normal, bis mehrere Minuten |
| **Update** | hohe Frequenz, permanent | niedrige Frequenz |
| **Betrachtungsperiode** | aktuelle Periode | Vergangenheit – Zukunft |
| **Umfang** | anwendungsintern | anwendungsübergreifend |
| **Aktivitäten** | operativ, detailliert | analytisch, taktisch |
| **Abfragen** | vorhersehbar, periodisch | unvorhersehbar, "ad hoc" |
| **Niveau der Daten** | detailliert | aggregiert, aufbereitet |
| **Verarbeitungseinheit** | Datensatz, eindimensional | Matrizen (Array), multidimensional |
| **Zeithorizont** | 1-3 Monate | mehrere Jahre bis zu Jahrzehnten |
| **Datenaktualität** | permanent gegeben | nur nach Update gegeben |

**OLAP – Kennzeichen:**
- OLAP-Regeln
- Historisch Weiterentwicklung von **EIS**
- **Mehrdimensionale** Sichten auf die Daten
- Flexibles Bewegen durch unterschiedliche **Verdichtungsebenen**
- **Slice & Dice** = Benutzer können einen bestimmten Ausschnitt der im Hypercube aggregierten Daten entlang jeder vorgesehenen Dimension "schneiden" oder "drehen", um so einen Überblick aus verschiedenen Blickwinkeln zu erhalten
- **Drill-Down** = Ein Drill-Down ermöglicht dem Benutzer die Auffächerung (verfeinern) aggregierter Informationen, um mehr Details zu erfahren → **Drill-Up** (umgekehrt: aggregieren)
- Wenig Benutzer
- Zugriff auf **historische Daten** notwendig
- Anwendungsbeispiel: **Kaufverhalten eines Kunden** eines Einzelhandelkaufhauses

**OLTP – Kennzeichen:**
- **Viele Benutzer** die vordefinierte SQL-Anweisungen ausführen
- **Kurze Transaktionen**
- Anwendungsbeispiel: **Auftragsverwaltungs- oder Reservierungssystem**

---

das wars mit den slides! kurzes zusammenfassen was wichtig ist:

die wichtigsten dinge die man kennen muss:

- **M-Wege Suchen** = datenbestand in blöcke einteilen, vergleich mit letztem element des blocks, bei größer → nächster block, bei kleiner → binäres suchen im block
- **Kette** = zeiger auf nächsten datensatz, kein reorganisationsaufwand, aber nur sequenziell suchbar. einfügen: nur zeiger ändern. löschen: nur zeiger ändern
- **Baum** = baumstruktur mit wurzel, knoten, kanten. einfügen durch vergleich. löschen aufwendig bei mehreren nachfolgern. suchen einfach. kann unausgeglichen werden
- **Hash/Gestreute Organisation** = adresse direkt aus schlüssel berechnen. problem kollisionen. hash-funktion rechnet schlüsselwert aus und nimmt rest durch anzahl der speicherplätze
- **MIS, DSS, EIS** = pyramide der managementsysteme. MIS = routineaufgaben mittleres management. DSS = semistrukturierte entscheidungen. EIS = top manager
- **Data Warehouse** = entscheidungsunterstützung, subjektorientiert, integriert, zeitbezogen, beständig (nur lesen!). merkmale auswendig lernen!
- **Data Mining** = unbekannte zusammenhänge in großen datenbanken finden, cluster bilden, neuronale netze
- **OLAP vs OLTP** = die vergleichstabelle ist prüfungsrelevant! OLTP = viele benutzer, kurze transaktionen, aktuell. OLAP = wenig benutzer, historisch, multidimensional, ad-hoc
- **Slice & Dice** = ausschnitt aus hypercube "schneiden" oder "drehen"
- **Drill-Down** = von aggregiert auf detail runterzoomen. Drill-Up = umgekehrt, von detail auf aggregiert hochzoomen

## 12 NULL-Werte der Datenbank

### 12.1 Grundlagen

**Was NULL überhaupt ist:**
- **NULL-Werte sind entgegen ihrem Namen eben keine Werte**
- NULL zeigt an, dass ein Wert **fehlt** – zum Beispiel weil zur Zeit der Datenerfassung der Wert unbekannt war
- NULL führt zu einer **dreiwertigen Logik** (wahr, falsch, **unbekannt**)
- diese dreiwertige Logik führt zu Missverständnissen und bei unvorsichtigem Arbeiten z.B. mit SELECT zu "falschen" Ergebnissen
- Quelle: teilweise aus dem Artikel "Nulls: Nothing to Worry About" von Lex de Haan und Jonathan Gennick im Oracle Magazine, Juli/August 2005

Das Bild auf der ersten Slide zeigt die arbeitsagentur.de Website mit einem Screenshot, der für Januar 2005 bei Arbeitslose, ± zum Vorjahresmonat, Arbeitslosenquote, Vorjahresmonat, Gemeldete Stellen und ± zum Vorjahresmonat alle **NULL** als Wert anzeigt. Das ist ein reales Beispiel dafür, dass Daten zum Erhebungszeitpunkt einfach noch nicht vorhanden waren.

### 12.2 Beispieltabellen

**Tabelle DEPT_M:**
```
DEPTNO  DNAME           LOC
------  -----           ---
10      HQ              UTRECHT
20      SALES           MUNISING
30      MANUFACTURING   NOVOSIBIRSK
```

**Tabelle EMP_M (mit NULL-Werten explizit ausgewiesen):**
```
EMPNO  ENAME     JOB        MGR   SAL   COMM  DEPTNO
-----  -----     ---        ---   ---   ----  ------
100    NORGAARD  PRESIDENT  NULL  5000  NULL  10
122    LEWIS     SALESREP   120   1100  NULL  NULL
199    GENNICK   NULL       NULL  2200  NULL  10
111    DE HAAN   CLERK      110   2000  NULL  NULL
112    MILLSAP   SALESREP   110   1250  1400  20
110    ADAMS     MANAGER    100   NULL  1700  20
120    KOLK      MANAGER    100   2450  NULL  10
113    MCDONALD  SALESREP   110   1500  NULL  20
121    WOOD      CLERK      120   1300  NULL  10
130    MORLE     CLERK      100   NULL  NULL  10
```

wichtig: NORGAARD hat keinen Manager (NULL bei MGR weil er PRESIDENT ist), ADAMS und MORLE haben kein bekanntes Gehalt (NULL bei SAL), LEWIS und andere haben keine COMM und kein DEPTNO

### 12.3 NULL-Werte und skalare Ausdrücke

**Grundregel: Skalare Ausdrücke, die eine NULL umfassen, sind ihrerseits NULL.**

**Beispiel:** Was passiert wenn jeder Angestellte 1000 € mehr bekommt?

```sql
SELECT EMPNO, ENAME, SAL, SAL + 1000
FROM EMP_M;
```

Resultat:
```
EMPNO  ENAME     SAL   SAL+1000
-----  -----     ---   --------
100    Norgaard  5000  6000
110    Adams     NULL  NULL      ← bleibt NULL!
111    Dehaan    2000  3000
...
122    Lewis     1100  2100
130    Morle     NULL  NULL      ← bleibt NULL!
199    Gennick   2200  3200
```

→ Adams und Morle haben weiterhin ein **unbekanntes** Gehalt, also NULL. Der DB-Server kann nicht wissen ob:
- Gehalt grundsätzlich nicht für diese Person existiert, oder
- die Person ein Gehalt von 0,00 EUR hat, oder
- die Person ein unbekanntes Gehalt hat, das aber auch um 1000 € erhöht werden soll

**Der DB-Server kann dies nicht wissen!** → man muss die geschäftliche Bedeutung des NULL-Werts beim Design kennen

### 12.4 COALESCE-Funktion

wenn man weiß, dass NULL für ein Gehalt von 0,00 € steht, kann man mit **COALESCE** dem NULL-Wert eine Bedeutung geben:

```sql
SELECT EMPNO, ENAME, SAL, COALESCE(SAL,0) + 1000
FROM EMP_M;
```

Resultat:
```
EMPNO  ENAME     SAL   SAL+1000
-----  -----     ---   --------
100    Norgaard  5000  6000
110    Adams     NULL  1000      ← jetzt 1000!
111    Dehaan    2000  3000
...
122    Lewis     1100  2100
130    Morle     NULL  1000      ← jetzt 1000!
199    Gennick   2200  3200
```

**COALESCE-Definition:**
- wählt aus seiner Parameterliste (die auch **mehr als 2 Argumente** haben kann) von links den **ersten Wert aus, der nicht NULL ist**
- englisch "to coalesce" = vereinigen, zusammenfügen, zusammenwachsen, sich verbinden

### 12.5 Dreiwertige Logik

**NULL-Werte sind insbesondere bei booleschen Ausdrücken tückisch:**
- WHERE-Bedingungen
- HAVING-Bedingungen
- ON-Bedingungen

sie stellen einen **dritten Wert** neben WAHR und FALSCH dar: **UNBEKANNT**

**wichtiger Unterschied: NULL != UNKNOWN**
- `SAL + NULL` ergibt **NULL** (arithmetischer Ausdruck)
- `SAL < NULL` ergibt **UNKNOWN** (Vergleich)

**NOT-Tabelle:**

| x | NOT(x) |
|---|--------|
| FALSE | TRUE |
| TRUE | FALSE |
| UNKNOWN | UNKNOWN |

**Logisches UND (AND):**

| x\y | TRUE | FALSE | UNKNOWN |
|-----|------|-------|---------|
| TRUE | TRUE | FALSE | UNKNOWN |
| FALSE | FALSE | FALSE | FALSE |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

**Logisches ODER (OR):**

| x\y | TRUE | FALSE | UNKNOWN |
|-----|------|-------|---------|
| TRUE | TRUE | TRUE | TRUE |
| FALSE | TRUE | FALSE | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |

wichtig für die Prüfung: FALSE AND UNKNOWN = **FALSE** (weil wenn einer FALSE ist, ist das ganze AND immer FALSE). TRUE OR UNKNOWN = **TRUE** (weil wenn einer TRUE ist, ist das ganze OR immer TRUE).

### 12.6 Dreiwertige Logik und WHERE-Restriktion

**Jeder Vergleich mit NULL führt zum Wahrheitswert UNKNOWN!**

Das führt zu seltsamen Ergebnissen, wenn man nicht aufpasst:

```sql
SELECT ENAME, COMM
FROM EMP_M
WHERE COMM = COMM;
```

Resultat: **nur Adams und Millsap!** Nicht alle 10 Mitarbeiter!

Warum? → `NULL = NULL` ergibt nicht TRUE sondern **UNKNOWN**. Die WHERE-Bedingung wählt nur Zeilen aus, bei denen TRUE rauskommt. Zeilen mit FALSE **und** Zeilen mit UNKNOWN werden gleichermaßen **gefiltert** (nicht ausgegeben)!

**weiteres Beispiel – alle Angestellten mit weniger als 1500 € Kommission:**

```sql
SELECT ENAME, COMM
FROM EMP_M
WHERE COMM < 1500;
```

Resultat: **nur Millsap (1400)** → aber eigentlich sollten alle Mitarbeiter ohne Kommission auch angezeigt werden, wenn NULL für "0 € Provision" steht!

**Lösung mit IS NULL:**

```sql
SELECT ENAME, COMM
FROM EMP_M
WHERE (COMM < 1500) OR (COMM IS NULL);
```

Resultat: Norgaard NULL, Dehaan NULL, Millsap 1400, ... → jetzt kommen auch die NULL-Werte rein!

**WARNUNG:** ob IS NULL angebracht ist oder nicht, ist eine **Geschäftsentscheidung, keine technische Entscheidung!** Einfach immer IS NULL dazuzufügen kann genauso falsch sein, wenn NULL "wirklich unbekannt" bedeutet und nicht "0 €".

### 12.7 Dreiwertige Logik und CHECK-Constraints

**Wichtiger Unterschied zwischen WHERE und CHECK:**

- **WHERE-Restriktionen** filtern Zeilen mit UNKNOWN **heraus** (kommen nicht ins Ergebnis)
- **CHECK-Constraints** lassen Zeilen mit UNKNOWN **durch**! Sie lehnen nur Zeilen ab, deren Bedingung **FALSE** ergibt!

Beispiel:
```sql
CHECK (DEPTNO IN(10, 20, 30))
```

→ Wenn DEPTNO NULL ist, ergibt die Bedingung UNKNOWN → das CHECK lässt die Zeile durch! das ist kontraintuitiv aber so ist der SQL-Standard.

### 12.8 OUTER-Joins können NULL erzeugen

```sql
SELECT E.ENAME, E.DEPTNO, D.DNAME
FROM EMP_M E
RIGHT OUTER JOIN DEPT_M D ON E.DEPTNO = D.DEPTNO;
```

Resultat (Ausschnitt):
```
ENAME     DEPTNO  DNAME
----------  ------  -------------
Norgaard    10      HQ
Kolk        10      HQ
...
Mcdonald    20      Sales
NULL        NULL    Manufacturing
```

→ Wegen des Schlüsselworts OUTER werden automatisch NULL an Stellen eingefügt, die keinen Partner haben. Interessant: in der letzten Zeile ist DEPTNO NULL, während DNAME nicht NULL ist. Das liegt daran dass die Abteilung Manufacturing (DEPTNO=30) keinen Mitarbeiter zugeordnet hat – sie erscheint trotzdem weil RIGHT OUTER alle Abteilungen zeigen soll.

### 12.9 NULL-Werte und Aggregatfunktionen

**Grundregel: NULL-Werte werden bei Aggregatfunktionen ignoriert!**

Das ist der große Unterschied zu skalaren Ausdrücken:
- skalare Ausdrücke: NULL + X = **NULL**
- Aggregatfunktionen: SUM(X1...Xn) ignoriert NULL-Werte einfach

**Prüfungsrelevantes Beispiel:**

```sql
SELECT SUM(SAL+COMM) AS 'SUM(SAL+COMM)', 
       SUM(SAL)+SUM(COMM) AS 'SUM(SAL)+SUM(COMM)'
FROM EMP_M;
```

Resultat:
```
SUM(SAL+COMM)  SUM(SAL)+SUM(COMM)
-------------  ------------------
2650           19900
```

→ **unterschiedliche Ergebnisse!** warum?

- `SUM(SAL+COMM)`: erst wird SAL+COMM für jede Zeile berechnet → wenn einer von beiden NULL ist, ergibt der Ausdruck NULL → diese Zeile trägt 0 bei
- `SUM(SAL)+SUM(COMM)`: erst werden SAL-Werte summiert (NULLs ignoriert), dann COMM-Werte summiert (NULLs ignoriert), dann addiert → berücksichtigt mehr Daten

also gilt: **SUM(A) + SUM(B) != SUM(A+B)** wenn NULL-Werte im Spiel sind!

**Regel:** Man muss sich **immer** Gedanken machen, was passiert wenn NULL-Werte mitspielen. Vor Berechnungen mit `SELECT ... WHERE ... IS NULL` prüfen ob NULLs mitspielen. Welcher Ansatz richtig ist hängt von der geschäftlichen Bedeutung der NULL ab – die kann sogar von Spalte zu Spalte verschieden sein!

### 12.10 Was ist die Summe von 0 Zeilen?

```sql
SELECT COUNT(EMPNO), AVG(EMPNO), SUM(EMPNO), 
       MAX(EMPNO), MIN(EMPNO)
FROM EMP_M
WHERE 1 = 2;
```

Resultat:
```
COUNT(EMPNO)  AVG(EMPNO)  SUM(EMPNO)  MAX(EMPNO)  MIN(EMPNO)
------------  ----------  ----------  ----------  ----------
0             NULL        NULL        NULL        NULL
```

Erklärung:
- COUNT von 0 Zeilen = **0** → klar
- MAX und MIN von 0 Zeilen = **UNKNOWN (NULL)** → klar, gibt kein Maximum wenn keine Zeilen da
- SUM von 0 Zeilen = **UNKNOWN (NULL)** und **nicht 0** → nicht klar und nicht intuitiv, steht aber so im **SQL-Standard!**

### 12.11 NULL-Werte und NOT IN

**Unterabfragen sind besonders tückisch wenn die Unterabfrage NULL-Werte liefert!**

wenn die Unterabfrage einen NULL-Wert enthält, kann NOT IN zum Ergebnis UNKNOWN führen → **keine einzige Zeile** der Hauptabfrage passiert die WHERE-Restriktion

**Beispiel – alle Angestellten, die keine Untergebenen haben:**

**Falsch (gibt 0 Zeilen zurück!):**
```sql
SELECT E1.ENAME
FROM EMP_M E1
WHERE E1.EMPNO NOT IN
    (SELECT E2.MGR
     FROM EMP_M E2);
```

Resultat: **(0 row(s) affected)** → weil die Unterabfrage auch NULL liefert (Morle hat MGR=100, aber MORLE selbst hat NULL als SAL... nein – das Problem ist dass GENNICK NULL im JOB-Feld hat und NORGAARD NULL im MGR-Feld hat. Die Unterabfrage `SELECT E2.MGR FROM EMP_M E2` enthält mindestens einen NULL-Wert (Norgaard hat MGR=NULL). Das führt dazu dass `EMPNO NOT IN (... NULL ...)` für jeden möglichen EMPNO UNKNOWN ergibt!

**Richtig (mit IS NOT NULL in der Unterabfrage):**
```sql
SELECT E1.ENAME
FROM EMP_M E1
WHERE E1.EMPNO NOT IN
    (SELECT E2.MGR
     FROM EMP_M E2
     WHERE E2.MGR IS NOT NULL);
```

Resultat: Dehaan, Millsap, ..., Morle, Gennick **(7 row(s) affected)** → jetzt kommt das richtige Ergebnis!

**Alternative mit NOT EXISTS (funktioniert ohne IS NOT NULL korrekt):**
```sql
SELECT E1.ENAME
FROM EMP_M E1
WHERE NOT EXISTS
    (SELECT *
     FROM EMP_M E2
     WHERE E2.MGR = E1.EMPNO);
```

Resultat: Dehaan, Millsap, ..., Morle, Gennick **(7 row(s) affected)**

→ NOT EXISTS behandelt NULL anders als NOT IN und liefert das korrekte Ergebnis ohne extra IS NOT NULL!

**Merke:** Bei NOT IN immer prüfen ob die Unterabfrage NULL-Werte enthalten kann → wenn ja, dann `WHERE ... IS NOT NULL` in die Unterabfrage, oder NOT EXISTS verwenden!

### 12.12 Unterabfragen die die leere Menge liefern

**Unterabfragen mit Aggregatfunktionen die keine Zeilen finden:**

```sql
SELECT E1.ENAME
FROM EMP_M E1
WHERE E1.SAL >
    (SELECT MAX(E2.SAL)
     FROM EMP_M E2
     WHERE E2.DEPTNO = 10
     AND E2.JOB='SALESREP');
```

Resultat: **(0 row(s) affected)** → weil es in Abteilung 10 keinen SALESREP gibt! MAX() einer leeren Menge = NULL. Dann ist jeder Vergleich `SAL > NULL` → UNKNOWN → keine Zeile kommt durch!

**Lösung: ALL statt Aggregatfunktion verwenden:**

```sql
SELECT E1.ENAME
FROM EMP_M E1
WHERE E1.SAL > ALL
    (SELECT E2.SAL
     FROM EMP_M E2
     WHERE E2.DEPTNO = 10
     AND E2.JOB = 'SALESREP');
```

Resultat: Norgaard, Adams, ..., Gennick **(10 row(s) affected)** → `SAL > ALL (leere Menge)` ergibt **TRUE** für alle Zeilen – das ist das SQL-Standard-Verhalten für den Vergleich mit einer leeren Menge!

→ also: `x > ALL (leere Menge)` = **TRUE** für alle x. Das ist kontraintuitiv aber wichtig zu wissen!

---

## Wichtigste Zusammenfassung für die Prüfung

**NULL – die wichtigsten Regeln:**

- **NULL ist kein Wert** – es bedeutet "unbekannt" oder "fehlt"
- jeder **arithmetische Ausdruck** mit NULL ergibt NULL
- jeder **Vergleich** mit NULL ergibt UNKNOWN (nicht TRUE, nicht FALSE)
- **WHERE/HAVING/ON** filtert sowohl FALSE als auch UNKNOWN → nur TRUE kommt durch
- **CHECK** lässt UNKNOWN durch → lehnt nur FALSE ab
- **Aggregatfunktionen** (SUM, AVG, COUNT, MAX, MIN) ignorieren NULL-Werte
- **COUNT(*)** zählt alle Zeilen inkl. NULL, **COUNT(spalte)** nur non-NULL
- SUM von 0 Zeilen = NULL (nicht 0!) → SQL-Standard
- **COALESCE(a, b, c)** = erster non-NULL-Wert von links
- **NOT IN** mit NULL in Unterabfrage → 0 Ergebnisse! Immer IS NOT NULL sicherstellen oder NOT EXISTS verwenden
- `x > ALL (leere Menge)` = TRUE
- `MAX(leere Menge)` = NULL → Vergleich damit = UNKNOWN
- **ob IS NULL sinnvoll ist** ist eine Geschäftsentscheidung, keine technische!
- NULL = NULL ergibt **UNKNOWN**, nicht TRUE → deshalb für NULL-Test immer IS NULL / IS NOT NULL verwenden, niemals = NULL!