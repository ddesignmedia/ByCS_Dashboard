const DEMO_XML = `
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <!-- Frage 1: Wahr/Falsch -->
  <question type="truefalse">
    <name><text>Hydratation vs. Solvatation</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Der Begriff <strong>Hydratation</strong> ist ein spezieller Fall der <strong>Solvatation</strong>, der explizit dann verwendet wird, wenn Wasser als Lösungsmittel fungiert.</p>]]></text>
    </questiontext>
    <answer fraction="100">
      <text>true</text>
      <feedback><text>Richtig! Hydratation bezieht sich immer auf Wasser, Solvatation ist der allgemeine Überbegriff.</text></feedback>
    </answer>
    <answer fraction="0">
      <text>false</text>
      <feedback><text>Falsch. Jede Hydratation ist eine Solvatation, aber der Begriff Hydratation ist auf das Lösungsmittel Wasser spezialisiert.</text></feedback>
    </answer>
  </question>

  <!-- Frage 2: Kurzantwort -->
  <question type="shortanswer">
    <name><text>Gitterenergie</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Wie nennt man die Energie, die aufgewendet werden muss, um die Ionen eines Salzkristalls aus ihrem festen Verband zu lösen? (Geben Sie den Fachbegriff ein)</p>]]></text>
    </questiontext>
    <answer fraction="100">
      <text>Gitterenergie</text>
      <feedback><text>Korrekt! Die \\( \\Delta H_{G} \\) muss überwunden werden.</text></feedback>
    </answer>
    <answer fraction="100">
      <text>*Gitter*</text>
      <feedback><text>Korrekt! Gemeint ist die Gitterenergie.</text></feedback>
    </answer>
  </question>

  <!-- Frage 3: Zuordnung -->
  <question type="matching">
    <name><text>Ausrichtung der Wassermoleküle</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Welcher Teil des Wassermoleküls (\\( H_2O \\)) weist aufgrund der Ladungsverteilung zu welchem Ion?</p>]]></text>
    </questiontext>
    <subquestion>
      <text>Natrium-Ion (\\( Na^+ \\))</text>
      <answer><text>Sauerstoff-Atom (\\( \\delta^- \\))</text></answer>
    </subquestion>
    <subquestion>
      <text>Chlorid-Ion (\\( Cl^- \\))</text>
      <answer><text>Wasserstoff-Atome (\\( \\delta^+ \\))</text></answer>
    </subquestion>
    <subquestion>
      <text>Negativer Pol des Dipols</text>
      <answer><text>Sauerstoff-Atom (\\( \\delta^- \\))</text></answer>
    </subquestion>
  </question>

  <!-- Frage 4: Numerisch -->
  <question type="numerical">
    <name><text>Berechnung der Lösungswärme</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Berechne die molare Lösungswärme \\( \\Delta H_{sol} \\) von Natriumchlorid (NaCl) in kJ/mol. Gegeben sind die Gitterenergie \\( \\Delta H_{G} = +787 \\, \\text{kJ/mol} \\) und die Hydratationsenergie \\( \\Delta H_{hyd} = -784 \\, \\text{kJ/mol} \\).</p>]]></text>
    </questiontext>
    <answer fraction="100">
      <text>3</text>
      <tolerance>0.1</tolerance>
      <feedback><text>Richtig! \\( \\Delta H_{sol} = \\Delta H_{G} + \\Delta H_{hyd} = 787 + (-784) = +3 \\, \\text{kJ/mol} \\). Der Vorgang ist leicht endotherm.</text></feedback>
    </answer>
    <answer fraction="0">
      <text>30</text>
      <feedback><text>Falsch. Beachte das Vorzeichen! Die Hydratationsenergie wird frei (negativ), die Gitterenergie muss aufgewendet werden (positiv). Die Summe ist hier negativ.</text></feedback>
    </answer>
    <answer fraction="0">
      <text>1590</text>
      <feedback><text>Falsch. Du hast die Beträge addiert. Die Lösungswärme ist die Bilanz aus aufzuwendender Gitterenergie und freiwerdender Hydratationsenergie.</text></feedback>
    </answer>
  </question>

  <!-- Frage 5: Cloze (Lückentext) -->
  <question type="cloze">
    <name><text>Lösungsvorgang Lückentext</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Vervollständige den Text zum Lösungsvorgang:</p>
      <p>Salze bestehen aus einem regelmäßigen {1:MULTICHOICE:=Ionengitter#Korrekt~Molekülgitter#Falsch, Salze bilden Ionen-Kristalle.}. Beim Lösen lagern sich Wassermoleküle an. Diesen Vorgang nennt man {1:SHORTANSWER:=Hydratation#Richtig!}. Dabei wird die {1:SHORTANSWER:=Hydratationsenergie#Korrekt!} frei. Sind die Ionen vollständig von Wasser umgeben, spricht man von einer {1:SHORTANSWER:=Hydrathülle#Richtig!}.</p>]]></text>
    </questiontext>
  </question>

  <!-- Frage 6: Kurzantwort -->
  <question type="shortanswer">
    <name><text>Zustandsform aq</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Welches Kürzel wird in chemischen Reaktionsgleichungen hinter die Formel eines Ions geschrieben, um anzuzeigen, dass es in Wasser gelöst (hydratisiert) vorliegt?</p>]]></text>
    </questiontext>
    <answer fraction="100">
      <text>aq</text>
      <feedback><text>Richtig! (aq) steht für aqueous (wässrig).</text></feedback>
    </answer>
    <answer fraction="100">
      <text>(aq)</text>
      <feedback><text>Richtig!</text></feedback>
    </answer>
  </question>

  <!-- Frage 7: Wahr/Falsch -->
  <question type="truefalse">
    <name><text>Energetik des Lösens</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Ein Salz kann sich nur dann in Wasser lösen, wenn der Vorgang insgesamt exotherm ist (also Energie frei wird).</p>]]></text>
    </questiontext>
    <answer fraction="100">
      <text>false</text>
      <feedback><text>Richtig! Viele Salze lösen sich endotherm (die Lösung wird kälter), da die Entropiezunahme den energetischen Nachteil ausgleichen kann.</text></feedback>
    </answer>
    <answer fraction="0">
      <text>true</text>
      <feedback><text>Falsch. Es gibt viele endotherme Lösungsvorgänge (z.B. Ammoniumnitrat). Das Salz entzieht der Umgebung dann Wärmeenergie.</text></feedback>
    </answer>
  </question>

  <!-- Frage 8: Zuordnung -->
  <question type="matching">
    <name><text>Fachbegriffe zuordnen</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Ordne die Fachbegriffe korrekt zu:</p>]]></text>
    </questiontext>
    <subquestion>
      <text>In das Gitter fest eingebautes Wasser</text>
      <answer><text>Kristallwasser</text></answer>
    </subquestion>
    <subquestion>
      <text>Ladungsverteilung im H2O-Molekül</text>
      <answer><text>Dipol</text></answer>
    </subquestion>
    <subquestion>
      <text>Zustand am Ende des Lösungsvorgangs</text>
      <answer><text>homogenes Gemisch</text></answer>
    </subquestion>
  </question>

  <!-- Frage 9: Numerisch -->
  <question type="numerical">
    <name><text>Temperaturänderung</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Ein Schüler löst ein Salz endotherm in Wasser. Die Starttemperatur beträgt \\( 20^\\circ C \\). Welche Endtemperatur wäre plausibel?</p>]]></text>
    </questiontext>
    <answer fraction="100">
      <text>15</text>
      <tolerance>4.9</tolerance>
      <feedback><text>Richtig! Bei einem endothermen Vorgang sinkt die Temperatur der Lösung.</text></feedback>
    </answer>
    <answer fraction="0">
      <text>25</text>
      <feedback><text>Falsch. Das wäre ein exothermer Vorgang. Endotherm bedeutet, dass Energie aus dem Wasser aufgenommen wird, wodurch dieses abkühlt.</text></feedback>
    </answer>
  </question>

  <!-- Frage 10: Kurzantwort -->
  <question type="shortanswer">
    <name><text>Angeberwissen: Ladungsdichte</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Warum haben kleine Ionen wie \\( Li^+ \\) oft eine viel dickere Hydrathülle als große Ionen mit der gleichen Ladung? Welches physikalische Konzept ist hier entscheidend?</p>]]></text>
    </questiontext>
    <answer fraction="100">
      <text>*Ladungsdichte*</text>
      <feedback><text>Exzellent! Die hohe Ladungsdichte führt zu einer stärkeren elektrostatischen Anziehung der Wasser-Dipole.</text></feedback>
    </answer>
    <answer fraction="0">
      <text>Größe</text>
      <feedback><text>Das ist nur ein Teil der Antwort. Entscheidend ist das Verhältnis von Ladung zu Volumen, also die Ladungsdichte.</text></feedback>
    </answer>
  </question>
</quiz>

`;

const DEMO_JSON = `
[
    [
        {
            "nachname": "Name1",
            "vorname": "Nachname1",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:16",
            "beendet": "29. April 2026  12:24",
            "dauer": "7 Minuten 44 Sekunden",
            "bewertung1000": "6,94",
            "f1083": "0,00",
            "f2083": "0,28",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,83"
        },
        {
            "nachname": "Name2",
            "vorname": "Nachname2",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:22",
            "beendet": "29. April 2026  12:26",
            "dauer": "3 Minuten 49 Sekunden",
            "bewertung1000": "5,83",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,00",
            "f9083": "0,00",
            "f10083": "0,00"
        },
        {
            "nachname": "Name3",
            "vorname": "Nachname3",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:24",
            "beendet": "29. April 2026  12:27",
            "dauer": "2 Minuten 25 Sekunden",
            "bewertung1000": "7,78",
            "f1083": "0,28",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,83"
        },
        {
            "nachname": "Name4",
            "vorname": "Nachname4",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:25",
            "beendet": "29. April 2026  12:27",
            "dauer": "2 Minuten 8 Sekunden",
            "bewertung1000": "4,17",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "-",
            "f4083": "0,00",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "-",
            "f9083": "-",
            "f10083": "0,00"
        },
        {
            "nachname": "Name5",
            "vorname": "Nachname5",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:25",
            "beendet": "29. April 2026  12:29",
            "dauer": "4 Minuten 25 Sekunden",
            "bewertung1000": "6,11",
            "f1083": "0,28",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "-",
            "f9083": "0,83",
            "f10083": "0,00"
        },
        {
            "nachname": "Name6",
            "vorname": "Nachname6",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:27",
            "beendet": "29. April 2026  12:30",
            "dauer": "2 Minuten 50 Sekunden",
            "bewertung1000": "3,33",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "0,00",
            "f4083": "0,00",
            "f5083": "0,83",
            "f6083": "0,00",
            "f7083": "0,83",
            "f8083": "-",
            "f9083": "0,00",
            "f10083": "0,00"
        },
        {
            "nachname": "Name7",
            "vorname": "Nachname7",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:31",
            "beendet": "29. April 2026  12:33",
            "dauer": "2 Minuten",
            "bewertung1000": "5,83",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "-",
            "f4083": "0,83",
            "f5083": "0,00",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,00",
            "f10083": "0,83"
        },
        {
            "nachname": "Name8",
            "vorname": "Nachname8",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:34",
            "beendet": "29. April 2026  12:36",
            "dauer": "2 Minuten",
            "bewertung1000": "5,83",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "0,00",
            "f4083": "0,00",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,00",
            "f10083": "0,83"
        },
        {
            "nachname": "Name9",
            "vorname": "Nachname9",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  12:36",
            "beendet": "29. April 2026  12:38",
            "dauer": "1 Minute 14 Sekunden",
            "bewertung1000": "7,50",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "-",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,83"
        },
        {
            "nachname": "Name10",
            "vorname": "Nachname10",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  13:30",
            "beendet": "6. Mai 2026  11:42",
            "dauer": "6 Tage 22 Stunden",
            "bewertung1000": "7,78",
            "f1083": "0,28",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,83"
        },
        {
            "nachname": "Name11",
            "vorname": "Nachname11",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  13:34",
            "beendet": "29. April 2026  13:40",
            "dauer": "6 Minuten 6 Sekunden",
            "bewertung1000": "6,94",
            "f1083": "0,28",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,00"
        },
        {
            "nachname": "Name12",
            "vorname": "Nachname12",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "29. April 2026  21:02",
            "beendet": "29. April 2026  21:19",
            "dauer": "16 Minuten 40 Sekunden",
            "bewertung1000": "6,94",
            "f1083": "0,28",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,00",
            "f10083": "0,83"
        },
        {
            "nachname": "Name13",
            "vorname": "Nachname13",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "6. Mai 2026  11:36",
            "beendet": "6. Mai 2026  11:44",
            "dauer": "8 Minuten 8 Sekunden",
            "bewertung1000": "6,11",
            "f1083": "0,00",
            "f2083": "0,28",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,00",
            "f10083": "0,83"
        },
        {
            "nachname": "Name14",
            "vorname": "Nachname14",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "6. Mai 2026  11:37",
            "beendet": "6. Mai 2026  11:49",
            "dauer": "12 Minuten 18 Sekunden",
            "bewertung1000": "3,33",
            "f1083": "0,00",
            "f2083": "0,83",
            "f3250": "-",
            "f4083": "0,83",
            "f5083": "0,00",
            "f6083": "0,83",
            "f7083": "0,00",
            "f8083": "-",
            "f9083": "0,83",
            "f10083": "0,00"
        },
        {
            "nachname": "Name15",
            "vorname": "Nachname15",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "6. Mai 2026  11:50",
            "beendet": "6. Mai 2026  12:03",
            "dauer": "12 Minuten 14 Sekunden",
            "bewertung1000": "6,11",
            "f1083": "0,28",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,00",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,00",
            "f10083": "0,83"
        },
        {
            "nachname": "Name16",
            "vorname": "Nachname16",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "7. Mai 2026  07:33",
            "beendet": "7. Mai 2026  07:36",
            "dauer": "2 Minuten 57 Sekunden",
            "bewertung1000": "3,33",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "0,00",
            "f4083": "0,83",
            "f5083": "0,00",
            "f6083": "0,00",
            "f7083": "0,83",
            "f8083": "-",
            "f9083": "-",
            "f10083": "-"
        },
        {
            "nachname": "Name17",
            "vorname": "Nachname17",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "7. Mai 2026  08:52",
            "beendet": "7. Mai 2026  08:56",
            "dauer": "4 Minuten 10 Sekunden",
            "bewertung1000": "6,67",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "1,67",
            "f4083": "0,00",
            "f5083": "0,00",
            "f6083": "0,00",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,83"
        },
        {
            "nachname": "Name18",
            "vorname": "Nachname18",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "7. Mai 2026  09:01",
            "beendet": "7. Mai 2026  09:03",
            "dauer": "2 Minuten 36 Sekunden",
            "bewertung1000": "6,39",
            "f1083": "0,28",
            "f2083": "0,28",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,00",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,83"
        },
        {
            "nachname": "Name19",
            "vorname": "Nachname19",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "20. Mai 2026  16:11",
            "beendet": "20. Mai 2026  16:16",
            "dauer": "5 Minuten 3 Sekunden",
            "bewertung1000": "8,33",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,83"
        },
        {
            "nachname": "Name20",
            "vorname": "Nachname20",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "8. Juni 2026  16:37",
            "beendet": "8. Juni 2026  16:45",
            "dauer": "7 Minuten 36 Sekunden",
            "bewertung1000": "5,83",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,00",
            "f9083": "0,00",
            "f10083": "0,00"
        },
        {
            "nachname": "Name21",
            "vorname": "Nachname21",
            "e-mail-adresse": "mail-adresse",
            "institution": "0370",
            "status": "Beendet",
            "begonnen": "10. Juni 2026  17:15",
            "beendet": "10. Juni 2026  17:21",
            "dauer": "6 Minuten 50 Sekunden",
            "bewertung1000": "7,50",
            "f1083": "0,83",
            "f2083": "0,83",
            "f3250": "0,83",
            "f4083": "0,83",
            "f5083": "0,83",
            "f6083": "0,83",
            "f7083": "0,83",
            "f8083": "0,83",
            "f9083": "0,83",
            "f10083": "0,00"
        },
        {
            "nachname": "Gesamtdurchschnitt",
            "vorname": "",
            "e-mail-adresse": "",
            "institution": "",
            "status": "",
            "begonnen": "",
            "beendet": "",
            "dauer": "",
            "bewertung1000": "6,12",
            "f1083": "0,53",
            "f2083": "0,75",
            "f3250": "0,60",
            "f4083": "0,67",
            "f5083": "0,63",
            "f6083": "0,71",
            "f7083": "0,75",
            "f8083": "0,56",
            "f9083": "0,44",
            "f10083": "0,48"
        }
    ]
]
`;

const DEMO_STATS = `
[[{
    "test-name": "Alles verstanden? - Mach den Test!",
    "kursname": "Chemie 9. NTG",
    "anzahldervollstndigbewertetenerstenversuche": "15",
    "gesamtzahldervollstndigbewertetenversuche": "19",
    "durchschnittbeierstemversuch": "60,85%",
    "durchschnittsergebnisallerversuche": "63,56%",
    "durchschnittderletztenbewertung": "67,18%",
    "durchschnittderbestbewertetenversuche": "67,18%",
    "medianfrbestbewerteterversuch": "69,23%",
    "standardabweichungfrbestbewerteterversuch": "16,79%",
    "schiefederpunkteverteilungfrbestbewerteterversuch": "0,2085",
    "bewertungsverteilungsgraphfrbestbewerteterversuch": "-0,7789",
    "koeffizientinternerkonsistenzfrbestbewerteterversuch": "56,11%",
    "fehlerquotientfrbestbewerteterversuch": "66,25%",
    "standardfehlerfrbestbewerteterversuch": "11,12%"
}],[{
    "f": "1",
    "typderfrage": "Zuordnung",
    "titelderfrage": "Ausrichtung der Wassermoleküle",
    "versuche": "15",
    "leichtigkeitsindex": "86,67%",
    "standardabweichung": "21,08%",
    "ratewahrscheinlichkeit": "50,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "5,02%",
    "trennschrfeindex": "13,34%",
    "trennschrfe-effizienz": "17,43%"
},{
    "f": "2",
    "typderfrage": "Zuordnung",
    "titelderfrage": "Fachbegriffe zuordnen",
    "versuche": "15",
    "leichtigkeitsindex": "86,67%",
    "standardabweichung": "27,60%",
    "ratewahrscheinlichkeit": "33,33%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "8,19%",
    "trennschrfeindex": "35,57%",
    "trennschrfe-effizienz": "51,61%"
},{
    "f": "3",
    "typderfrage": "Lückentext (Cloze)",
    "titelderfrage": "Lösungsvorgang Lückentext",
    "versuche": "15",
    "leichtigkeitsindex": "45,00%",
    "standardabweichung": "23,53%",
    "ratewahrscheinlichkeit": "12,50%",
    "beabsichtigtegewichtung": "30,77%",
    "effektivegewichtung": "16,67%",
    "trennschrfeindex": "15,79%",
    "trennschrfe-effizienz": "19,19%"
},{
    "f": "4",
    "typderfrage": "Numerisch",
    "titelderfrage": "Berechnung der Lösungswärme",
    "versuche": "15",
    "leichtigkeitsindex": "73,33%",
    "standardabweichung": "45,77%",
    "ratewahrscheinlichkeit": "0,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "8,56%",
    "trennschrfeindex": "9,96%",
    "trennschrfe-effizienz": "12,90%"
},{
    "f": "5",
    "typderfrage": "Numerisch",
    "titelderfrage": "Temperaturänderung",
    "versuche": "15",
    "leichtigkeitsindex": "80,00%",
    "standardabweichung": "41,40%",
    "ratewahrscheinlichkeit": "0,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "11,37%",
    "trennschrfeindex": "45,07%",
    "trennschrfe-effizienz": "71,96%"
},{
    "f": "6",
    "typderfrage": "Kurzantwort",
    "titelderfrage": "Angeberwissen: Ladungsdichte",
    "versuche": "15",
    "leichtigkeitsindex": "60,00%",
    "standardabweichung": "50,71%",
    "ratewahrscheinlichkeit": "0,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "15,16%",
    "trennschrfeindex": "78,30%",
    "trennschrfe-effizienz": "100,00%"
},{
    "f": "7",
    "typderfrage": "Kurzantwort",
    "titelderfrage": "Gitterenergie",
    "versuche": "15",
    "leichtigkeitsindex": "60,00%",
    "standardabweichung": "50,71%",
    "ratewahrscheinlichkeit": "0,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "13,57%",
    "trennschrfeindex": "53,79%",
    "trennschrfe-effizienz": "66,05%"
},{
    "f": "8",
    "typderfrage": "Kurzantwort",
    "titelderfrage": "Zustandsform aq",
    "versuche": "15",
    "leichtigkeitsindex": "86,67%",
    "standardabweichung": "35,19%",
    "ratewahrscheinlichkeit": "0,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "8,42%",
    "trennschrfeindex": "23,50%",
    "trennschrfe-effizienz": "39,56%"
},{
    "f": "9",
    "typderfrage": "Wahr\\/Falsch",
    "titelderfrage": "Energetik des Lösens",
    "versuche": "15",
    "leichtigkeitsindex": "73,33%",
    "standardabweichung": "45,77%",
    "ratewahrscheinlichkeit": "50,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "7,49%",
    "trennschrfeindex": "2,45%",
    "trennschrfe-effizienz": "3,23%"
},{
    "f": "10",
    "typderfrage": "Wahr\\/Falsch",
    "titelderfrage": "Hydratation vs. Solvatation",
    "versuche": "15",
    "leichtigkeitsindex": "86,67%",
    "standardabweichung": "35,19%",
    "ratewahrscheinlichkeit": "50,00%",
    "beabsichtigtegewichtung": "7,69%",
    "effektivegewichtung": "5,56%",
    "trennschrfeindex": "0,63%",
    "trennschrfe-effizienz": "1,16%"
}],[{
    "teilderfrage": "9966100",
    "musterantwort": "Natrium-Ion (\\\\( Na^+ \\\\)): Sauerstoff-Atom (\\\\( \\\\delta^- \\\\))",
    "tatschlicheantwort": "Sauerstoff-Atom (\\\\( \\\\delta^- \\\\))",
    "teilweisebewertung": "33,33%",
    "zhlen": "14",
    "frequenz": "93,33%"
},{
    "teilderfrage": "9966100",
    "musterantwort": "Natrium-Ion (\\\\( Na^+ \\\\)): Wasserstoff-Atome (\\\\( \\\\delta^+ \\\\))",
    "tatschlicheantwort": "Wasserstoff-Atome (\\\\( \\\\delta^+ \\\\))",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "teilderfrage": "9966100",
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "teilderfrage": "9966103",
    "musterantwort": "Chlorid-Ion (\\\\( Cl^- \\\\)): Sauerstoff-Atom (\\\\( \\\\delta^- \\\\))",
    "tatschlicheantwort": "Sauerstoff-Atom (\\\\( \\\\delta^- \\\\))",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "teilderfrage": "9966103",
    "musterantwort": "Chlorid-Ion (\\\\( Cl^- \\\\)): Wasserstoff-Atome (\\\\( \\\\delta^+ \\\\))",
    "tatschlicheantwort": "Wasserstoff-Atome (\\\\( \\\\delta^+ \\\\))",
    "teilweisebewertung": "33,33%",
    "zhlen": "14",
    "frequenz": "93,33%"
},{
    "teilderfrage": "9966103",
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "teilderfrage": "9966106",
    "musterantwort": "Negativer Pol des Dipols: Sauerstoff-Atom (\\\\( \\\\delta^- \\\\))",
    "tatschlicheantwort": "Sauerstoff-Atom (\\\\( \\\\delta^- \\\\))",
    "teilweisebewertung": "33,33%",
    "zhlen": "11",
    "frequenz": "73,33%"
},{
    "teilderfrage": "9966106",
    "musterantwort": "Negativer Pol des Dipols: Wasserstoff-Atome (\\\\( \\\\delta^+ \\\\))",
    "tatschlicheantwort": "Wasserstoff-Atome (\\\\( \\\\delta^+ \\\\))",
    "teilweisebewertung": "0,00%",
    "zhlen": "4",
    "frequenz": "26,67%"
},{
    "teilderfrage": "9966106",
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
}],[{
    "teilderfrage": "9966109",
    "musterantwort": "In das Gitter fest eingebautes Wasser: Kristallwasser",
    "tatschlicheantwort": "Kristallwasser",
    "teilweisebewertung": "33,33%",
    "zhlen": "14",
    "frequenz": "93,33%"
},{
    "teilderfrage": "9966109",
    "musterantwort": "In das Gitter fest eingebautes Wasser: Dipol",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "teilderfrage": "9966109",
    "musterantwort": "In das Gitter fest eingebautes Wasser: homogenes Gemisch",
    "tatschlicheantwort": "homogenes Gemisch",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "teilderfrage": "9966109",
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "teilderfrage": "9966112",
    "musterantwort": "Ladungsverteilung im H2O-Molekül: Kristallwasser",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "teilderfrage": "9966112",
    "musterantwort": "Ladungsverteilung im H2O-Molekül: Dipol",
    "tatschlicheantwort": "Dipol",
    "teilweisebewertung": "33,33%",
    "zhlen": "13",
    "frequenz": "86,67%"
},{
    "teilderfrage": "9966112",
    "musterantwort": "Ladungsverteilung im H2O-Molekül: homogenes Gemisch",
    "tatschlicheantwort": "homogenes Gemisch",
    "teilweisebewertung": "0,00%",
    "zhlen": "2",
    "frequenz": "13,33%"
},{
    "teilderfrage": "9966112",
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "teilderfrage": "9966115",
    "musterantwort": "Zustand am Ende des Lösungsvorgangs: Kristallwasser",
    "tatschlicheantwort": "Kristallwasser",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "teilderfrage": "9966115",
    "musterantwort": "Zustand am Ende des Lösungsvorgangs: Dipol",
    "tatschlicheantwort": "Dipol",
    "teilweisebewertung": "0,00%",
    "zhlen": "2",
    "frequenz": "13,33%"
},{
    "teilderfrage": "9966115",
    "musterantwort": "Zustand am Ende des Lösungsvorgangs: homogenes Gemisch",
    "tatschlicheantwort": "homogenes Gemisch",
    "teilweisebewertung": "33,33%",
    "zhlen": "12",
    "frequenz": "80,00%"
},{
    "teilderfrage": "9966115",
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
}],[{
    "musterantwort": "3 (2.9..3.1)",
    "tatschlicheantwort": "3",
    "teilweisebewertung": "100,00%",
    "zhlen": "9",
    "frequenz": "60,00%"
},{
    "musterantwort": "3 (2.9..3.1)",
    "tatschlicheantwort": "+3kJ\\/mol",
    "teilweisebewertung": "100,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "3 (2.9..3.1)",
    "tatschlicheantwort": "+3",
    "teilweisebewertung": "100,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "30 (30..30)",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "musterantwort": "1590 (1590..1590)",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "0",
    "teilweisebewertung": "0,00%",
    "zhlen": "2",
    "frequenz": "13,33%"
},{
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "[Keine Antwort]",
    "teilweisebewertung": "0,00%",
    "zhlen": "2",
    "frequenz": "13,33%"
}],[{
    "musterantwort": "15 (10.1..19.9)",
    "tatschlicheantwort": "17",
    "teilweisebewertung": "100,00%",
    "zhlen": "2",
    "frequenz": "13,33%"
},{
    "musterantwort": "15 (10.1..19.9)",
    "tatschlicheantwort": "16",
    "teilweisebewertung": "100,00%",
    "zhlen": "4",
    "frequenz": "26,67%"
},{
    "musterantwort": "15 (10.1..19.9)",
    "tatschlicheantwort": "15",
    "teilweisebewertung": "100,00%",
    "zhlen": "6",
    "frequenz": "40,00%"
},{
    "musterantwort": "25 (25..25)",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "20",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "40",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "30",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
}],[{
    "musterantwort": "*Ladungsdichte*",
    "tatschlicheantwort": "Ladungsdichte",
    "teilweisebewertung": "100,00%",
    "zhlen": "9",
    "frequenz": "60,00%"
},{
    "musterantwort": "Größe",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Sie ziehen Wassermoleküle so unfassbar stark an, dass ihre Hydrathülle viel dicker und fester ist als die von großen Anionen. Kristalwasser",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Hydrationsenergie",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "ionenenergie",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Es braucht gleich viele Wassermoleküle um sie neutral zu laden aber eben auf engerem Raum",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "höhere Dichte",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "[Keine Antwort]",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
}],[{
    "musterantwort": "Gitterenergie",
    "tatschlicheantwort": "Gitterenergie",
    "teilweisebewertung": "100,00%",
    "zhlen": "8",
    "frequenz": "53,33%"
},{
    "musterantwort": "*Gitter*",
    "tatschlicheantwort": "Ionengitter",
    "teilweisebewertung": "100,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Ionisierungsenergie",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Hydrationsenergie",
    "teilweisebewertung": "0,00%",
    "zhlen": "2",
    "frequenz": "13,33%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Hydratationsenergie",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Hydrationesenergie",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "Lösung",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
}],[{
    "musterantwort": "aq",
    "tatschlicheantwort": "aq",
    "teilweisebewertung": "100,00%",
    "zhlen": "12",
    "frequenz": "80,00%"
},{
    "musterantwort": "(aq)",
    "tatschlicheantwort": "(aq)",
    "teilweisebewertung": "100,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Passt zu keiner Antwort]",
    "tatschlicheantwort": "a",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
},{
    "musterantwort": "[Keine Antwort]",
    "tatschlicheantwort": "[Keine Antwort]",
    "teilweisebewertung": "0,00%",
    "zhlen": "1",
    "frequenz": "6,67%"
}],[{
    "musterantwort": "Falsch",
    "teilweisebewertung": "100,00%",
    "zhlen": "11",
    "frequenz": "73,33%"
},{
    "musterantwort": "Wahr",
    "teilweisebewertung": "0,00%",
    "zhlen": "4",
    "frequenz": "26,67%"
},{
    "musterantwort": "[Keine Antwort]",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
}],[{
    "musterantwort": "Falsch",
    "teilweisebewertung": "0,00%",
    "zhlen": "2",
    "frequenz": "13,33%"
},{
    "musterantwort": "Wahr",
    "teilweisebewertung": "100,00%",
    "zhlen": "13",
    "frequenz": "86,67%"
},{
    "musterantwort": "[Keine Antwort]",
    "teilweisebewertung": "0,00%",
    "zhlen": "0",
    "frequenz": "0,00%"
}]]
`;

