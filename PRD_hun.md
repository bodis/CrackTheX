PROJEKT SPECIFIKÁCIÓ: Interaktív Képletmegoldó Web App (MVP)
1. Termék Vízió és Alapelvek
Egy böngészőből futtatható, letöltést nem igénylő webes alkalmazás (PWA - Progressive Web App) diákoknak. A cél egy letisztult, sallangmentes eszköz létrehozása, amely a fizikai füzetben megírt matematikai egyenleteket digitalizálja, majd lépésről lépésre, interaktívan (vizuálisan is tanítva) levezeti a megoldást.

Design nyelv: Dark Mode (sötét téma), Glassmorphism (áttetsző, üvegszerű UI elemek), minimalizmus.

Fókusz: Stabilitás, pontos karakterfelismerés (OCR), és a "fogd és vidd" interakció az egyenlőségjelen keresztül. Nincs AI chat, nincsenek felesleges közösségi funkciók.

2. Támogatott Funkciók (MVP)
Kamera hozzáférés és Képkészítés: A böngészőből közvetlenül elérhető a mobil/készülék kamerája.

Képkivágás (Cropping): A lefotózott oldalból a felhasználó egy mozgatható kerettel kijelölheti a konkrét egyenletet.

Matematikai OCR: A kivágott kép elküldése egy külső API-nak, amely visszaadja a képletet gépelt (LaTeX) formátumban.

Emberi ellenőrzés és javítás: A felismert képlet vizuális megjelenítése és kézi szerkeszthetősége az OCR hibák kiküszöbölésére.

Szimbolikus egyenletmegoldás: Az egyenlet levezetése lépésről lépésre a böngészőben (matematikai motor segítségével).

Interaktív tanulás (Áthúzás): A felhasználó az ujjával/egérrel áthúzhat egy számot vagy változót az egyenlőségjel másik oldalára, ami automatikusan előjelet vált (pl. + ból - lesz), és a program kiszámolja a következő sort.

Szabály-magyarázó címkék: Minden levezetési lépés mellett egy rövid szöveges címke (pl. "Kivonás mindkét oldalból").

3. Képernyők és UX/UI Terv (Single Page Application - 3 Állapot)
A weboldal nem töltődik újra, csak a 3 fő "állapot" (State) között vált a képernyőn.

Állapot 1: A Szkenner (Bemenet)

Kinézet: A képernyőt a kamera élőkép tölti ki.

UI Elemek:

Sötét, áttetsző alsó sáv (Glassmorphism stílus).

Egy nagy "Fotózás" gomb középen.

Folyamat: Gombnyomásra a kép kimerevedik. Megjelenik egy interaktív vágókeret a képen. A gomb átvált "Kijelölés Kész" feliratra.

Állapot 2: Az Ellenőrző (Validáció)

Kinézet: Sötétkék/fekete háttér. Két áttetsző, matt üveghatású "kártya" (doboz) a képernyőn.

UI Elemek:

Felső kártya: Kicsiben mutatja az Állapot 1-ben kivágott képrészletet (az eredeti kézírást).

Alsó kártya: Nagy, klasszikus (Serif) betűtípussal mutatja a gép által felismert képletet.

Beviteli mező (Input): A felismert képlet alatt egy egyszerű szövegdoboz, ahol a rendszer alapértelmezett billentyűzetével bele lehet írni a kódba, ha az OCR tévedett. A felső renderelt képlet valós időben frissül, ahogy gépel.

Akció gomb: Egy kiemelt "Megoldás!" gomb legalul.

Állapot 3: Az Interaktív Tábla (Eredmény)

Kinézet: Gördíthető, függőleges "kártyás" elrendezés a sötét háttéren.

UI Elemek:

Fejléc kártya: A kiinduló egyenlet.

Lépés-kártyák: Egymás alatt elhelyezkedő áttetsző dobozok. Minden dobozban egy matematikai lépés, jobb felső sarkában a használt szabály megnevezésével.

Interaktív Zóna: Az utolsó kártyán a képlet elemei "megfoghatók". Ha a felhasználó egy tagot az egyenlőségjel másik oldalára húz, az elem animálva átkerül, előjelet vált, és automatikusan legenerálódik alatta az újabb lépés-kártya.

Lábjegyzet: Egy "Új feladat / Újra" lebegő gomb (FAB - Floating Action Button), ami visszavisz az 1. Állapotba.

4. Technológiai Stack (Mit használjon az AI a kódoláshoz?)
Ezt a listát adhatod meg az AI-nak, hogy tudja, milyen JavaScript könyvtárakat (libraries) vonjon be a projektbe.

Alapok: HTML5, CSS3 (CSS Variables a színekhez, backdrop-filter: blur() az üveghatáshoz), Vanilla JavaScript (vagy React/Vue, ha egy keretrendszert preferálsz, de sima JS-ben is tökéletes az MVP).

Kamera és Képkivágás: Cropper.js (A legegyszerűbb és legstabilabb könyvtár képkivágásra a weben).

Képletfelismerés (OCR): Mathpix API. (Az AI kódolónak írd meg, hogy készítse fel a fetch kérést a Mathpix API formátumára. Ehhez majd kell regisztrálnod egy ingyenes API kulcsot a Mathpix oldalán).

Matematikai Renderelés (Megjelenítés): KaTeX (Gyorsabb és modernebb, mint a MathJax. Gyönyörű nyomdai formátumot csinál a kódokból).

Matematikai Motor (Logika): Nerdamer.js vagy Math.js. (Ez végzi az egyenlet rendezését a háttérben böngésző szinten).

Interakció (Drag and Drop): Interact.js (Kiválóan kezeli az érintőképernyős "fogd és vidd" mozdulatokat).

Animációk: GSAP (GreenSock Animation Platform) az áthúzott számok sima átváltoztatásához (pl. amikor átér a másik oldalra és pukkan egyet).