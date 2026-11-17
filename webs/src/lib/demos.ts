import type { Business, DayHours } from "./types";

const h = (...r: [string, string][]): DayHours => r.map(([open, close]) => ({ open, close }));
const closed: DayHours = [];

/**
 * Negocis d'exemple per ensenyar a les visites. Són ficticis:
 * noms, telèfons, NIF i preus són inventats i les fotos són d'Unsplash (llicència lliure).
 */
export const demos: Business[] = [
  {
    slug: "fisio-cardener",
    name: "Fisioteràpia Cardener",
    sector: "salut",
    headline: "Fisioteràpia a Manresa per tornar a moure't sense dolor",
    intro: "Mal d'esquena, lesions esportives o recuperació després d'una operació. Primer entenem què et passa i després et donem un pla que pots seguir a casa.",
    fact: "Sessions de 50 minuts, sempre amb el mateix fisioterapeuta",
    town: "Manresa",
    street: "Carrer de Sant Miquel",
    phone: "93 000 00 01",
    whatsapp: "34600000001",
    email: "hola@fisiocardener.example",
    hours: [h(["09:00", "13:30"], ["15:30", "20:30"]), h(["09:00", "13:30"], ["15:30", "20:30"]), h(["09:00", "13:30"], ["15:30", "20:30"]), h(["09:00", "13:30"], ["15:30", "20:30"]), h(["09:00", "15:00"]), closed, closed],
    services: [
      { name: "Fisioteràpia general", description: "Esquena, coll, espatlla i genoll. Valoració i tractament manual.", price: "45 €", duration: "50 min" },
      { name: "Lesions esportives", description: "Recuperació i tornada a l'entrenament amb un pla per fases.", price: "50 €", duration: "50 min" },
      { name: "Punció seca", description: "Per a punts de tensió que no cedeixen amb el massatge.", price: "35 €", duration: "30 min" },
      { name: "Sòl pèlvic", description: "Postpart, incontinència i preparació per al part.", price: "55 €", duration: "50 min" },
      { name: "Bo de 5 sessions", description: "Per a tractaments llargs, sense data de caducitat.", price: "200 €" },
    ],
    steps: [
      { title: "Escoltem i valorem", text: "La primera visita comença amb una conversa i unes proves de moviment. Sortiràs sabent què et passa." },
      { title: "Tractem amb les mans", text: "Teràpia manual, punció seca o exercici guiat, segons el que necessiti el teu cos aquell dia." },
      { title: "Et donem feina per a casa", text: "Tres o quatre exercicis senzills, en vídeo al mòbil, perquè la millora no s'aturi quan surts per la porta." },
    ],
    statement: "No tractem una esquena. Tractem la persona que s'hi ha d'aixecar cada matí per anar a treballar.",
    notice: { title: "Novetat", text: "Ara també fem sessions de sòl pèlvic els dimarts i dijous a la tarda." },
    photos: {
      hero: { src: "photo-1758063800058-473d9071937a", alt: "Mans de fisioterapeuta sobre l'esquena d'un pacient" },
      steps: [
        { src: "photo-1649751361457-01d3a696c7e6", alt: "Valoració del genoll d'un pacient" },
        { src: "photo-1540205895360-4ad4cffb3aa8", alt: "Tractament manual a l'esquena" },
        { src: "photo-1522898467493-49726bf28798", alt: "Exercici amb pilota de fitball" },
      ],
      gallery: [
        { src: "photo-1630226040750-d934f017f0e4", alt: "Llitera de tractament a la sala" },
        { src: "photo-1645005512968-0c1fe99f0093", alt: "Massatge a l'espatlla" },
        { src: "photo-1611073615830-9f76902c10fe", alt: "Massatge a la mà" },
        { src: "photo-1630226092782-9c851567e84e", alt: "Bicicleta estàtica de rehabilitació" },
      ],
    },
    heroVideo: "https://videos.pexels.com/video-files/6111093/6111093-hd_1280_720_25fps.mp4",
    team: [
      { name: "Marc Soler", role: "Fisioterapeuta · lesions esportives", text: "Ex-jugador de bàsquet. Sap què és tornar a jugar després d'una lesió.", photo: { src: "photo-1611608822650-925c227ef4d2", alt: "Marc, fisioterapeuta" } },
      { name: "Laia Prat", role: "Fisioterapeuta · sòl pèlvic", text: "Especialitzada en postpart i en dolor lumbar crònic.", photo: { src: "photo-1612944095914-33fd0a85fcfc", alt: "Laia, fisioterapeuta" } },
      { name: "Jordi Vila", role: "Fisioterapeuta · teràpia manual", text: "Quinze anys tractant esquenes i colls de gent que treballa asseguda.", photo: { src: "photo-1746813628081-0c8c1611aace", alt: "Jordi, fisioterapeuta" } },
    ],
    reviews: { rating: 4.9, count: 128, items: [
      { text: "Vaig arribar amb el genoll inflat i ara torno a córrer. M'explicaven cada exercici i el perquè.", author: "Núria G.", when: "fa 2 setmanes" },
      { text: "La primera visita ja vaig notar diferència. Molt professionals i puntuals.", author: "Pere M.", when: "fa 1 mes" },
      { text: "Després del part em vaig sentir molt acompanyada. La Laia és un sol.", author: "Clara R.", when: "fa 3 mesos" },
    ] },
    offers: [
      { tag: "Nous pacients", title: "Primera valoració", text: "Visita de 50 minuts amb diagnòstic i pla de tractament per escrit.", price: "35 €" },
      { tag: "Estalvia 25 €", title: "Bo de 5 sessions", text: "Per a tractaments llargs. Sense data de caducitat i compartible amb la família.", price: "200 €" },
    ],
    faq: [
      { q: "Necessito una recepta del metge?", a: "No. Pots venir directament. Si tens informes o proves, porta'ls a la primera visita." },
      { q: "Treballeu amb mútues?", a: "Treballem amb les principals mútues esportives i d'accidents. Pregunta'ns per la teva abans de venir." },
      { q: "Quina roba he de portar?", a: "Roba còmoda. Si et tractem una cama, millor uns pantalons curts." },
      { q: "Quantes sessions necessitaré?", a: "Depèn de cada cas. A la primera visita et donem una previsió i la revisem cada setmana." },
    ],
    legal: { owner: "Fisioteràpia Cardener SL (exemple)", nif: "B00000001", address: "Carrer de Sant Miquel, Manresa" },
    variant: { layout: 0, palette: 0, type: 0 },
    demo: true,
  },
  {
    slug: "estudi-alba",
    name: "Estudi Alba",
    sector: "bellesa",
    headline: "Perruqueria a Manresa per a cabells que volen alguna cosa més",
    intro: "Tall, color i pentinats amb hora concertada. Sense presses i amb productes que respecten el cabell.",
    fact: "Especialistes en balayage i color natural",
    town: "Manresa",
    street: "Passeig de Pere III",
    phone: "93 000 00 02",
    whatsapp: "34600000002",
    email: "cita@estudialba.example",
    hours: [closed, h(["09:30", "19:30"]), h(["09:30", "19:30"]), h(["09:30", "20:30"]), h(["09:30", "20:30"]), h(["09:00", "14:00"]), closed],
    services: [
      { name: "Tall i pentinat", price: "32 €", duration: "45 min" },
      { name: "Tall home", price: "18 €", duration: "30 min" },
      { name: "Color arrel", price: "38 €", duration: "1 h 15" },
      { name: "Balayage", description: "Inclou tractament i matisador", price: "desde 95 €", duration: "2 h 30" },
      { name: "Tractament de queratina", price: "desde 120 €", duration: "2 h" },
      { name: "Recollit per a esdeveniments", description: "Prova inclosa", price: "desde 45 €", duration: "1 h" },
    ],
    steps: [
      { title: "Diagnòstic del cabell", text: "Abans de tocar res, mirem com està el teu cabell i parlem del que vols." },
      { title: "Color a mida", text: "Barregem cada color per a tu. Cap clienta surt amb el mateix to que l'anterior." },
      { title: "Acabat i consells", text: "T'expliquem com cuidar-lo a casa perquè duri setmanes com el primer dia." },
    ],
    statement: "Un bon tall no es nota el primer dia. Es nota el dia quinze, quan encara et queda bé sense fer-hi res.",
    photos: {
      hero: { src: "photo-1580618672591-eb180b1a973f", alt: "Perruquera assecant el cabell d'una clienta amb raspall rodó" },
      steps: [
        { src: "photo-1634449571010-02389ed0f9b0", alt: "Tall de cabell a una clienta" },
        { src: "photo-1629397685944-7073f5589754", alt: "Pentinat amb tenalles" },
        { src: "photo-1595475884562-073c30d45670", alt: "Raspalls, tisores i pinzell de tint" },
      ],
      gallery: [
        { src: "photo-1633681926022-84c23e8cb2d6", alt: "Saló amb cadires negres i miralls rodons" },
        { src: "photo-1600948836101-f9ffda59d250", alt: "Tres tocadors amb miralls circulars" },
        { src: "photo-1562322140-8baeececf3df", alt: "Perruquera amb assecador" },
        { src: "photo-1521590832167-7bcbfaa6381f", alt: "Cadires de perruqueria davant d'un taulell blanc" },
        { src: "photo-1761839256791-6a93f89fb8b0", alt: "Clienta amb capa negra al saló" },
        { src: "photo-1549271568-e87e07c5406b", alt: "Tisores sobre una tovallola" },
      ],
    },
    heroVideo: "https://videos.pexels.com/video-files/8830509/8830509-hd_1280_720_25fps.mp4",
    team: [
      { name: "Alba Riera", role: "Fundadora · colorista", text: "Dotze anys fent balayages. Va obrir l'estudi el 2019.", photo: { src: "photo-1619718633303-3e73266c5b6c", alt: "Alba, colorista" } },
      { name: "Pau Serra", role: "Estilista · tall home i barba", text: "Talls clàssics i degradats amb navalla.", photo: { src: "photo-1553521041-d168abd31de3", alt: "Pau, estilista" } },
    ],
    reviews: { rating: 4.8, count: 96, items: [
      { text: "El millor balayage que m'han fet mai. Natural i ha durat mesos.", author: "Marta S.", when: "fa 1 setmana" },
      { text: "Et diuen el preu abans de començar i no hi ha sorpreses. Repetiré segur.", author: "Judit F.", when: "fa 3 setmanes" },
      { text: "En Pau és un crac amb el degradat. Ambient molt tranquil.", author: "Arnau P.", when: "fa 2 mesos" },
    ] },
    offers: [
      { tag: "Dimarts i dimecres", title: "Tall + tractament hidratant", text: "Cabell sec després de l'estiu? El tractament et surt a meitat de preu.", price: "42 €" },
      { tag: "Núvies 2027", title: "Paquet de casament", text: "Prova, pentinat el dia de la boda i desplaçament a Manresa i rodalies.", price: "desde 180 €" },
    ],
    faq: [
      { q: "Cal demanar hora?", a: "Sí, treballem amb cita per no fer-te esperar. Escriu-nos per WhatsApp i et responem el mateix dia." },
      { q: "Quant dura un balayage?", a: "Entre dues hores i mitja i tres, segons la llargada i el gruix del cabell." },
      { q: "Quins productes feu servir?", a: "Colors sense amoníac i tractaments vegans de marques professionals. Te'ls podem recomanar per a casa." },
      { q: "Puc anul·lar la cita?", a: "I tant. Avisa'ns amb 24 hores perquè puguem donar l'hora a una altra persona." },
    ],
    legal: { owner: "Alba Exemple (autònoma)", nif: "00000000T", address: "Passeig de Pere III, Manresa" },
    variant: { layout: 0, palette: 0, type: 0 },
    demo: true,
  },
  {
    slug: "brasa-del-pont",
    name: "La Brasa del Pont",
    sector: "restauracio",
    headline: "Restaurant de brasa a Manresa, amb producte del Bages",
    intro: "Carn i verdura a la graella de llenya, vins de la DO Pla de Bages i un menú de migdia que canvia cada setmana.",
    fact: "Menú de migdia de dimarts a divendres, 16 €",
    town: "Manresa",
    street: "Carrer del Pont Vell",
    phone: "93 000 00 03",
    whatsapp: "34600000003",
    email: "taula@brasadelpont.example",
    hours: [closed, h(["13:00", "16:00"]), h(["13:00", "16:00"]), h(["13:00", "16:00"], ["20:30", "23:00"]), h(["13:00", "16:00"], ["20:30", "23:30"]), h(["13:00", "16:30"], ["20:30", "23:30"]), h(["13:00", "16:30"])],
    services: [],
    menu: [
      {
        title: "Per compartir",
        items: [
          { name: "Pa de pagès amb tomàquet i oli de l'Alt Bages", price: "3,50 €" },
          { name: "Croquetes de rostit de l'àvia", description: "6 unitats", price: "9 €" },
          { name: "Escalivada a la brasa amb anxoves", price: "11 €" },
          { name: "Carxofes de temporada a la graella", price: "12 €" },
        ],
      },
      {
        title: "De la brasa",
        items: [
          { name: "Botifarra del Bages amb mongetes", price: "14 €" },
          { name: "Xai de Moià a costelles", price: "21 €" },
          { name: "Entrecot de vedella, 300 g", price: "24 €" },
          { name: "Bacallà a la llenya amb allioli suau", price: "19 €" },
        ],
      },
      {
        title: "Postres",
        items: [
          { name: "Crema catalana cremada al moment", price: "5,50 €" },
          { name: "Mató amb mel i nous", price: "5 €" },
        ],
      },
    ],
    steps: [
      { title: "Producte de la comarca", text: "Carn de Moià, verdures de l'horta de Manresa i oli de les cooperatives del Bages." },
      { title: "Llenya d'alzina", text: "Encenem la graella cada dia a les onze perquè la brasa arribi al punt a l'hora de dinar." },
      { title: "Vins del Pla de Bages", text: "Una carta curta de cellers de la DO, i sempre un picapoll per copes." },
    ],
    statement: "La brasa no té pressa. Per això encenem el foc dues hores abans d'obrir la porta.",
    notice: { title: "Aquest divendres", text: "Sopar de calçots amb salsa de la casa. Reserva per WhatsApp." },
    photos: {
      hero: { src: "photo-1776763255189-3c8237aec808", alt: "Menjador acollidor del restaurant amb taules parades" },
      steps: [
        { src: "photo-1653233797467-1a528819fd4f", alt: "Verdures tallant-se a la taula de cuina" },
        { src: "photo-1771285119318-b342c3ecc51c", alt: "Safata de carns i verdures a la brasa" },
        { src: "photo-1719996155228-bbac3f5a8843", alt: "Copes de vi i formatge sobre una taula de fusta" },
      ],
      gallery: [
        { src: "photo-1761110429384-0678d7015545", alt: "Taula de fusta amb tapes sobre pa" },
        { src: "photo-1564844536308-50b114a1d946", alt: "Cuiner acabant un plat amb herbes" },
        { src: "photo-1765118527220-da9c7a560b13", alt: "Oli d'oliva abocant-se sobre herbes" },
        { src: "photo-1597290282695-edc43d0e7129", alt: "Prestatge de fusta amb ampolles de vi" },
        { src: "photo-1767096088529-1ba1ecc457ee", alt: "Taula amb entrants i begudes" },
        { src: "photo-1600565193348-f74bd3c7ccdf", alt: "Cuiner amb uniforme blanc cuinant" },
      ],
    },
    heroVideo: "https://videos.pexels.com/video-files/4042718/4042718-hd_1280_720_24fps.mp4",
    team: [
      { name: "Toni Puig", role: "Cuiner i brasa", text: "Va aprendre a fer foc a la masia de l'avi, a Navarcles.", photo: { src: "photo-1689588532679-4bb5fdd8f6d5", alt: "Toni, cuiner" } },
      { name: "Aïda Camps", role: "Sala i vins", text: "Tria cada vi de la carta visitant els cellers de la DO.", photo: { src: "photo-1731576089290-e6230a18dcb4", alt: "Aïda, responsable de sala" } },
    ],
    reviews: { rating: 4.7, count: 312, items: [
      { text: "La botifarra amb mongetes és de les millors del Bages. El menú de migdia, imbatible.", author: "Xavier C.", when: "fa 5 dies" },
      { text: "Servei atent i la brasa al punt. L'entrecot, espectacular.", author: "Anna L.", when: "fa 2 setmanes" },
      { text: "Vam celebrar un aniversari amb 14 persones i tot perfecte. Gràcies, Aïda!", author: "Montse V.", when: "fa 1 mes" },
    ] },
    offers: [
      { tag: "De dimarts a divendres", title: "Menú de migdia", text: "Primer, segon a la brasa, postres, pa i vi o aigua. Canvia cada setmana.", price: "16 €" },
      { tag: "Grups", title: "Menú per a celebracions", text: "Per a grups de 10 o més: entrants per compartir, brasa i pastís.", price: "38 €/pers." },
    ],
    faq: [
      { q: "Cal reservar?", a: "Els caps de setmana sí. Entre setmana a migdia normalment hi ha lloc, però et recomanem escriure'ns." },
      { q: "Teniu opcions vegetarianes?", a: "Sí: verdures a la brasa, escalivada, carxofes i un plat del dia vegetarià." },
      { q: "Hi ha opcions sense gluten?", a: "La majoria de plats de brasa no en porten. Avisa'ns i et diem quins." },
      { q: "Es pot venir amb gos?", a: "A la terrassa sí. A dins només gossos d'assistència." },
    ],
    legal: { owner: "La Brasa del Pont SL (exemple)", nif: "B00000003", address: "Carrer del Pont Vell, Manresa" },
    variant: { layout: 0, palette: 0, type: 0 },
    demo: true,
  },
];

export function getBusiness(slug: string) {
  return demos.find((d) => d.slug === slug);
}
