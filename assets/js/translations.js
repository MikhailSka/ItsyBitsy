/**
 * Translations Manager - ItsyBitsy Montessori Preschool
 */

class TranslationManager {
    constructor() {
        this.defaultLanguage = 'pl';
        this.currentLanguage = this.getStoredLanguage() || this.defaultLanguage;
        this.translations = {};
        this.init();
    }

    init() {
        this.loadTranslations();
        this.setupLanguageButtons();
        this.setInitialLanguage();
    }

    loadTranslations() {
        this.translations = {
            pl: {
                // Navigation
                nav_home: "Strona Główna",
                nav_about: "O Nas",
                nav_services: "Nasza Wyjątkowość",
                nav_testimonials: "Opinie",
                nav_contact: "Kontakt",
                
                // Page metadata
                page_title: "ItsyBitsy - Przedszkole Montessori",
                meta_description: "Międzynarodowe przedszkole dwujęzyczne Montessori w Warszawie. Zanurzenie w angielskim przez cały dzień.",
                
                // Hero Section
                hero_badge: "Przedszkole Montessori",
                hero_title: "Międzynarodowe przedszkole dwujęzyczne Montessori. Zanurzenie w angielskim, przez cały dzień, codziennie.",
                hero_subtitle: "Odkryj moc edukacji Montessori w dwujęzycznym środowisku, gdzie Twoje dziecko rozwija się naturalnie i z radością.",
                schedule_meeting: "Umów spotkanie",
                learn_more: "Dowiedz się więcej",
                
                // Hero Stats
                hero_stat_experience: "Lat doświadczenia",
                hero_stat_children: "Szczęśliwych dzieci", 
                hero_stat_bilingual: "Dwujęzyczność",

                // About Section
                about_title: "Tylko to, co najlepsze dla Twojego dziecka!",
                about_badge: "Nasza misja",
                about_subtitle: "Poznaj naszą filozofię",
                bilingual_title: "Dwujęzyczność",
                no_pressure_title: "Bez presji",
                about_text_1: "ItsyBitsy to międzynarodowe przedszkole dwujęzyczne działające według metody Montessori.",
                about_text_2: "Tworzymy środowisko, w którym dzieci rozwijają się naturalnie, ucząc się przez zabawę i eksplorację.",
                about_text_3: "Nasze przedszkole to miejsce, gdzie każde dziecko może odkrywać świat w swoim tempie, budując pewność siebie i niezależność.",

                // Services Section
                services_title: "Nasza wyjątkowość",
                uniqueness_badge: "Nasza wyjątkowość",
                uniqueness_title: "Co nas wyróżnia?",
                uniqueness_subtitle: "Poznaj trzy filary naszej edukacji, które czynią nas wyjątkowymi",
                services_subtitle: "Co oferujemy Waszym dzieciom",

                service_1_title: "Program Montessori 3-6 lat",
                service_1_description: "Pełny program akademicki Montessori dla dzieci w wieku 3-6 lat.",

                service_2_title: "Dwujęzyczność",
                service_2_description: "Dwujęzyczność - codzienne zanurzenie w języku angielskim, program edukacyjny w języku polskim i angielskim.",

                service_3_title: "Native speaker",
                service_3_description: "Rodzimy użytkownik języka angielskiego w każdej grupie, przez cały dzień.",

                service_4_title: "Bez presji",
                service_4_description: "Bez presji, z uważnością i szacunkiem.",

                // Only the Best Section
                only_best_title: "Tylko to, co najlepsze dla Twojego dziecka!",
                only_best_point_1: "Pełen program akademicki Montessori dla dzieci 3-6 lat.",
                only_best_point_2: "Dwujęzyczność - codzienne zanurzenie w języku angielskim, program edukacyjny po polsku i angielsku.",
                only_best_point_3: "Rodzimy użytkownik języka angielskiego w każdej grupie, przez cały dzień.",
                only_best_point_4: "Bez presji, z uważnością i szacunkiem.",
                
                // Grid Section
                call_us: "Zadzwoń",
                send_email: "Wyślij mail",
                leave_contact_yourself: "Zostaw kontakt do siebie",
                get_to_know_us: "Poznaj nas bliżej",
                grid_education_title: "Edukacja oparta na wiedzy i zrozumieniu dziecka",
                grid_education_text: "Realizujemy pełny program Montessori, wspierający rozwój poznawczy, emocjonalny i społeczny dzieci. Nasze klasy są wyposażone w oryginalne materiały Montessori, a wszechstronnie wykształceni nauczyciele codziennie towarzyszą dzieciom w ich indywidualnym rozwoju – bez pośpiechu, z uważnością i szacunkiem.",
                grid_authentic_title: "Autentyczna dwujęzyczność",
                grid_authentic_text: "Angielski przez cały dzień – naturalnie i bez presji. Dzieci codziennie funkcjonują w środowisku dwujęzycznym – polskim i angielskim. Nasi anglojęzyczni nauczyciele są obecni w grupie przez cały dzień, dzięki czemu język angielski przyswajany jest w sposób naturalny, poprzez relacje, zabawę i codzienne sytuacje. To zanurzenie, a nie lekcje.",
                grid_relationships_title: "Podejście relacyjne i bliskościowe",
                grid_relationships_text: "Bezpieczne relacje są fundamentem rozwoju. W centrum naszej pracy są relacje – z dzieckiem, z rodzicem, w zespole. Tworzymy przestrzeń, w której każde dziecko czuje się widziane, słyszane i ważne. Adaptacja, codzienne rytuały, rozwiązywanie konfliktów – wszystko opieramy na empatii, uważności i komunikacji bez przemocy (NVC).",
                
                // Testimonials Section
                testimonials_title: "Opinie rodziców",
                testimonials_badge: "Co mówią rodzice",
                testimonials_subtitle: "Przez ponad 10 lat wypuściliśmy w świat setki szczęśliwych i świetnie przygotowanych do życia i do szkoły przedszkolaków!",
                
                testimonial_1_name: "Pani Joanna:",
                testimonial_1_text: "Mój syn chodzi do ItsyBitsy od 2 lat i jestem zachwycona postępami w nauce języka angielskiego. Metoda Montessori pozwala mu rozwijać się w naturalny sposób.",

                testimonial_2_name: "Pani Ilona:",
                testimonial_2_text: "Do przedszkola od kilku lat chodzą dwójka moich dzieci - zawsze mogłam liczyć na najlepszą opiekę i zaangażowanie - wiem, co mówię bo mam porównanie z innymi placówkami.",
                testimonial_2_text_2: "To co było dla mnie ważne, to to, że zespół Itsy Bitsy nie jest po to, żeby odpowiadać na potrzeby rodzica, tylko na potrzeby dziecka.",
                testimonial_2_text_3: "Współpraca z rodzicem jest zawsze partnerska, a zespół - zawsze dostępny i otwarty. Moje dzieciaki kochają chodzić do Itsy Bitsy, gorąco polecam.",

                testimonial_3_name: "Pani Nadieżda:",
                testimonial_3_text: "Chciałabym podkreślić naszą szczerą wdzięczność nauczycielom i dyrektorowi ItsyBitsy za życzliwość, profesjonalizm, opiekę i wsparcie.",
                testimonial_3_text_2: "Szczególnie poruszyła mnie miłość i uwaga, z jaką traktowaliście naszą córkę. Wasza życzliwość i profesjonalizm pomagały jej nie tylko pokonać trudności adaptacyjne.",
                testimonial_3_text_3: "System Montessori okazał się dla nas prawdziwym odkryciem. Z pełnym przekonaniem polecamy Państwa przedszkole wszystkim rodzicom.",
                
                testimonial_1_text_2: "Zawsze mogliśmy liczyć na najlepszą opiekę, dużo ciepła i empatii - córka na tyle tego, że skończyła przedszkole prawie 2 lata temu chętnie tam wraca.",
                testimonial_1_text_3: "Itsy Bitsy świetnie przygotowuje dzieci do szkoły - nie tylko pod kątem merytorycznym, ale również emocjonalnym. Wszystko to za sprawą kadry - zarówno nauczycieli jak i Dyrekcji. Ogromnym plusem jest rodzinna atmosfera oraz native speaker, który jest bardzo naturalny z opiekunów każdej z grup - dzięki temu dzieci w naturalny sposób mogą uczyć się angielskiego. Efekt? Kończąc przedszkole dzieci nie tylko rozumieją, ale również potrafią się komunikować w tym języku.",
                testimonial_1_text_4: "Jeśli zastanawiacie się, czy to miejsce dla Was - przyjdźcie i sprawdźcie - jestem pewna, że dzieci pokochają to miejsce.",
                
                testimonial_3_text_2: "Szczególnie poruszyła mnie miłość i uwaga, z jaką traktowaliście naszą córkę. Wasza życzliwość i profesjonalizm pomagały jej nie tylko pokonać trudności adaptacyjne, ale także nawiązać nowe przyjaźnie, rozwijać pewność siebie i zainteresowanie nauką.",
                testimonial_3_text_3: "System Montessori, z którego korzystacie w swoim przedszkolu, okazał się dla nas prawdziwym odkryciem. Widzimy, jak dzięki Waszym zajęciom nasza córka staje się coraz bardziej samodzielna, pracowita i przygotowana do nauki w szkole. To nieoceniony wkład w jej przyszłość, za co jesteśmy Państwu szczerze wdzięczni.",
                testimonial_3_text_4: "Z pełnym przekonaniem polecamy Państwa przedszkole wszystkim rodzicom, którzy szukają ciepłego, troskliwego i opiekuńczego środowiska dla swoich dzieci. Tworzycie niesamowitą atmosferę, w której każde dziecko czuje się wyjątkowo i kochane.",
                testimonial_3_text_5: "Na zawsze pozostaniemy w naszych sercach. Z miłością i wielką wdzięcznością ukochanej ItsyBitsy",
                
                // Why Us Section
                why_us_title: "Dlaczego właśnie my?",
                why_us_badge: "Dlaczego my",
                why_us_subtitle: "Bo chcesz tylko tego, co najlepsze dla swojego dziecka!",
                why_us_point_1: "Pełen program akademicki Montessori– dzieci uczą się we własnym tempie, rozwijają kluczowe kompetencje przyszłości.",
                why_us_point_2: "Bliskość – budujemy relacje oparte na szacunku i i zaufaniu.",
                why_us_point_3: "Dwujęzyczność przez immersję – język angielski naturalnie towarzyszy dzieciom każdego dnia, przez cały dzień.",
                why_us_point_4: "Zespół z misją i sercem– doświadczona, stała i świetnie wykształcona kadra, która naprawdę lubi dzieci i swoją pracę",
                why_us_point_5: "Nauczyciel-native speaker w każdej grupie, komunikujący się wyłącznie po angielsku.",
                why_us_point_6: "Piękne, spokojne wnętrza – naturalne materiały, światło, harmonia i czystość.",
                
                // Visit Us Section
                visit_us_title: "Zajrzyj do nas!",
                visit_us_badge: "Zajrzyj do nas",
                visit_us_text: "Zobacz, jak wygląda dzień w naszym przedszkolu. Nasza codzienność to zadowolone, bezpieczne, skupione dzieci, ciepłe relacje, spokojna przestrzeń i zaangażowani nauczyciele. Tak właśnie wygląda u nas edukacja w duchu Montessori i bliskości.",
                visit_us_question: "Chcesz wiedzieć, czy to miejsce dla Was?",
                visit_us_cta: "Najlepiej zobaczyć wszystko na własne oczy!",
                
                // Listen to Children Section
                listen_children_title: "Posłuchaj dzieci!",
                children_perspective_badge: "Perspektywa dzieci",
                listen_children_subtitle: "Przedszkole widziane z najważniejszej perspektywy, z poziomu około 116cm!",
                listen_children_text_1: "To, co naprawdę liczy się w przedszkolu, najlepiej widać w spojrzeniu dziecka.",
                listen_children_text_2: "W radości odkrywania, w pewności siebie, gdy samo sięga po materiały, w swobodzie, z jaką wita nauczyciela.",
                listen_children_text_3: "To dzieci wiedzą najlepiej, co daje im poczucie bezpieczeństwa, co lubią najbardziej, gdzie czują się jak u siebie.",
                listen_children_text_4: "W tej przestrzeni nie ma przypadków – każde miejsce, materiał, rytuał i relacja wspiera ich naturalny rozwój.",
                listen_children_text_5: "A dzieci to czują.",
                listen_children_highlight: "To nie tylko przedszkole. To ich miejsce mocy.",
                
                // Let's Meet Section
                lets_meet_title: "Poznajmy się.",
                lets_meet_subtitle: "Umów dziecko na bezpłatny warsztat i zrelaksuj się przy kawie!",
                
                // Workshop Section
                free_badge: "Bezpłatnie",
                welcome_badge: "Zapraszamy",
                workshop_title: "Bezpłatny warsztat dla dziecka",
                workshop_subtitle: "Poznaj nasze metody w praktyce",
                coffee_title: "Kawa dla rodziców",
                coffee_subtitle: "Relaksujący czas podczas zajęć",
                conversation_title: "Rozmowa z nauczycielami",
                conversation_subtitle: "Odpowiemy na wszystkie pytania",

                // Join Us Section
                join_us_text: "Dołącz do naszej społeczności już dziś!",
                join_us_description: "Pierwszy krok jest prosty — skontaktuj się z nami. Z przyjemnością odpowiemy na Twoje pytania i pokażemy, jak wygląda dzień w naszym przedszkolu.",
                join_us_availability: "Nie czekaj — miejsca szybko się kończą!",
                join_us_cta: "ZADZWOŃ, NAPISZ LUB ZOSTAW KONTAKT – JESTEŚMY TU DLA CIEBIE!",
                
                // Buttons
                contact_us: "Zostaw kontakt, zadzwonimy!",
                book_workshop: "Zadzwoń, aby umówić warsztat",
                contact_workshop: "Zostaw kontakt, aby umówić warsztat",
                leave_contact: "Zostaw kontakt",
                
                // Contact Section
                contact_title: "Kontakt",
                contact_badge: "Skontaktuj się z nami",
                contact_subtitle: "Gotowi na rozmowę? Skontaktuj się z nami już dziś!",
                contact_form_title: "Zostaw wiadomość",
                contact_email_label: "Email",
                contact_email_value: "kontakt@itsybitsy.pl",
                contact_phone_label: "Telefon",
                contact_phone_value: "+48 732 980 676",
                contact_address_label: "Adres",
                contact_address_value: "ul. Cybernetyki 7D, Warszawa(os. Mozaika Mokotów)",
                contact_social_label: "Social Media",
                contact_instagram: "Instagram",
                contact_facebook: "Facebook",
                contact_map_title: "Znajdź nas na mapie",
                
                // Form fields
                form_name: "Imię i nazwisko",
                form_email: "Email",
                form_phone: "Telefon",
                form_message: "Wiadomość",
                form_submit: "Wyślij wiadomość",
                
                // Form placeholders
                form_name_placeholder: "Wprowadź swoje imię i nazwisko",
                form_email_placeholder: "Wprowadź swój adres email",
                form_phone_placeholder: "Wprowadź swój numer telefonu (opcjonalnie)",
                form_message_placeholder: "Opisz w czym możemy Ci pomóc...",
                
                // Form validation
                error_name: "Imię musi mieć co najmniej 2 znaki",
                error_email: "Proszę wprowadzić prawidłowy adres email",
                error_message: "Wiadomość musi mieć co najmniej 10 znaków",
                form_validation_error: "Proszę poprawić błędy w formularzu.",
                form_sending: "Wysyłanie...",
                form_success: "Dziękujemy! Twoja wiadomość została wysłana pomyślnie.",
                form_error: "Przepraszamy, wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie.",
                
                // Google Maps review link
                view_on_google: "Zobacz w Google"
            },
            
            en: {
                // Navigation
                nav_home: "Home",
                nav_about: "About Us",
                nav_services: "Our Uniqueness",
                nav_testimonials: "Reviews",
                nav_contact: "Contact",
                
                // Page metadata
                page_title: "ItsyBitsy - Montessori Preschool",
                meta_description: "International bilingual Montessori preschool in Warsaw. English immersion all day, every day.",
                
                // Hero Section
                hero_badge: "Montessori Preschool",
                hero_title: "International Bilingual Montessori Preschool English immersion – all day, every day.",
                hero_subtitle: "Experience the power of Montessori education in a nurturing, bilingual environment where your child grows with confidence, curiosity, and joy.",
                schedule_meeting: "Schedule a meeting",
                learn_more: "Learn more",
                
                // Hero Stats
                hero_stat_experience: "Years of experience",
                hero_stat_children: "Happy children",
                hero_stat_bilingual: "Bilingualism",

                // About Section
                about_title: "Only the best for your child!",
                about_badge: "Our mission",
                about_subtitle: "Get to know our philosophy",
                bilingual_title: "Bilingualism",
                no_pressure_title: "No pressure",
                about_text_1: "ItsyBitsy is an international bilingual preschool operating according to the Montessori method.",
                about_text_2: "We create an environment where children develop naturally, learning through play and exploration.",
                about_text_3: "Our preschool is a place where every child can discover the world at their own pace, building confidence and independence.",

                // Services Section
                services_title: "Our uniqueness",
                uniqueness_badge: "Our uniqueness",
                uniqueness_title: "What Makes Us Unique",
                uniqueness_subtitle: "Discover the three core pillars of our educational approach that set us apart.",
                services_subtitle: "What we offer your children",

                service_1_title: "Montessori Curriculum for Children Aged 3–6",
                service_1_description: "A full, authentic Montessori academic curriculum designed to support your child's natural development, independence, and love of learning during the most formative years.",

                service_2_title: "Bilingual Environment",
                service_2_description: "Daily English immersion with educational program delivered in both Polish and English – supporting true bilingual development in a natural and engaging way.",

                service_3_title: "English the Natural Way",
                service_3_description: "All-day interaction with native speakers supports confident, fluent language use from an early age.",

                service_4_title: "Mindful and Respectful Education",
                service_4_description: "Learning without pressure, guided by attentiveness and genuine respect for the child.",

                // Only the Best Section
                only_best_title: "Only the best for your child!",
                only_best_point_1: "A full, authentic Montessori academic curriculum designed to support your child's natural development, independence, and love of learning during the most formative years.",
                only_best_point_2: "Daily English immersion with educational program delivered in both Polish and English – supporting true bilingual development in a natural and engaging way.",
                only_best_point_3: "All-day interaction with native speakers supports confident, fluent language use from an early age.",
                only_best_point_4: "Learning without pressure, guided by attentiveness and genuine respect for the child.",
                
                // Grid Section
                call_us: "Call",
                send_email: "Send email",
                leave_contact_yourself: "Let's Talk! Share your contact – we'll call you at your convenience.",
                get_to_know_us: "Get to know us better",
                grid_education_title: "Education Rooted in Understanding the Child",
                grid_education_text: "We offer a full Montessori program that nurtures children's cognitive, emotional, and social development. Our classrooms are equipped with authentic Montessori materials, and our highly trained teachers support each child's individual growth every day — with patience, mindfulness, and deep respect.",
                grid_authentic_title: "Authentic Bilingualism",
                grid_authentic_text: "English all day – naturally and without pressure. Children thrive in a truly bilingual environment, where both Polish and English are part of everyday life. Native English-speaking teachers are present all day, so the language is acquired organically through relationships, play, and daily routines. It's full immersion, not formal lessons.",
                grid_relationships_title: "Relational Approach and Emotional Closeness",
                grid_relationships_text: "Safe, trusting relationships are the foundation of a child's development. At the heart of our work are meaningful connections – with the child, the parent, and within our team. We create a space where every child feels seen, heard, and valued. From the adaptation process to daily routines and conflict resolution, everything is rooted in empathy, mindfulness, and Nonviolent Communication (NVC).",
                
                // Testimonials Section
                testimonials_title: "Parent Reviews",
                testimonials_badge: "What parents say",
                testimonials_subtitle: "For over 10 years, we've guided hundreds of happy, confident children—well prepared for both school and life!",
                
                testimonial_1_name: "Mrs. Joanna:",
                testimonial_1_text: "My son has been attending ItsyBitsy for 2 years and I am delighted with his progress in learning English. The Montessori method allows him to develop naturally.",

                testimonial_2_name: "Mrs. Ilona:",
                testimonial_2_text: "My two children have been attending preschool for several years - I could always count on the best care and commitment - I know what I'm saying because I have comparison with other institutions.",
                testimonial_2_text_2: "What was important to me was that the Itsy Bitsy team is not there to respond to the parent's needs, but to the child's needs.",
                testimonial_2_text_3: "Cooperation with parents is always partnership-based, and the team is always available and open. My kids love going to Itsy Bitsy, I highly recommend it.",

                testimonial_3_name: "Mrs. Nadieżda:",
                testimonial_3_text: "I would like to emphasize our sincere gratitude to the teachers and director of ItsyBitsy for the kindness, professionalism, care and support.",
                testimonial_3_text_2: "I was particularly moved by the love and attention with which you treated our daughter. Your kindness and professionalism helped her not only overcome adaptation difficulties.",
                testimonial_3_text_3: "The Montessori system turned out to be a real discovery for us. We wholeheartedly recommend your preschool to all parents.",
                
                testimonial_1_text_2: "We could always count on the best care, lots of warmth and empathy - my daughter liked it so much that she finished preschool almost 2 years ago and still gladly returns there.",
                testimonial_1_text_3: "Itsy Bitsy excellently prepares children for school - not only substantively, but also emotionally. All this thanks to the staff - both teachers and Management. A huge plus is the family atmosphere and native speaker, which is very natural with caregivers from each group - thanks to this, children can learn English naturally. The effect? When finishing preschool, children not only understand, but can also communicate in this language.",
                testimonial_1_text_4: "If you are wondering whether this is the place for you - come and check - I'm sure the children will love this place.",
                
                testimonial_3_text_2: "I was particularly moved by the love and attention with which you treated our daughter. Your kindness and professionalism helped her not only overcome adaptation difficulties, but also make new friends, develop self-confidence and interest in learning.",
                testimonial_3_text_3: "The Montessori system that you use in your preschool turned out to be a real discovery for us. We see how thanks to your classes our daughter is becoming more and more independent, hardworking and prepared for school learning. This is an invaluable contribution to her future, for which we are sincerely grateful to you.",
                testimonial_3_text_4: "We wholeheartedly recommend your preschool to all parents who are looking for a warm, caring and caring environment for their children. You create an amazing atmosphere where every child feels special and loved.",
                testimonial_3_text_5: "We will always remain in our hearts. With love and great gratitude to beloved ItsyBitsy",
                
                // Why Us Section
                why_us_title: "Why Choose Us?",
                why_us_badge: "Why us",
                why_us_subtitle: "Because you want the very best for your child.",
                why_us_point_1: "Montessori Curriculum – Children learn at their own pace, developing essential skills and independence for life.",
                why_us_point_2: "Close, Respectful Relationships – We build strong connections based on trust, empathy, and respect.",
                why_us_point_3: "True Bilingualism Through Immersion – English is a natural part of every day, all day.",
                why_us_point_4: "Dedicated Team with Heart – Experienced, well-educated teachers who genuinely care about children—and love what they do.",
                why_us_point_5: "Native Speaker in Every Group – English is spoken consistently and naturally by native speakers.",
                why_us_point_6: "Peaceful, Beautiful Interiors – Calm, harmonious spaces with natural materials, light, and order that support focus and well-being.",
                
                // Visit Us Section
                visit_us_title: "Come Visit Us!",
                visit_us_badge: "Come visit us",
                visit_us_text: "Step into a day in the life of our preschool. You'll see calm, focused, and joyful children, nurturing relationships, peaceful spaces, and dedicated, present teachers. This is what education rooted in Montessori and emotional closeness truly looks like.",
                visit_us_question: "Wondering if this is the right place for your family?",
                visit_us_cta: "The best way to find out is to see it for yourself!",
                
                // Listen to Children Section
                listen_children_title: "Listen to the Children",
                children_perspective_badge: "Children's perspective",
                listen_children_subtitle: "Preschool, as seen from the most important perspective — about 116 cm off the ground.",
                listen_children_text_1: "What truly matters in early childhood education is best reflected in a child's eyes. In the joy of discovery.",
                listen_children_text_2: "In the confidence they show when choosing materials on their own.",
                listen_children_text_3: "In the ease with which they greet their teacher each morning. Children instinctively know what makes them feel safe, what brings them joy, and where they truly belong.",
                listen_children_text_4: "In our environment, nothing is accidental — every space, material, routine, and relationship is thoughtfully designed to support their natural development.",
                listen_children_text_5: "And children sense that.",
                listen_children_highlight: "This isn't just a preschool. It's their place of strength.",
                
                // Let's Meet Section
                lets_meet_title: "Let's Get to Know Each Other",
                lets_meet_subtitle: "Join us for a free workshop — a gentle introduction to our preschool world.",
                
                // Workshop Section
                free_badge: "Free",
                welcome_badge: "Welcome",
                workshop_title: "Free workshop for your child",
                workshop_subtitle: "Experience our methods in action.",
                coffee_title: "Coffee for parents",
                coffee_subtitle: "Enjoy a moment to relax while your child explores.",
                conversation_title: "Meet our teachers",
                conversation_subtitle: "Ask questions, share your thoughts, and get to know us.",

                // Join Us Section
                join_us_text: "Join our community today!",
                join_us_description: "The first step is simple - contact us. We will be happy to answer your questions and show you what a day at our preschool looks like.",
                join_us_availability: "Don't wait - places fill up quickly!",
                join_us_cta: "CALL, WRITE OR LEAVE CONTACT - WE ARE HERE FOR YOU!",
                
                // Buttons
                contact_us: "Leave contact, we'll call!",
                book_workshop: "Call to book workshop",
                contact_workshop: "Book a free workshop for your child — and enjoy a peaceful coffee while we take care of the rest!",
                leave_contact: "Leave contact",
                
                // Contact Section
                contact_title: "Contact",
                contact_badge: "Get in touch with us",
                contact_subtitle: "Ready to talk? Contact us today!",
                contact_form_title: "Leave a message",
                contact_email_label: "Email",
                contact_email_value: "kontakt@itsybitsy.pl",
                contact_phone_label: "Phone",
                contact_phone_value: "+48 732 980 676",
                contact_address_label: "Address",
                contact_address_value: "ul. Cybernetyki 7D, Warszawa (os. Mozaika Mokotów)",
                contact_social_label: "Social Media",
                contact_instagram: "Instagram",
                contact_facebook: "Facebook",
                contact_map_title: "Find us on the map",
                
                // Form fields
                form_name: "Full name",
                form_email: "Email",
                form_phone: "Phone",
                form_message: "Message",
                form_submit: "Send message",
                
                // Form placeholders
                form_name_placeholder: "Enter your name and surname",
                form_email_placeholder: "Enter your email address",
                form_phone_placeholder: "Enter your phone number (optional)",
                form_message_placeholder: "Describe how we can help you...",
                
                // Form validation
                error_name: "Name must be at least 2 characters long",
                error_email: "Please enter a valid email address",
                error_message: "Message must be at least 10 characters long",
                form_validation_error: "Please correct the errors in the form.",
                form_sending: "Sending...",
                form_success: "Thank you! Your message has been sent successfully.",
                form_error: "Sorry, there was an error sending your message. Please try again.",
                
                // Google Maps review link
                view_on_google: "View on Google"
            }
        };
        
        window.translations = this.translations;
    }

    setupLanguageButtons() {
        // This is now handled by the main.js LandingPageManager
        // Keep this method for compatibility
    }

    switchLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`Language '${language}' not supported`);
            return;
        }

        this.currentLanguage = language;
        this.updatePageContent();
        this.updateDocumentAttributes();
        this.storeLanguage(language);
        
        const event = new CustomEvent('languageChanged', {
            detail: { language }
        });
        document.dispatchEvent(event);
    }

    updatePageContent() {
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else if (element.tagName === 'TITLE') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        document.title = this.getTranslation('page_title') || 'ItsyBitsy - Przedszkole Montessori';
    }

    updateDocumentAttributes() {
        document.documentElement.setAttribute('lang', this.currentLanguage);
        document.documentElement.setAttribute('dir', 'ltr');
    }

    getTranslation(key) {
        if (this.translations[this.currentLanguage] && this.translations[this.currentLanguage][key]) {
            return this.translations[this.currentLanguage][key];
        }
        
        if (this.translations[this.defaultLanguage] && this.translations[this.defaultLanguage][key]) {
            return this.translations[this.defaultLanguage][key];
        }
        
        return key;
    }

    storeLanguage(language) {
        try {
            localStorage.setItem('preferredLanguage', language);
        } catch (error) {
            document.cookie = `preferredLanguage=${language}; path=/; max-age=31536000`;
        }
    }

    getStoredLanguage() {
        try {
            return localStorage.getItem('preferredLanguage');
        } catch (error) {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'preferredLanguage') {
                    return value;
                }
            }
            return null;
        }
    }

    setInitialLanguage() {
        const storedLanguage = this.getStoredLanguage();
        if (storedLanguage && this.translations[storedLanguage]) {
            this.switchLanguage(storedLanguage);
            return;
        }

        const browserLanguage = navigator.language || navigator.userLanguage;
        const languageCode = browserLanguage.split('-')[0];
        
        if (this.translations[languageCode]) {
            this.switchLanguage(languageCode);
            return;
        }

        this.switchLanguage(this.defaultLanguage);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Make TranslationManager available globally
window.TranslationManager = TranslationManager;

window.switchLanguage = function(language) {
    if (window.translationManager) {
        window.translationManager.switchLanguage(language);
    }
};

// Initialize immediately
window.translationManager = new TranslationManager();

document.addEventListener('DOMContentLoaded', () => {
    // Ensure it's initialized
    if (!window.translationManager) {
        window.translationManager = new TranslationManager();
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationManager;
}