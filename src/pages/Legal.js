import React from 'react';
import { useParams } from 'react-router-dom';
const Legal = () => {
  const { page } = useParams();

  const content = {
    impressum: {
      title: 'Impressum',
      body: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">H68 Vermögensverwaltung GmbH</h2>
            <p>
              Kienberger Allee 4<br />
              12529 Schönefeld<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Vertretung</h2>
  
            <p className="text-[#0B1E33]">
              H68 Vermögensverwaltung GmbH
            </p>
  
            <p className="text-[#0B1E33] mt-1">vertreten durch die Geschäftsführer:</p>
            <p className="text-[#0B1E33] mt-1">
              Dr. Jonas Schäuble
            </p>
            <p className="text-[#0B1E33] mt-1">
              Maximilian Roloff
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Kontakt (Hauptsitz)</h2>
            <p>
               <a href="tel:+4930544480850" className="text-green-600 hover:underline">+49 30 544 480 850</a><br />
               <a href="mailto:info@h68spardirekt.com" className="text-green-600 hover:underline">info@h68spardirekt.com</a><br />
               <a href="https://www.h68spardirekt.com" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">www.h68spardirekt.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Online-Abteilung (Standort München)</h2>
            <p>
              H68 Vermögensverwaltung GmbH - Online-Abteilung<br />
              Maximilianstraße 14<br />
              80539 München<br />
              Deutschland
            </p>
            <p className="mt-2">
              <a href="tel:+4930544480850" className="text-green-600 hover:underline">+49 30 544 480 850</a><br />
              <a href="mailto:info@h68spardirekt.com" className="text-green-600 hover:underline">info@h68spardirekt.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Handelsregister</h2>
            <p>
              Eingetragen im Handelsregister des Amtsgerichts Cottbus<br />
              HRB 16794<br />
              EUID: DEG1103.HRB16794
            </p>
            <p className="mt-4">
              Zusätzlicher Registereintrag:<br />
              Amtsgericht Charlottenburg (Berlin)<br />
              HRB 218774 B
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Geschäftszweck</h2>
            <p>
              Die Verwaltung eigenen Vermögens, insbesondere die Verwaltung von Immobilien und immobilienbezogenen Investitionen - mit Ausnahme von Tätigkeiten, die eine Erlaubnis gemäß § 32 KWG erfordern.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              H68 Vermögensverwaltung GmbH<br />
              (Anschrift wie oben)
            </p>
          </section>


          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Haftungsausschluss</h2>
            <p>
              Die Inhalte (soweit vorhanden) dienen ausschließlich allgemeinen Informationszwecken.<br />
              Es wird keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der Informationen übernommen.<br />
              Für Inhalte externer Links sind ausschließlich deren Betreiber verantwortlich (§ 7 Abs. 1 TMG).
            </p>
          </section>
              
          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Sicherheit und Transparenz</h2>
            <p>
              Unser Unternehmen vermittelt ausschließlich an etablierte Banken.<br />
              Da wir reine Vermittlungsdienstleistungen erbringen und keine eigenen Finanzprodukte anbieten, benötigen wir keine eigene Erlaubnispflicht.<br />
              Ihre Einlagen und Kapitalerträge sind bei den Partnerbanken durch die gesetzliche Einlagensicherung sowie durch die Aufsicht der jeweiligen Finanzaufsichtsbehörden geschützt.
            </p>
          </section>  

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Datenschutzhinweis</h2>
            <p>
              Die Verarbeitung personenbezogener Daten erfolgt gemäß Datenschutz-Grundverordnung (DSGVO) und Bundesdatenschutzgesetz (BDSG).<br />
              Weitere Informationen entnehmen Sie bitte der separaten Datenschutzerklärung.
            </p>
          </section>
        </div>
      ),
    },
    privacy: {
      title: 'Datenschutzerklärung',
      body: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">1. Name und Kontaktdaten des Verantwortlichen</h2>
            <p>
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer datenschutzrechtlicher Bestimmungen ist:
            </p>
            <p className="mt-2">
              <strong>H68 Vermögensverwaltung GmbH</strong><br />
              Kienberger Allee 4<br />
              12529 Schönefeld<br />
              Deutschland
            </p>
            <p className="mt-2">
               <a href="tel:+4930544480850" className="text-green-600 hover:underline">+49 30 544 480 850</a><br />
               <a href="mailto:info@h68spardirekt.com" className="text-green-600 hover:underline">info@h68spardirekt.com</a><br />
               <a href="https://www.h68spardirekt.com" className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">www.h68spardirekt.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">2. Kontaktdaten des Datenschutzbeauftragten</h2>
            <p>
              Ein betrieblicher Datenschutzbeauftragter ist nicht benannt (nicht erforderlich gemäß Art. 37 DSGVO). Für datenschutzrechtliche Anfragen wenden Sie sich bitte direkt an die oben genannte Anschrift oder E-Mail-Adresse.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">3. Erhebung und Verwendung personenbezogener Daten</h2>
            
            <h3 className="text-lg font-semibold text-[#0B1E33] mb-2">a) Bei Kontaktaufnahme</h3>
            <p>
              Wenn Sie uns kontaktieren (z. B. unter info@h68spardirekt.com), erheben wir die von Ihnen übermittelten personenbezogenen Daten (z. B. Name, E-Mail-Adresse, Telefonnummer, Inhalt Ihrer Nachricht).
            </p>
            <p className="mt-2">
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bearbeitung Ihrer Anfrage) bzw. Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen oder Vertragserfüllung, falls zutreffend).
            </p>
            <p className="mt-2">
              Die Daten werden nur zur Bearbeitung Ihrer Anfrage verwendet und nach abschließender Klärung gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>

            <h3 className="text-lg font-semibold text-[#0B1E33] mb-2 mt-4">b) Keine weitere Datenerhebung</h3>
            <p>
              Es gibt keine Registrierungsfunktion, kein Nutzerkonto, kein Newsletter, keine Cookies für Statistik/Marketing und keine Analysetools (z. B. Google Analytics, Matomo). Eine automatisierte Weitergabe personenbezogener Daten an Dritte findet nicht statt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">4. Dauer der Speicherung</h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie es für die Erfüllung des Zwecks erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen (z. B. HGB, AO). Danach erfolgt eine Löschung bzw. Anonymisierung.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">5. Ihre Rechte (Art. 15–22 DSGVO)</h2>
            <p>Sie haben jederzeit das Recht auf:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Auskunft über Ihre gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung (sofern keine Aufbewahrungspflicht besteht)</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Verarbeitung (insbesondere bei berechtigtem Interesse)</li>
              <li>Widerruf erteilter Einwilligungen (mit Wirkung für die Zukunft)</li>
            </ul>
            <p className="mt-4">
              Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter der oben genannten Adresse oder E-Mail.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">6. Datenübermittlung in Drittländer</h2>
            <p>
              Es findet keine Übermittlung personenbezogener Daten in Drittländer (außerhalb der EU/EWR) statt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">7. Sicherheit</h2>
            <p>
              Wir treffen technische und organisatorische Maßnahmen zum Schutz Ihrer Daten (z. B. Zugriffsbeschränkungen). Bei E-Mail-Kommunikation kann jedoch keine absolute Sicherheit gewährleistet werden – wir empfehlen bei sensiblen Inhalten den Postweg.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">8. Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Wir passen diese Erklärung bei Bedarf an gesetzliche oder betriebliche Änderungen an. Die aktuelle Version finden Sie stets an dieser Stelle.
            </p>
          </section>
        </div>
      ),
    },
    terms: {
      title: 'Allgemeine Geschäftsbedingungen (AGB)',
      body: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Präambel</h2>
            <p>
              Die H68 Vermögensverwaltung GmbH verwaltet ausschließlich eigenes Vermögen. Es werden Dienstleistungen für Dritte erbracht, es werden Plattformen betrieben und Verträge mit Kunden abgeschlossen.
            </p>
            <p className="mt-2">
              Unsere Arbeit basiert auf klaren Strukturen, gesetzlicher Konformität und einem konsequenten Fokus auf Transparenz, Verlässlichkeit und nachhaltigen Werterhalt – für eigene Werte und die unserer Kunden gleichermaßen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 1 Geltungsbereich</h2>
            <p>
              (1) Diese AGB regeln alle Rechtsbeziehungen zwischen der H68 Vermögensverwaltung GmbH und Dritten, soweit nicht abweichende individuelle Vereinbarungen getroffen werden.<br />
              (2) Abweichende Bedingungen des Vertragspartners gelten nicht, auch wenn wir ihnen nicht ausdrücklich widersprechen.<br />
              (3) Die Gesellschaft richtet sich an natürliche und juristische Personen, die Dienstleistungen in Anspruch nehmen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 2 Leistungen</h2>
            <p>
              (1) Die H68 Vermögensverwaltung GmbH erbringt Dienstleistungen für Dritte und betreibt Plattformen.<br />
              (2) Es werden Verträge mit Kunden abgeschlossen. Die genaue Leistungsbeschreibung ergibt sich aus dem jeweiligen Vertrag oder der Leistungsvereinbarung.<br />
              (3) Soweit gesetzlich zulässig, können Leistungen auch regulierte Tätigkeiten umfassen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 3 Haftung und Gewährleistung</h2>
            <p>
              (1) Die Gesellschaft haftet nur für Vorsatz und grobe Fahrlässigkeit.<br />
              (2) Für leichte Fahrlässigkeit haftet die Gesellschaft nur bei Verletzung vertragswesentlicher Pflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den typischerweise vorhersehbaren Schaden beschränkt.<br />
              (3) Die Haftung nach Produkthaftungsgesetz sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit bleibt unberührt.<br />
              (4) Jegliche Gewährleistung oder Zusicherung für Richtigkeit, Vollständigkeit oder Aktualität von Informationen wird ausgeschlossen, soweit gesetzlich zulässig.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 4 Geistiges Eigentum</h2>
            <p>
              Alle Inhalte (Texte, Grafiken, Logos, Plattform-Elemente), die öffentlich zugänglich gemacht werden, sind urheberrechtlich geschützt. Jegliche Nutzung, Vervielfältigung oder Verbreitung bedarf unserer schriftlichen Zustimmung.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 5 Datenschutz</h2>
            <p>
              Die Verarbeitung personenbezogener Daten erfolgt ausschließlich gemäß unserer Datenschutzerklärung, die Bestandteil dieser AGB ist (Art. 6 DSGVO, BDSG).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 6 Widerrufsrecht</h2>
            <p>
              Soweit Verbraucherverträge oder Fernabsatzverträge vorliegen, gelten die gesetzlichen Widerrufsregelungen (§§ 355 ff. BGB). Bei Dienstleistungen, die sofort beginnen, erlischt das Widerrufsrecht vorzeitig, wenn der Kunde ausdrücklich zustimmt (§ 356 Abs. 4 BGB).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 7 Änderungen dieser AGB</h2>
            <p>
              Wir behalten uns vor, diese AGB mit Wirkung für die Zukunft zu ändern. Geänderte Fassungen werden rechtzeitig bekannt gemacht. Widerspruch innerhalb von 4 Wochen gilt als Ablehnung; andernfalls Zustimmung.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 8 Anwendbares Recht und Gerichtsstand</h2>
            <p>
              (1) Es gilt ausschließlich das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.<br />
              (2) Gerichtsstand ist Berlin, soweit der Vertragspartner Kaufmann ist oder keinen allgemeinen Gerichtsstand in Deutschland hat.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 9 Salvatorische Klausel</h2>
            <p>
              Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt (§ 306 BGB).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">§ 10 Streitbeilegung</h2>
            <p>
              Die H68 Vermögensverwaltung GmbH ist weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). Die OS-Plattform der EU ist erreichbar unter: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">https://ec.europa.eu/consumers/odr/</a>
            </p>
          </section>
        </div>
      ),
    },
    disclaimer: {
      title: 'Haftungsausschluss',
      body: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Unsere Rolle bei der H68 Vermögensverwaltung GmbH</h2>
            <p>
              Die H68 Vermögensverwaltung GmbH verwaltet ausschließlich eigenes Vermögen. Wir erbringen keine Dienstleistungen für Dritte, keine Finanzberatung, keine Anlagevermittlung und keine Plattformfunktionen.<br />
              Alle Angaben auf dieser Seite (soweit vorhanden) dienen ausschließlich der gesetzlich vorgeschriebenen Information über das Unternehmen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Wichtiger Hinweis</h2>
            <p>
              Die auf dieser Website veröffentlichten Informationen (www.h68spardirekt.com) sind allgemeiner Natur und werden mit größtmöglicher Sorgfalt erstellt. Eine Gewähr für die Richtigkeit, Vollständigkeit, Aktualität oder Eignung für bestimmte Zwecke wird jedoch nicht übernommen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Keine Beratung oder Empfehlung</h2>
            <p>
              Es werden keinerlei Beratungsleistungen im Sinne von Finanz-, Anlage-, Steuer-, Rechts- oder sonstiger Beratung erbracht. Die Inhalte stellen keine Empfehlung, Aufforderung oder sonstige rechtsverbindliche Erklärung dar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Externe Links</h2>
            <p>
              Soweit auf externe Internetseiten verwiesen wird, sind für deren Inhalte ausschließlich deren Betreiber verantwortlich (§ 7 Abs. 1 TMG). Wir haben keinerlei Einfluss auf diese Seiten und übernehmen keine Haftung.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Haftungsbeschränkung</h2>
            <p>
              Die H68 Vermögensverwaltung GmbH haftet – soweit gesetzlich zulässig – nur für Vorsatz und grobe Fahrlässigkeit. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit keine vertragswesentlichen Pflichten verletzt werden.<br />
              Die Haftung nach dem Produkthaftungsgesetz sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit bleibt unberührt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Zusammenfassung</h2>
            <p>
              Alle Informationen dienen ausschließlich der Erfüllung gesetzlicher Informationspflichten. Jede Nutzung oder Interpretation der Inhalte erfolgt auf eigenes Risiko.<br />
              Falls Sie Fragen haben, kontaktieren Sie uns bitte direkt.
            </p>
            <p className="mt-4">
              <strong>Kontakt:</strong><br />
              H68 Vermögensverwaltung GmbH<br />
              Kienberger Allee 4<br />
              12529 Schönefeld<br />
              Deutschland
            </p>
          </section>
        </div>
      ),
    },
    revocation: {
      title: 'Widerrufsbelehrung',
      body: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Widerrufsrecht</h2>
            <p>
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem der Vertrag geschlossen wurde.
            </p>
            <p className="mt-2">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns:
            </p>
            <p className="mt-2">
              <strong>H68 Vermögensverwaltung GmbH</strong><br />
              Kienberger Allee 4<br />
              12529 Schönefeld<br />
              Deutschland<br />
              <a href="mailto:info@h68spardirekt.com" className="text-green-600 hover:underline">info@h68spardirekt.com</a><br />
              <a href="tel:+4930544480850" className="text-green-600 hover:underline">+49 30 544 480 850</a>
            </p>
            <p className="mt-2">
              mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
            </p>
            <p className="mt-2">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Folgen des Widerrufs</h2>
            <p>
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
            </p>
            <p className="mt-2">
              Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Hinweis zum vorzeitigen Erlöschen des Widerrufsrechts</h2>
            <p>
              Bei Verträgen über Dienstleistungen erlischt das Widerrufsrecht vorzeitig, wenn wir die Dienstleistung vollständig erbracht haben und mit der Ausführung der Dienstleistung erst begonnen haben, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht verlieren (§ 356 Abs. 4 BGB).
            </p>
            <p className="mt-2">
              Bei unserer Plattform (falls eine Registrierung oder Dienstleistungsnutzung vorliegt) beginnt die Leistung in der Regel sofort – daher erlischt das Widerrufsrecht oft vorzeitig, wenn Sie zustimmen (z. B. durch Checkbox: „Ich stimme zu, dass die Dienstleistung sofort beginnt und mein Widerrufsrecht erlischt.“).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0B1E33] mb-4">Muster-Widerrufsformular</h2>
            <p className="mb-4">
              (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
            </p>
            <div className="bg-slate-50 p-6 rounded-md border border-slate-200">
              <p><strong>An:</strong><br />
                H68 Vermögensverwaltung GmbH<br />
                Kienberger Allee 4<br />
                12529 Schönefeld<br />
                Deutschland<br />
                 <a href="mailto:info@h68spardirekt.com" className="text-green-600 hover:underline">info@h68spardirekt.com</a>
              </p>
              <br />
              <p>
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*):
              </p>
              <br />
              <p>Bestellt am (*) / erhalten am (*): ______________________________</p>
              <br />
              <p>Name des/der Verbraucher(s): ________________________________</p>
              <br />
              <p>Anschrift des/der Verbraucher(s): ______________________________</p>
              <br />
              <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ______________________________</p>
              <br />
              <p>Datum: ______________________________</p>
              <br />
              <p className="text-sm text-slate-500">(*) Unzutreffendes streichen.</p>
            </div>
          </section>
        </div>
      ),
    },
  };

  const currentContent = content[page] || content.impressum;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight text-[#0B1E33] mb-6 break-words">
          {currentContent.title}
        </h1>
        <p className="text-sm text-slate-500 mb-8">Zuletzt aktualisiert: 1 Januar 2026</p>

        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 md:p-8 break-words">
          {currentContent.body}
        </div>

        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6">
          <h3 className="font-semibold text-[#0B1E33] mb-2">Fragen zu dieser Seite?</h3>
          <p className="text-sm text-slate-600 mb-3">
            Wenn Sie Fragen zu unseren rechtlichen Richtlinien haben, kontaktieren Sie uns bitte.
          </p>
          <a href="/contact" className="text-green-600 hover:text-green-700 font-medium text-sm">
            Kontakt aufnehmen →
          </a>
        </div>
      </div>

    </div>
  );
};

export default Legal;
