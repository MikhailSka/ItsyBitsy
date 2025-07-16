/**
 * Translations Manager - ItsyBitsy Montessori Preschool
 * Polish and English translations based on Canva design
 * File path: assets/js/translations.js
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
                hero_title: "Międzynarodowe przedszkole dwujęzyczne Montessori. Zanurzenie w angielskim, przez cały dzień, codziennie.",
                schedule_meeting: "Umów spotkanie",
                
                // Only the Best Section
                only_best_title: "Tylko to, co najlepsze dla Twojego dziecka!",
                only_best_point_1: "Pełen program akademicki Montessori dla dzieci 3-6 lat.",
                only_best_point_2: "Dwujęzyczność - codzienne zanurzenie w języku angielskim, program edukacyjny po polsku i angielsku.",
                only_best_point_3: "Native speaker przez cały dzień.",
                only_best_point_4: "Bez presji, z uważnością i szacunkiem.",
                
                // Grid Section
                call_us: "Zadzwoń",
                send_email: "Wyślij mail",
                leave_contact_yourself: "Zostaw kontakt do siebie",
                get_to_know_us: "Poznaj nas bliżej",
                grid_education_title: "Edukacja oparta na wiedzy i zrozumieniu dziecka",
                grid_education_text: "Realizujemy pełny program Montessori, wspierający rozwój poznawczy, emocjonalny i społeczny dzieci. Nasze klasy są wyposażone w oryginalne materiały Montessori, a wszechstronnie wykształceni nauczyciele codziennie towarzyszą dzieciom w ich indywidualnym rozwoju – bez pośpiechu, z uważnością i szacunkiem.",
                grid_authentic_title: "Autentyczna dwujęzyczność",
                grid_authentic_text: "Angielski przez cały dzień – naturalnie i bez presji. Dzieci codziennie funkcjonują w środowisku dwujęzycznym – polskiego i angielskiego. Nasi anglojęzyczni nauczyciele są obecni w grupie przez cały dzień, dzięki czemu język angielski przyswajany jest w sposób naturalny, poprzez relacje, zabawę i codzienne sytuacje. To zanurzenie, a nie lekcje.",
                grid_relationships_title: "Podejście relacyjne i bliskościowe",
                grid_relationships_text: "Bezpieczne relacje są fundamentem rozwoju. W centrum naszej pracy są relacje – z dzieckiem, z rodzicem, w zespole. Tworzymy przestrzeń, w której każde dziecko czuje się widziane, słyszane i ważne. Adaptacja, codzienne rytuały, rozwiązywanie konfliktów – wszystko opieramy na empatii, uważności i komunikacji bez przemocy (NVC).",
                
                // Testimonials Section
                testimonials_title: "Prawdziwi ludzie, prawdziwe doświadczenia!",
                testimonials_subtitle: "Przez ponad 10 lat wypuściliśmy w świat setki szczęśliwych i świetnie przygotowanych do życia i do szkoły przedszkolaków!",
                
                testimonial_1_name: "pani Joanna:",
                testimonial_1_text: "Przygoda z przedszkolem Itsy Bitsy trwa już kilka lat - najpierw uczęszczała tam córka, a teraz żerówka kończy syn. I gdybym stała ponownie przed wyborem placówki to podjęłabym taką samą decyzję. Itsy Bitsy to najlepsze miejsce, do którego mogły trafić moje dzieci.",
                testimonial_1_text_2: "Zawsze mogliśmy liczyć na najlepszą opiekę, dużo ciepła i empatii - córka na tyle tego, że skończyła przedszkole prawie 2 lata temu chętnie tam wraca.",
                testimonial_1_text_3: "Itsy Bitsy świetnie przygotowuje dzieci do szkoły - nie tylko pod kątem merytorycznym, ale również emocjonalnym. Wszystko to za sprawą kadry - zarówno nauczycieli jak i Dyrekcji. Ogromnym plusem jest rodzinna atmosfera oraz native speaker, który jest bardzo naturalny z opiekunów każdej z grup - dzięki temu dzieci w naturalny sposób mogą uczyć się angielskiego. Efekt? Kończąc przedszkole dzieci nie tylko rozumieją, ale również potrafią się komunikować w tym języku.",
                testimonial_1_text_4: "Jeśli zastanawiacie się, czy to miejsce dla Was - przyjdźcie i sprawdźcie - jestem pewna, że dzieci pokochają to miejsce.",
                
                testimonial_2_name: "pani Ilona:",
                testimonial_2_text: "Do przedszkola od kilku lat chodzą dwójka moich dzieci - zawsze mogłam liczyć na najlepszą opiekę i zaangażowanie - wiem, co mówię bo mam porównanie z innymi placówkami. To co było dla mnie ważne, to to, że zespół Itsy Bitsy nie jest po to, żeby odpowiadać na potrzeby rodzica, tylko na potrzeby dziecka. Współpraca z rodzicem jest zawsze partnerska, a zespół - zawsze dostępny i otwarty. Moje dzieciaki kochają chodzić do Itsy Bitsy, gorąco polecam",
                
                testimonial_3_name: "pani Nadieżda:",
                testimonial_3_text: "Chciałabym podkreślić naszą szczerą wdzięczność nauczycielom i dyrektorowi ItsyBitsy za życzliwość, profesjonalizm, opiekę i wsparcie, jakie zapewniliście naszej rodzinie w okresie adaptacyjnym. Przyjechaliśmy z innego kraju i doświadczyliśmy strasznego stresu i niepokoju, bariery językowej i niepewności we wszystkim, ale dzięki Wam i Waszej opiece nasza adaptacja była tak łatwa i komfortowa, jak to tylko możliwe. Nasza córka szybko się zaaklimatyzowała i poczuła się bezpiecznie.",
                testimonial_3_text_2: "Szczególnie poruszyła mnie miłość i uwaga, z jaką traktowaliście naszą córkę. Wasza życzliwość i profesjonalizm pomagały jej nie tylko pokonać trudności adaptacyjne, ale także nawiązać nowe przyjaźnie, rozwijać pewność siebie i zainteresowanie nauką.",
                testimonial_3_text_3: "System Montessori, z którego korzystacie w swoim przedszkolu, okazał się dla nas prawdziwym odkryciem. Widzimy, jak dzięki Waszym zajęciom nasza córka staje się coraz bardziej samodzielna, pracowita i przygotowana do nauki w szkole. To nieoceniony wkład w jej przyszłość, za co jesteśmy Państwu szczerze wdzięczni.",
                testimonial_3_text_4: "Z pełnym przekonaniem polecamy Państwa przedszkole wszystkim rodzicom, którzy szukają ciepłego, troskliwego i opiekuńczego środowiska dla swoich dzieci. Tworzycie niesamowitą atmosferę, w której każde dziecko czuje się wyjątkowo i kochane.",
                testimonial_3_text_5: "Na zawsze pozostaniemy w naszych sercach. Z miłością i wielką wdzięcznością ukochanej ItsyBitsy",
                
                // Why Us Section
                why_us_title: "Dlaczego właśnie my?",
                why_us_subtitle: "Bo chcesz tylko tego, co najlepsze dla swojego dziecka!",
                why_us_point_1: "Pełen program akademicki Montessori– dzieci uczą się we własnym tempie, rozwijają kluczowe kompetencje przyszłości.",
                why_us_point_2: "Bliskość – budujemy relacje oparte na szacunku i i zaufaniu.",
                why_us_point_3: "Dwujęzyczność przez immersję – język angielski naturalnie towarzyszy dzieciom każdego dnia, przez cały dzień.",
                why_us_point_4: "Zespół z misją i sercem– doświadczona, stała i świetnie wykształcona kadra, która naprawdę lubi dzieci i swoją pracę",
                why_us_point_5: "Nauczyciel-native speaker w każdej grupie, komunikujący się wyłącznie po angielsku.",
                why_us_point_6: "Piękne, spokojne wnętrza – naturalne materiały, światło, harmonia i czystość.",
                
                // Visit Us Section
                visit_us_title: "Zajrzuj do nas!",
                visit_us_text: "Zobacz, jak wygląda dzień w naszym przedszkolu. Nasza codzienność to zadowolone, bezpieczne, skupione dzieci, ciepłe relacje, spokojna przestrzeń i zaangażowani nauczyciele. Tak właśnie wygląda u nas edukacja w duchu Montessori i bliskości.",
                visit_us_question: "Chcesz wiedzieć, czy to miejsce dla Was?",
                visit_us_cta: "Najlepiej zobaczyć wszystko na własne oczy!",
                
                // Listen to Children Section
                listen_children_title: "Posłuchaj dzieci!",
                listen_children_subtitle: "PRZEDSZKOLE WIDZIANE Z NAJWAŻNIEJSZEJ PERSPEKTYWY, Z POZIOMU OKOŁO 116CM !",
                listen_children_text_1: "TO, CO NAPRAWDĘ LICZY SIĘ W PRZEDSZKOLU, NAJLEPIEJ WIDAĆ W SPOJRZENIU DZIECKA.",
                listen_children_text_2: "W RADOŚCI ODKRYWANIA, W PEWNOŚCI SIEBIE, GDY SAMO SIĘGA PO MATERIAŁY, W SWOBODZIE, Z JAKĄ WITA NAUCZYCIELA.",
                listen_children_text_3: "TO DZIECI WIEDZĄ NAJLEPIEJ, CO DAJE IM POCZUCIE BEZPIECZEŃSTWA, CO LUBIĄ NAJBARDZIEJ, GDZIE CZUJĄ SIĘ JAK U SIEBIE.",
                listen_children_text_4: "W TEJ PRZESTRZENI NIE MA PRZYPADKÓW – KAŻDE MIEJSCE, MATERIAŁ, RYTUAŁ I RELACJA WSPIERA ICH NATURALNY ROZWÓJ.",
                listen_children_text_5: "A DZIECI TO CZUJĄ.",
                listen_children_highlight: "TO NIE TYLKO PRZEDSZKOLE. TO ICH MIEJSCE MOCY.",
                
                // Let's Meet Section
                lets_meet_title: "Poznajmy się.",
                lets_meet_subtitle: "Umów dziecko na bezpłatny warsztat i zrelaksuj się przy kawie!",
                
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
                
                // Form validation
                error_name: "Imię musi mieć co najmniej 2 znaki",
                error_email: "Proszę wprowadzić prawidłowy adres email",
                error_message: "Wiadomość musi mieć co najmniej 10 znaków",
                form_validation_error: "Proszę poprawić błędy w formularzu.",
                form_sending: "Wysyłanie...",
                form_success: "Dziękujemy! Twoja wiadomość została wysłana pomyślnie.",
                form_error: "Przepraszamy, wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie."
            },
            
            en: {
                // Navigation
                nav_home: "Home",
                nav_about: "About Us",
                nav_services: "Our Uniqueness",
                nav_testimonials: "Testimonials",
                nav_contact: "Contact",
                
                // Page metadata
                page_title: "ItsyBitsy - Montessori Preschool",
                meta_description: "International bilingual Montessori preschool in Warsaw. English immersion all day, every day.",
                
                // Hero Section
                hero_title: "International bilingual Montessori preschool. Immersion in English, all day, every day.",
                schedule_meeting: "Schedule meeting",
                
                // Only the Best Section
                only_best_title: "Only the best for your child!",
                only_best_point_1: "Full Montessori academic program for children 3-6 years old.",
                only_best_point_2: "Bilingualism - daily immersion in English, educational program in Polish and English.",
                only_best_point_3: "Native speaker all day long.",
                only_best_point_4: "No pressure, with mindfulness and respect.",
                
                // Grid Section
                call_us: "Call",
                send_email: "Send email",
                leave_contact_yourself: "Leave your contact",
                get_to_know_us: "Get to know us better",
                grid_education_title: "Education based on knowledge and understanding of the child",
                grid_education_text: "We implement a full Montessori program supporting children's cognitive, emotional and social development. Our classrooms are equipped with original Montessori materials, and comprehensively educated teachers accompany children in their individual development every day - without haste, with attention and respect.",
                grid_authentic_title: "Authentic bilingualism",
                grid_authentic_text: "English all day - naturally and without pressure. Children function daily in a bilingual environment - Polish and English. Our English-speaking teachers are present in the group all day, so English is acquired naturally, through relationships, play and everyday situations. It's immersion, not lessons.",
                grid_relationships_title: "Relational approach and closeness",
                grid_relationships_text: "Safe relationships are the foundation of development. At the center of our work are relationships - with the child, with the parent, in the team. We create a space where every child feels seen, heard and important. Adaptation, daily rituals, conflict resolution - we base everything on empathy, mindfulness and non-violent communication (NVC).",
                
                // Testimonials Section
                testimonials_title: "Real people, real experiences!",
                testimonials_subtitle: "For over 10 years, we have sent hundreds of happy preschoolers into the world, excellently prepared for life and school!",
                
                testimonial_1_name: "Mrs. Joanna:",
                testimonial_1_text: "The adventure with Itsy Bitsy preschool has been going on for several years - first my daughter attended there, and now my son is finishing nursery. If I had to choose an institution again, I would make the same decision. Itsy Bitsy is the best place my children could have ended up.",
                testimonial_1_text_2: "We could always count on the best care, lots of warmth and empathy - my daughter liked it so much that she finished preschool almost 2 years ago and still gladly returns there.",
                testimonial_1_text_3: "Itsy Bitsy excellently prepares children for school - not only substantively, but also emotionally. All this thanks to the staff - both teachers and Management. A huge plus is the family atmosphere and native speaker, which is very natural with caregivers from each group - thanks to this, children can learn English naturally. The effect? When finishing preschool, children not only understand, but can also communicate in this language.",
                testimonial_1_text_4: "If you are wondering whether this is the place for you - come and check - I'm sure the children will love this place.",
                
                testimonial_2_name: "Mrs. Ilona:",
                testimonial_2_text: "Two of my children have been going to preschool for several years - I could always count on the best care and commitment - I know what I'm talking about because I have a comparison with other institutions. What was important to me was that the Itsy Bitsy team is not there to respond to the needs of the parent, but to the needs of the child. Cooperation with the parent is always partnership, and the team is always available and open. My children love going to Itsy Bitsy, I highly recommend it",
                
                testimonial_3_name: "Mrs. Nadiezhda:",
                testimonial_3_text: "I would like to emphasize our sincere gratitude to the teachers and director of ItsyBitsy for the kindness, professionalism, care and support you provided to our family during the adaptation period. We came from another country and experienced terrible stress and anxiety, language barriers and uncertainty in everything, but thanks to you and your care, our adaptation was as easy and comfortable as possible. Our daughter quickly acclimatized and felt safe.",
                testimonial_3_text_2: "I was particularly moved by the love and attention with which you treated our daughter. Your kindness and professionalism helped her not only overcome adaptation difficulties, but also make new friends, develop self-confidence and interest in learning.",
                testimonial_3_text_3: "The Montessori system that you use in your preschool turned out to be a real discovery for us. We see how thanks to your classes our daughter is becoming more and more independent, hardworking and prepared for school learning. This is an invaluable contribution to her future, for which we are sincerely grateful to you.",
                testimonial_3_text_4: "We wholeheartedly recommend your preschool to all parents who are looking for a warm, caring and caring environment for their children. You create an amazing atmosphere where every child feels special and loved.",
                testimonial_3_text_5: "We will always remain in our hearts. With love and great gratitude to beloved ItsyBitsy",
                
                // Why Us Section
                why_us_title: "Why us?",
                why_us_subtitle: "Because you want only the best for your child!",
                why_us_point_1: "Full Montessori academic program - children learn at their own pace, developing key competencies for the future.",
                why_us_point_2: "Closeness - we build relationships based on respect and trust.",
                why_us_point_3: "Bilingualism through immersion - English naturally accompanies children every day, all day long.",
                why_us_point_4: "A team with a mission and heart - experienced, permanent and well-educated staff who really like children and their work",
                why_us_point_5: "Native speaker teacher in every group, communicating exclusively in English.",
                why_us_point_6: "Beautiful, peaceful interiors - natural materials, light, harmony and cleanliness.",
                
                // Visit Us Section
                visit_us_title: "Come visit us!",
                visit_us_text: "See what a day at our preschool looks like. Our daily life consists of satisfied, safe, focused children, warm relationships, peaceful space and engaged teachers. This is exactly what education in the spirit of Montessori and closeness looks like.",
                visit_us_question: "Do you want to know if this is the place for you?",
                visit_us_cta: "It's best to see everything with your own eyes!",
                
                // Listen to Children Section
                listen_children_title: "Listen to the children!",
                listen_children_subtitle: "PRESCHOOL SEEN FROM THE MOST IMPORTANT PERSPECTIVE, FROM ABOUT 116CM HIGH!",
                listen_children_text_1: "WHAT REALLY MATTERS IN PRESCHOOL IS BEST SEEN IN A CHILD'S EYES.",
                listen_children_text_2: "IN THE JOY OF DISCOVERY, IN SELF-CONFIDENCE WHEN THEY REACH FOR MATERIALS THEMSELVES, IN THE FREEDOM WITH WHICH THEY GREET THE TEACHER.",
                listen_children_text_3: "CHILDREN KNOW BEST WHAT GIVES THEM A SENSE OF SECURITY, WHAT THEY LIKE MOST, WHERE THEY FEEL AT HOME.",
                listen_children_text_4: "IN THIS SPACE THERE ARE NO ACCIDENTS - EVERY PLACE, MATERIAL, RITUAL AND RELATIONSHIP SUPPORTS THEIR NATURAL DEVELOPMENT.",
                listen_children_text_5: "AND CHILDREN FEEL IT.",
                listen_children_highlight: "IT'S NOT JUST A PRESCHOOL. IT'S THEIR PLACE OF POWER.",
                
                // Let's Meet Section
                lets_meet_title: "Let's meet.",
                lets_meet_subtitle: "Book your child for a free workshop and relax with coffee!",
                
                // Join Us Section
                join_us_text: "Join our community today!",
                join_us_description: "The first step is simple - contact us. We will be happy to answer your questions and show you what a day at our preschool looks like.",
                join_us_availability: "Don't wait - places fill up quickly!",
                join_us_cta: "CALL, WRITE OR LEAVE CONTACT - WE ARE HERE FOR YOU!",
                
                // Buttons
                contact_us: "Leave contact, we'll call!",
                book_workshop: "Call to book workshop",
                contact_workshop: "Leave contact to book workshop",
                leave_contact: "Leave contact",
                
                // Form validation
                error_name: "Name must be at least 2 characters long",
                error_email: "Please enter a valid email address",
                error_message: "Message must be at least 10 characters long",
                form_validation_error: "Please correct the errors in the form.",
                form_sending: "Sending...",
                form_success: "Thank you! Your message has been sent successfully.",
                form_error: "Sorry, there was an error sending your message. Please try again."
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

window.switchLanguage = function(language) {
    if (window.translationManager) {
        window.translationManager.switchLanguage(language);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.translationManager = new TranslationManager();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationManager;
}