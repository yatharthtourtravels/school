/* ===================================================
   YATHARTH TOUR AND TRAVELS — MAIN JAVASCRIPT
   Firebase Firestore + WhatsApp + i18n (EN/HI/Hinglish)
   =================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* =================================================
     SECTION 1: MOBILE HAMBURGER MENU
     ================================================= */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');

  function closeMenu() {
    navLinks.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }

  hamburgerBtn.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    hamburgerBtn.classList.toggle('open', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close mobile menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close mobile menu if user clicks outside it
  document.addEventListener('click', function (e) {
    const clickedInsideNav = navLinks.contains(e.target) || hamburgerBtn.contains(e.target);
    if (!clickedInsideNav && navLinks.classList.contains('open')) {
      closeMenu();
    }
  });


  /* =================================================
     SECTION 2: ACTIVE NAV LINK HIGHLIGHT ON SCROLL
     ================================================= */
  const sections = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  function setActiveLink(id) {
    navAnchors.forEach(function (a) {
      a.classList.toggle('active-link', a.getAttribute('href') === '#' + id);
    });
  }

  const sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(function (sec) { sectionObserver.observe(sec); });


  /* =================================================
     SECTION 3: SCROLL REVEAL ANIMATIONS
     ================================================= */
  const revealTargets = document.querySelectorAll(
    '.feature-card, .pricing-card, .facility-card, .step-card, .destination-card, .document-card, .contact-card, .timeline-item, .video-feature'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  const revealObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(function (el) { revealObserver.observe(el); });


  /* =================================================
     SECTION 4: DESTINATION FILTER TABS
     ================================================= */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const destinationCards = document.querySelectorAll('.destination-card');

  function applyFilter(filterValue) {
    destinationCards.forEach(function (card) {
      const matches = filterValue === 'all' || card.getAttribute('data-category') === filterValue;
      card.classList.toggle('show', matches);
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  applyFilter('all');


  /* =================================================
     SECTION 5: DOCUMENT (PDF) LINK CHECK
     ================================================= */
  const docLinks = document.querySelectorAll('.doc-link');

  docLinks.forEach(function (link) {
    const url = link.getAttribute('href');
    fetch(url, { method: 'HEAD' })
      .then(function (res) {
        if (!res.ok) disableDocLink(link);
      })
      .catch(function () {
        // file:// ya network issue — link as-is chhod do
      });
  });

  function disableDocLink(link) {
    link.classList.add('disabled');
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', function (e) { e.preventDefault(); });
    const span = link.querySelector('span');
    if (span) span.textContent = 'Not Uploaded Yet';
  }


  /* =================================================
     SECTION 6: FORM VALIDATION + FIREBASE SAVE + WHATSAPP
     ================================================= */
  const form = document.getElementById('quoteForm');
  const successMsg = document.getElementById('formSuccessMsg');

  function showError(group) { group.classList.add('invalid'); }
  function clearError(group) { group.classList.remove('invalid'); }

  function validateField(input) {
    const group = input.closest('.form-group');
    if (!group) return true;

    let valid = true;

    // Required check
    if (input.hasAttribute('required') && !input.value.trim()) {
      valid = false;
    }

    // Phone: 10 digits
    if (input.type === 'tel' && input.value.trim()) {
      if (!/^[0-9]{10}$/.test(input.value.trim())) valid = false;
    }

    // Email (optional but if filled, must be valid)
    if (input.type === 'email' && input.value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) valid = false;
    }

    // Number fields must be >= min if defined
    if (input.type === 'number' && input.value.trim()) {
      const val = parseInt(input.value, 10);
      const min = input.getAttribute('min');
      if (min !== null && val < parseInt(min, 10)) valid = false;
    }

    valid ? clearError(group) : showError(group);
    return valid;
  }

  // Live validation on blur
  form.querySelectorAll('input, textarea, select').forEach(function (input) {
    input.addEventListener('blur', function () { validateField(input); });
    input.addEventListener('input', function () {
      const group = input.closest('.form-group');
      if (group && group.classList.contains('invalid')) validateField(input);
    });
  });

  // ---- SUBMIT HANDLER ----
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // 1) Validate all required + optional-but-filled fields
    let isFormValid = true;
    form.querySelectorAll('input[required], textarea[required]').forEach(function (input) {
      if (!validateField(input)) isFormValid = false;
    });

    const emailField = document.getElementById('emailAddress');
    if (emailField.value.trim() && !validateField(emailField)) isFormValid = false;

    if (!isFormValid) {
      successMsg.hidden = true;
      const firstInvalid = form.querySelector('.form-group.invalid input, .form-group.invalid select, .form-group.invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // 2) Collect data
    const data = {
      schoolName:        document.getElementById('schoolName').value.trim(),
      contactName:       document.getElementById('contactName').value.trim(),
      contactNumber:     document.getElementById('contactNumber').value.trim(),
      emailAddress:      document.getElementById('emailAddress').value.trim(),
      numStudents:       document.getElementById('numStudents').value.trim(),
      numTeachers:       document.getElementById('numTeachers').value.trim(),
      startLocation:     document.getElementById('startLocation').value.trim(),
      destination:       document.getElementById('destination').value.trim(),
      travelDate:        document.getElementById('travelDate').value.trim(),
      numDays:           document.getElementById('numDays').value.trim(),
      budgetPerStudent:  document.getElementById('budgetPerStudent').value.trim(),
      foodRequirement:   document.getElementById('foodRequirement').value,
      transportPref:     document.getElementById('transportPref').value,
      accommodationReq:  document.getElementById('accommodationReq').value,
      additionalReq:     document.getElementById('additionalReq').value.trim()
    };

    // 3) Disable button (prevent double submit)
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // 4) Save to Firestore
    let firestoreOK = false;
    try {
      if (typeof window.saveQuoteToFirestore === 'function') {
        await window.saveQuoteToFirestore(data);
        firestoreOK = true;
      } else {
        console.warn('⚠️ saveQuoteToFirestore not available — Firebase SDK load nahi hua?');
      }
    } catch (err) {
      console.error('❌ Firestore save failed:', err);
    }

    // 5) WhatsApp open (data loss protection — chahe Firestore fail ho, WhatsApp chalega)
    try {
      sendToWhatsApp(data);
    } catch (err) {
      console.error('❌ WhatsApp open failed:', err);
    }

    // 6) Success message + reset
    successMsg.hidden = false;
    form.reset();

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;

    // Agar Firestore fail ho gaya to console me warn chhodo
    if (!firestoreOK) {
      console.warn('⚠️ Lead was sent to WhatsApp but NOT saved to Firestore. Check firebase-backend.js & rules.');
    }

    setTimeout(function () { successMsg.hidden = true; }, 8000);
  });


  /* =================================================
     SECTION 7: WHATSAPP PRE-FILLED MESSAGE
     ================================================= */
  function sendToWhatsApp(data) {
    const whatsappNumber = '918894470900'; // Official WhatsApp number

    const message =
      'New School Tour Inquiry - Yatharth Tour and Travels\n\n' +
      'School Name: ' + data.schoolName + '\n' +
      'Contact Person: ' + data.contactName + '\n' +
      'Contact Number: ' + data.contactNumber + '\n' +
      (data.emailAddress ? 'Email: ' + data.emailAddress + '\n' : '') +
      'Number of Students: ' + data.numStudents + '\n' +
      'Number of Teachers/Staff: ' + data.numTeachers + '\n' +
      'Starting Location: ' + data.startLocation + '\n' +
      'Preferred Destination: ' + data.destination + '\n' +
      'Travel Date: ' + data.travelDate + '\n' +
      'Number of Days: ' + data.numDays + '\n' +
      'Approx. Budget Per Student: ' + data.budgetPerStudent + '\n' +
      'Food Requirement: ' + data.foodRequirement + '\n' +
      'Transport Preference: ' + data.transportPref + '\n' +
      'Accommodation Required: ' + data.accommodationReq + '\n' +
      (data.additionalReq ? 'Additional Requirements: ' + data.additionalReq + '\n' : '');

    const whatsappURL = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message);
    window.open(whatsappURL, '_blank');
  }


  /* =================================================
     SECTION 8: THREE-LANGUAGE SYSTEM (EN / HI / HINGLISH)
     ================================================= */
  const translations = {

    en: {
      nav_home: "Home", nav_school_tours: "School Tours", nav_packages: "Packages",
      nav_destinations: "Destinations", nav_facilities: "Facilities", nav_tour_diary: "Tour Diary",
      nav_custom_plan: "Custom Plan", nav_documents: "Documents", nav_contact: "Contact",
      nav_cta: "Request a Quote",

      hero_kicker: "SCHOOL TOURS • EDUCATIONAL TRAVEL • STUDENT EXPERIENCES",
      hero_title: "School Educational Tours in Himachal Pradesh",
      hero_tagline: "Every Journey Becomes a Lesson.",
      hero_text: "Yatharth Tour and Travels plans customized school educational tours across Himachal Pradesh and North India — with comfortable group travel, flexible itineraries, and budgets designed around your students. For us, every journey becomes a lesson when learning meets real-world exploration.",
      hero_btn1: "Plan Your School Tour", hero_btn2: "Explore Destinations", hero_btn3: "Get a Custom Quote",
      trust1: "Serving Schools Since 2022*", trust2: "Customized Itineraries",
      trust3: "Transparent Budgeting", trust4: "Comfortable Group Travel",
      trust_note: "*As stated by Yatharth Tour and Travels, operating since 2022.",

      offer_label: "SPECIAL SCHOOL GROUP OFFER", offer_title: "SAVE UP TO 60%*",
      offer_sub1: "More Students. Smarter Budgets. Better Experiences.",
      offer_sub2: "Plan an educational journey that fits your school's requirements and budget.",
      offer_btn: "Get Your School's Custom Offer",
      offer_disclaimer: "*Discounts and final pricing depend on group size, destination, travel dates, inclusions, and customization. Terms apply.",

      st_kicker: "WHAT WE ORGANIZE",
      st_title: "Educational Tours Designed for Curious Minds.",
      st_text: "Yatharth Tour and Travels organizes school educational tours, student group excursions, historical and cultural tours, nature and adventure trips, educational field visits, religious and cultural circuits, inter-state school tours, and fully customized school travel programs across Himachal Pradesh and beyond.",
      st_card1_title: "Educational Experiences", st_card1_text: "Explore history, culture, nature, and new places.",
      st_card2_title: "Comfortable Group Travel", st_card2_text: "Travel arrangements planned around school groups.",
      st_card3_title: "Flexible Itineraries", st_card3_text: "Choose destinations, duration, activities, and travel style.",
      st_card4_title: "Budget-Friendly Planning", st_card4_text: "Practical packages designed around student budgets.",

      about_kicker: "ABOUT US",
      about_title: "Travel Planning With Experience Since 2022.",
      about_text: "Yatharth Tour and Travels has been operating since 2022, helping schools and groups plan meaningful journeys across Himachal Pradesh and North India. Our school-tour approach focuses on practical budgets, customized itineraries, comfortable travel arrangements, and memorable educational experiences. For us, every journey becomes a lesson — combining structured learning with exploration, culture, and real-world exposure.",
      timeline1: "Started Operations", timeline2: "School & Group Travel", timeline3: "Customized Tour Planning",

      pkg_kicker: "PRICING", pkg_title: "Travel Plans for Every School Budget.",
      pkg_text: "Choose a starting plan or let us create a customized quotation for your school.",
      pkg_range: "₹2,000 – ₹20,000+ per student",
      pkg_note: "These are indicative prices. Final pricing depends on destination, group size, duration, travel dates, transport, accommodation, meals, activities, and inclusions.",
      pkg1_title: "Local Explorer", pkg1_price_label: "Starting from", per_student: "/student",
      pkg1_li1: "Local educational visits", pkg1_li2: "Nearby sightseeing",
      pkg1_li3: "One-day school excursions", pkg1_li4: "Short-distance group trips",
      pkg1_btn: "Choose Local Explorer",
      pkg2_title: "Budget Discovery",
      pkg2_li1: "Budget-friendly school tours", pkg2_li2: "Short-distance destinations", pkg2_li3: "Basic group travel plans",
      pkg2_btn: "Choose Budget Discovery",
      pkg3_title: "Educational Explorer", pkg_popular: "Popular",
      pkg3_li1: "Multi-day educational tours", pkg3_li2: "Intercity travel", pkg3_li3: "Historical and cultural sightseeing",
      pkg3_btn: "Get Educational Explorer Quote",
      pkg4_title: "Grand Journey",
      pkg4_li1: "Long-distance school tours", pkg4_li2: "Extended multi-day itineraries", pkg4_li3: "Comprehensive travel experiences",
      pkg4_btn: "Choose Grand Journey Plan",
      pkg_final_note: "Final quotation is prepared after understanding your school's requirements.",

      fac_kicker: "WHAT WE PROVIDE", fac_title: "Everything Planned for a Smoother School Journey.",
      fac1_title: "Travel & Transport",
      fac1_li1: "Comfortable group transportation", fac1_li2: "Route planning",
      fac1_li3: "Pickup and drop coordination as agreed", fac1_li4: "School-group travel coordination",
      fac2_title: "Food & Meals",
      fac2_li1: "Breakfast, lunch, and dinner options", fac2_li2: "Meal arrangements as selected in the package",
      fac2_li3: "Hygienic food arrangements through selected vendors/partners", fac2_li4: "Dietary requirements can be discussed in advance",
      fac3_title: "Itinerary Planning",
      fac3_li1: "Complete tour itinerary", fac3_li2: "Destination-wise schedule",
      fac3_li3: "Sightseeing coordination", fac3_li4: "School-friendly travel planning & time management",
      fac4_title: "Guide & Tour Support",
      fac4_li1: "Tour coordination", fac4_li2: "Local guide options where available",
      fac4_li3: "Destination information", fac4_li4: "Educational sightseeing assistance & group coordination",
      fac5_title: "Customization",
      fac5_li1: "Customized destinations", fac5_li2: "Customized duration & activities",
      fac5_li3: "Customized food options", fac5_li4: "Customized transport & budget",
      fac6_title: "Budget Planning",
      fac6_li1: "Transparent estimated budget", fac6_li2: "Student-wise cost calculation",
      fac6_li3: "Group-size-based pricing", fac6_li4: "Clear inclusions and exclusions before confirmation",
      fac_note: "Inclusions depend on the selected package and final quotation. Not every facility is included in every package.",

      cp_kicker: "CUSTOM PLANNING", cp_title: "Your School. Your Students. Your Perfect Itinerary.",
      cp_text: "Tell us what you need, and we'll help shape a tour around your school's interests, schedule, and budget.",
      cp1_title: "Share Your Requirements",
      cp1_li1: "Destination", cp1_li2: "Number of students & teachers",
      cp1_li3: "Travel dates & number of days", cp1_li4: "Budget per student",
      cp2_title: "Customize Your Experience",
      cp2_li1: "Transport & food", cp2_li2: "Accommodation", cp2_li3: "Activities & educational visits", cp2_li4: "Sightseeing",
      cp3_title: "Receive Your Plan & Budget",
      cp3_li1: "Suggested itinerary", cp3_li2: "Estimated cost",
      cp3_li3: "Inclusions and exclusions", cp3_li4: "Customized quotation",
      cp_btn: "Build Your Custom School Tour",

      dest_kicker: "WHERE WE TAKE STUDENTS", dest_title: "Explore Destinations Across North India.",
      dest_text: "From Himachal's hills to heritage cities beyond — choose a region to explore suitable school-tour destinations.",
      filter_all: "All", filter_himachal: "Himachal Pradesh", filter_punjab: "Chandigarh & Punjab",
      filter_delhi_agra: "Delhi & Agra", filter_uttarakhand: "Uttarakhand", filter_up: "Uttar Pradesh",
      filter_rajasthan: "Rajasthan", filter_circuits: "Circuit Tours",

      dest_shimla: "Colonial heritage, mountain views, and nature-based learning near the state capital.",
      dest_manali: "Adventure activities, valleys, rivers, and cultural sightseeing.",
      dest_dharamshala: "Tibetan culture, monasteries, and scenic learning experiences.",
      dest_dalhousie: "Colonial towns, meadows, and heritage temple architecture.",
      dest_kinnaur: "Remote mountain villages and unique geography for advanced student groups.",
      dest_spiti: "High-altitude desert landscapes, monasteries, and geography field study.",
      dest_bir: "Tea gardens, nature trails, and peaceful valley experiences.",
      dest_renuka: "Lakes, religious sites, and short-distance excursions for day trips.",
      dest_chandigarh: "Rock Garden, Sukhna Lake, and museums for planned city excursions.",
      dest_amritsar: "Golden Temple, Jallianwala Bagh, and Partition Museum for historical learning.",
      dest_wagah: "Subject to current access and permissions at the time of travel.",
      dest_delhi: "India Gate, National Museum, National Science Centre, Qutub Minar & Humayun's Tomb.",
      dest_agra: "Taj Mahal, Agra Fort, and Mehtab Bagh — a classic history circuit.",
      dest_haridwar: "Ganga Aarti, spiritual sites, and river-side learning experiences.",
      dest_mussoorie: "Hill-station sightseeing combined with educational institution visits.",
      dest_vrindavan: "Cultural and spiritual circuit — as featured in our tour diary below.",
      dest_varanasi: "Ancient culture, Buddhist heritage, and riverfront history.",
      dest_ayodhya: "Cultural, historical, and spiritual destinations based on school requirements.",
      dest_jaipur: "Forts, palaces, and heritage architecture for a classic history tour.",
      dest_udaipur: "Lakes, forts, and desert landscapes across western Rajasthan.",
      dest_chittorgarh: "Fort history and wildlife exposure, subject to safari availability and rules.",
      circuit1: "Kullu–Manali Nature & Adventure Tour", circuit2: "Shimla–Kufri Educational Tour",
      circuit3: "Delhi–Agra Historical Tour", circuit4: "Chandigarh–Amritsar Heritage Tour",
      circuit5: "Haridwar–Rishikesh Educational Tour", circuit6: "Rajasthan Forts & History Tour",

      /* Unique destination CTA buttons */
      dest_btn_shimla: "Plan Shimla Kufri Tour",
      dest_btn_manali: "Plan Kullu Manali Tour",
      dest_btn_dharamshala: "Plan Dharamshala Tour",
      dest_btn_dalhousie: "Plan Dalhousie Khajjiar Tour",
      dest_btn_kinnaur: "Plan Kinnaur Sangla Tour",
      dest_btn_spiti: "Plan Spiti Valley Tour",
      dest_btn_bir: "Plan Bir Billing Tour",
      dest_btn_renuka: "Plan Renuka Ji Tour",
      dest_btn_chandigarh: "Plan Chandigarh City Tour",
      dest_btn_amritsar: "Plan Amritsar Heritage Tour",
      dest_btn_wagah: "Plan Wagah Border Tour",
      dest_btn_delhi: "Plan New Delhi Tour",
      dest_btn_agra: "Plan Agra Historical Tour",
      dest_btn_haridwar: "Plan Haridwar Rishikesh Tour",
      dest_btn_mussoorie: "Plan Dehradun Mussoorie Tour",
      dest_btn_vrindavan: "Plan Mathura Vrindavan Tour",
      dest_btn_varanasi: "Plan Varanasi Tour",
      dest_btn_ayodhya: "Plan Ayodhya Tour",
      dest_btn_jaipur: "Plan Jaipur Ajmer Tour",
      dest_btn_udaipur: "Plan Rajasthan Tour",
      dest_btn_chittorgarh: "Plan Chittorgarh Tour",
      dest_btn_circuit1: "Plan Kullu Manali Circuit",
      dest_btn_circuit2: "Plan Shimla Kufri Circuit",
      dest_btn_circuit3: "Plan Delhi Agra Circuit",
      dest_btn_circuit4: "Plan Chandigarh Amritsar Circuit",
      dest_btn_circuit5: "Plan Haridwar Rishikesh Circuit",
      dest_btn_circuit6: "Plan Rajasthan Circuit",

      dest_note: "Routes, access, weather, permissions, and availability may affect the final tour plan.",

      td_kicker: "REAL SCHOOL TOURS", td_title: "School Tour Diaries",
      td_subtitle: "Real journeys. Shared experiences. Memorable learning.",
      td_placeholder: "Video coming soon. YouTube embed will be added here.",
      td_video_title: "Vrindavan Educational Tour", td_video_dest: "Destination: Vrindavan",
      td_video_desc: "Take a glimpse into the Vrindavan educational tour of Government Senior Secondary School, Saunjali, and discover how travel can combine culture, learning, exploration, and memorable experiences.",
      td_btn: "Watch Tour Diary",

      doc_kicker: "TRUST & TRANSPARENCY", doc_title: "Company Documents & Credentials",
      doc_text: "View our available business documents, certificates, licenses, and other relevant credentials. Documents can be added or updated as required.",
      doc1_title: "Business Registration", doc1_text: "Company registration document.",
      doc2_title: "Travel Agency License / Authorization", doc2_text: "Business authorization document.",
      doc3_title: "Other Certificate / Credential", doc3_text: "Additional business credential.",
      doc_view: "View Company Certificate",
      doc_note: "Documents displayed on this page are provided by the company.",

      contact_kicker: "GET IN TOUCH", contact_title: "Let's Plan Your School's Next Journey.",
      contact_text: "Share your requirements and we'll help you explore suitable destinations, itineraries, and budget options.",

      contact_email_title: "Email for School Tour Enquiries",
      contact_email_btn: "Send Email Enquiry",

      contact_call_title_main: "Call Us – Main Line",
      contact_call_btn_main: "Call Main Line",

      contact_call_title_alt: "Call Us – Alternate Line",
      contact_call_btn_alt: "Call Alternate Line",

      contact_wa_title_main: "WhatsApp – Primary",
      contact_wa_btn_main: "Chat on WhatsApp – Primary",

      contact_wa_title_alt: "WhatsApp – Alternate",
      contact_wa_btn_alt: "Chat on WhatsApp – Alternate",

      form_title: "Request a Custom Quote", form_school: "School Name *",
      form_contact_person: "Principal / Teacher / Coordinator Name *", form_contact_number: "Contact Number *",
      form_email: "Email Address (optional)", form_students: "Number of Students *",
      form_teachers: "Number of Teachers / Staff *", form_start_location: "Starting Location *",
      form_destination: "Preferred Destination *", form_travel_date: "Travel Date *",
      form_days: "Number of Days *", form_budget: "Approximate Budget Per Student *",
      form_food: "Food Requirements", form_transport: "Transport Preference",
      form_accommodation: "Accommodation Required?", form_additional: "Additional Requirements",
      form_submit: "Request a Custom Quote",
      form_success: "Thank you! Your request has been prepared. Please send it via WhatsApp to complete your inquiry.",
      err_required: "This field is required.", err_phone: "Enter a valid 10-digit number.",
      err_email: "Enter a valid email address.",
      food_veg: "Vegetarian", food_nonveg: "Non-Vegetarian", food_both: "Both", food_discuss: "To be discussed",
      transport_bus: "Bus", transport_train: "Train", transport_mixed: "Mixed / Not sure",
      opt_yes: "Yes", opt_no: "No",

      footer_tagline: "Explore. Learn. Experience.", footer_since: "Serving since 2022",
      footer_contact_title: "Contact", footer_links_title: "Quick Links"
    },

    hi: {
      nav_home: "होम", nav_school_tours: "स्कूल टूर", nav_packages: "पैकेज",
      nav_destinations: "गंतव्य", nav_facilities: "सुविधाएं", nav_tour_diary: "टूर डायरी",
      nav_custom_plan: "कस्टम प्लान", nav_documents: "दस्तावेज़", nav_contact: "संपर्क करें",
      nav_cta: "कोटेशन मांगें",

      hero_kicker: "स्कूल टूर • शैक्षिक यात्रा • छात्र अनुभव",
      hero_title: "हिमाचल प्रदेश में स्कूल शैक्षिक टूर",
      hero_tagline: "हर यात्रा एक सीख बन जाती है।",
      hero_text: "यथार्थ टूर एंड ट्रैवल्स हिमाचल प्रदेश और उत्तर भारत में कस्टमाइज़्ड स्कूल शैक्षिक टूर की योजना बनाता है — आरामदायक समूह यात्रा, लचीली यात्रा योजना, और आपके छात्रों के अनुसार बजट के साथ। हमारे लिए हर यात्रा एक सीख बन जाती है जब पढ़ाई वास्तविक अनुभव से मिलती है।",
      hero_btn1: "अपना स्कूल टूर प्लान करें", hero_btn2: "गंतव्य देखें", hero_btn3: "कस्टम कोटेशन प्राप्त करें",
      trust1: "2022 से स्कूलों की सेवा में*", trust2: "कस्टमाइज़्ड यात्रा योजना",
      trust3: "पारदर्शी बजट", trust4: "आरामदायक समूह यात्रा",
      trust_note: "*यथार्थ टूर एंड ट्रैवल्स द्वारा बताया गया, जो 2022 से संचालित है।",

      offer_label: "स्पेशल स्कूल ग्रुप ऑफर", offer_title: "60% तक की बचत*",
      offer_sub1: "अधिक छात्र। बेहतर बजट। बेहतर अनुभव।",
      offer_sub2: "अपने स्कूल की आवश्यकताओं और बजट के अनुसार एक शैक्षिक यात्रा की योजना बनाएं।",
      offer_btn: "अपने स्कूल का कस्टम ऑफर प्राप्त करें",
      offer_disclaimer: "*छूट और अंतिम मूल्य समूह के आकार, गंतव्य, यात्रा तिथियों, समावेशन और अनुकूलन पर निर्भर करते हैं। नियम व शर्तें लागू।",

      st_kicker: "हम क्या आयोजित करते हैं",
      st_title: "जिज्ञासु मन के लिए डिज़ाइन किए गए शैक्षिक टूर।",
      st_text: "यथार्थ टूर एंड ट्रैवल्स स्कूल शैक्षिक टूर, छात्र समूह भ्रमण, ऐतिहासिक और सांस्कृतिक टूर, प्रकृति और साहसिक यात्राएं, शैक्षिक क्षेत्र दौरे, धार्मिक और सांस्कृतिक सर्किट, अंतर-राज्यीय स्कूल टूर, और पूरी तरह से कस्टमाइज़्ड स्कूल यात्रा कार्यक्रम आयोजित करता है।",
      st_card1_title: "शैक्षिक अनुभव", st_card1_text: "इतिहास, संस्कृति, प्रकृति और नई जगहों को जानें।",
      st_card2_title: "आरामदायक समूह यात्रा", st_card2_text: "स्कूल समूहों के अनुसार यात्रा व्यवस्था की जाती है।",
      st_card3_title: "लचीली यात्रा योजना", st_card3_text: "गंतव्य, अवधि, गतिविधियां और यात्रा शैली चुनें।",
      st_card4_title: "बजट-अनुकूल योजना", st_card4_text: "छात्रों के बजट के अनुसार व्यावहारिक पैकेज।",

      about_kicker: "हमारे बारे में",
      about_title: "2022 से अनुभव के साथ यात्रा योजना।",
      about_text: "यथार्थ टूर एंड ट्रैवल्स 2022 से संचालित है, जो स्कूलों और समूहों को हिमाचल प्रदेश और उत्तर भारत में सार्थक यात्राएं बनाने में मदद करता है। हमारा स्कूल-टूर दृष्टिकोण व्यावहारिक बजट, कस्टमाइज़्ड यात्रा योजना, आरामदायक यात्रा व्यवस्था और यादगार शैक्षिक अनुभवों पर केंद्रित है। हमारे लिए हर यात्रा एक सीख बन जाती है — संरचित शिक्षा को अन्वेषण, संस्कृति और वास्तविक अनुभव के साथ जोड़कर।",
      timeline1: "संचालन शुरू किया", timeline2: "स्कूल और समूह यात्रा", timeline3: "कस्टमाइज़्ड टूर योजना",

      pkg_kicker: "मूल्य निर्धारण", pkg_title: "हर स्कूल बजट के लिए यात्रा योजनाएं।",
      pkg_text: "एक शुरुआती योजना चुनें या हमें अपने स्कूल के लिए एक कस्टम कोटेशन बनाने दें।",
      pkg_range: "₹2,000 – ₹20,000+ प्रति छात्र",
      pkg_note: "ये अनुमानित मूल्य हैं। अंतिम मूल्य गंतव्य, समूह के आकार, अवधि, यात्रा तिथियों, परिवहन, आवास, भोजन, गतिविधियों और समावेशन पर निर्भर करता है।",
      pkg1_title: "लोकल एक्सप्लोरर", pkg1_price_label: "शुरुआती मूल्य", per_student: "/छात्र",
      pkg1_li1: "स्थानीय शैक्षिक दौरे", pkg1_li2: "नजदीकी दर्शनीय स्थल",
      pkg1_li3: "एक-दिवसीय स्कूल भ्रमण", pkg1_li4: "कम दूरी की समूह यात्राएं",
      pkg1_btn: "लोकल एक्सप्लोरर चुनें",
      pkg2_title: "बजट डिस्कवरी",
      pkg2_li1: "बजट-अनुकूल स्कूल टूर", pkg2_li2: "कम दूरी के गंतव्य", pkg2_li3: "बुनियादी समूह यात्रा योजनाएं",
      pkg2_btn: "बजट डिस्कवरी चुनें",
      pkg3_title: "एजुकेशनल एक्सप्लोरर", pkg_popular: "लोकप्रिय",
      pkg3_li1: "बहु-दिवसीय शैक्षिक टूर", pkg3_li2: "अंतर-शहर यात्रा", pkg3_li3: "ऐतिहासिक और सांस्कृतिक दर्शनीय स्थल",
      pkg3_btn: "एजुकेशनल एक्सप्लोरर कोटेशन लें",
      pkg4_title: "ग्रैंड जर्नी",
      pkg4_li1: "लंबी दूरी के स्कूल टूर", pkg4_li2: "विस्तारित बहु-दिवसीय यात्रा योजना", pkg4_li3: "व्यापक यात्रा अनुभव",
      pkg4_btn: "ग्रैंड जर्नी प्लान चुनें",
      pkg_final_note: "आपके स्कूल की आवश्यकताओं को समझने के बाद अंतिम कोटेशन तैयार किया जाता है।",

      fac_kicker: "हम क्या प्रदान करते हैं", fac_title: "एक सहज स्कूल यात्रा के लिए हर चीज़ की योजना।",
      fac1_title: "यात्रा और परिवहन",
      fac1_li1: "आरामदायक समूह परिवहन", fac1_li2: "मार्ग योजना",
      fac1_li3: "सहमति अनुसार पिकअप और ड्रॉप समन्वय", fac1_li4: "स्कूल-समूह यात्रा समन्वय",
      fac2_title: "भोजन और नाश्ता",
      fac2_li1: "नाश्ता, दोपहर और रात के भोजन के विकल्प", fac2_li2: "पैकेज में चुनी गई भोजन व्यवस्था",
      fac2_li3: "चुने गए विक्रेताओं/भागीदारों के माध्यम से स्वच्छ भोजन व्यवस्था", fac2_li4: "आहार संबंधी आवश्यकताओं पर पहले से चर्चा की जा सकती है",
      fac3_title: "यात्रा योजना",
      fac3_li1: "पूरी टूर योजना", fac3_li2: "गंतव्य-वार कार्यक्रम",
      fac3_li3: "दर्शनीय स्थल समन्वय", fac3_li4: "स्कूल-अनुकूल यात्रा योजना और समय प्रबंधन",
      fac4_title: "गाइड और टूर सहायता",
      fac4_li1: "टूर समन्वय", fac4_li2: "जहां उपलब्ध हो वहां स्थानीय गाइड विकल्प",
      fac4_li3: "गंतव्य जानकारी", fac4_li4: "शैक्षिक दर्शनीय स्थल सहायता और समूह समन्वय",
      fac5_title: "अनुकूलन",
      fac5_li1: "कस्टमाइज़्ड गंतव्य", fac5_li2: "कस्टमाइज़्ड अवधि और गतिविधियां",
      fac5_li3: "कस्टमाइज़्ड भोजन विकल्प", fac5_li4: "कस्टमाइज़्ड परिवहन और बजट",
      fac6_title: "बजट योजना",
      fac6_li1: "पारदर्शी अनुमानित बजट", fac6_li2: "छात्र-वार लागत गणना",
      fac6_li3: "समूह-आकार आधारित मूल्य निर्धारण", fac6_li4: "पुष्टि से पहले स्पष्ट समावेशन और बहिष्करण",
      fac_note: "समावेशन चुने गए पैकेज और अंतिम कोटेशन पर निर्भर करता है। हर सुविधा हर पैकेज में शामिल नहीं होती।",

      cp_kicker: "कस्टम योजना", cp_title: "आपका स्कूल। आपके छात्र। आपकी सही यात्रा योजना।",
      cp_text: "हमें बताएं कि आपको क्या चाहिए, और हम आपके स्कूल की रुचियों, समय-सारिणी और बजट के अनुसार एक टूर तैयार करने में मदद करेंगे।",
      cp1_title: "अपनी आवश्यकताएं साझा करें",
      cp1_li1: "गंतव्य", cp1_li2: "छात्रों और शिक्षकों की संख्या",
      cp1_li3: "यात्रा तिथियां और दिनों की संख्या", cp1_li4: "प्रति छात्र बजट",
      cp2_title: "अपना अनुभव कस्टमाइज़ करें",
      cp2_li1: "परिवहन और भोजन", cp2_li2: "आवास", cp2_li3: "गतिविधियां और शैक्षिक दौरे", cp2_li4: "दर्शनीय स्थल",
      cp3_title: "अपनी योजना और बजट प्राप्त करें",
      cp3_li1: "सुझाई गई यात्रा योजना", cp3_li2: "अनुमानित लागत",
      cp3_li3: "समावेशन और बहिष्करण", cp3_li4: "कस्टमाइज़्ड कोटेशन",
      cp_btn: "अपना कस्टम स्कूल टूर बनाएं",

      dest_kicker: "हम छात्रों को कहां ले जाते हैं", dest_title: "उत्तर भारत भर के गंतव्य देखें।",
      dest_text: "हिमाचल की पहाड़ियों से लेकर आगे की विरासत नगरों तक — उपयुक्त स्कूल-टूर गंतव्य देखने के लिए एक क्षेत्र चुनें।",
      filter_all: "सभी", filter_himachal: "हिमाचल प्रदेश", filter_punjab: "चंडीगढ़ और पंजाब",
      filter_delhi_agra: "दिल्ली और आगरा", filter_uttarakhand: "उत्तराखंड", filter_up: "उत्तर प्रदेश",
      filter_rajasthan: "राजस्थान", filter_circuits: "सर्किट टूर",

      dest_shimla: "राज्य की राजधानी के पास औपनिवेशिक विरासत, पहाड़ी दृश्य और प्रकृति-आधारित शिक्षा।",
      dest_manali: "साहसिक गतिविधियां, घाटियां, नदियां और सांस्कृतिक दर्शनीय स्थल।",
      dest_dharamshala: "तिब्बती संस्कृति, मठ और दर्शनीय शिक्षण अनुभव।",
      dest_dalhousie: "औपनिवेशिक शहर, घास के मैदान और विरासत मंदिर वास्तुकला।",
      dest_kinnaur: "उन्नत छात्र समूहों के लिए दूरस्थ पहाड़ी गांव और अनोखी भौगोलिक संरचना।",
      dest_spiti: "उच्च-ऊंचाई वाले रेगिस्तानी परिदृश्य, मठ और भूगोल क्षेत्र अध्ययन।",
      dest_bir: "चाय के बागान, प्रकृति पगडंडियां और शांत घाटी अनुभव।",
      dest_renuka: "झीलें, धार्मिक स्थल और एक-दिवसीय यात्राओं के लिए कम दूरी के भ्रमण।",
      dest_chandigarh: "योजनाबद्ध शहर भ्रमण के लिए रॉक गार्डन, सुखना झील और संग्रहालय।",
      dest_amritsar: "ऐतिहासिक शिक्षा के लिए स्वर्ण मंदिर, जलियांवाला बाग और विभाजन संग्रहालय।",
      dest_wagah: "यात्रा के समय वर्तमान पहुंच और अनुमति के अधीन।",
      dest_delhi: "इंडिया गेट, राष्ट्रीय संग्रहालय, राष्ट्रीय विज्ञान केंद्र, कुतुब मीनार और हुमायूं का मकबरा।",
      dest_agra: "ताज महल, आगरा किला और मेहताब बाग — एक क्लासिक इतिहास सर्किट।",
      dest_haridwar: "गंगा आरती, आध्यात्मिक स्थल और नदी किनारे शिक्षण अनुभव।",
      dest_mussoorie: "शैक्षिक संस्थान दौरों के साथ पहाड़ी-स्टेशन दर्शनीय स्थल।",
      dest_vrindavan: "सांस्कृतिक और आध्यात्मिक सर्किट — जैसा कि नीचे हमारी टूर डायरी में दिखाया गया है।",
      dest_varanasi: "प्राचीन संस्कृति, बौद्ध विरासत और नदी तट का इतिहास।",
      dest_ayodhya: "स्कूल की आवश्यकताओं के आधार पर सांस्कृतिक, ऐतिहासिक और आध्यात्मिक गंतव्य।",
      dest_jaipur: "एक क्लासिक इतिहास टूर के लिए किले, महल और विरासत वास्तुकला।",
      dest_udaipur: "पश्चिमी राजस्थान भर में झीलें, किले और रेगिस्तानी परिदृश्य।",
      dest_chittorgarh: "किले का इतिहास और वन्यजीव अनुभव, सफारी उपलब्धता और नियमों के अधीन।",
      circuit1: "कुल्लू–मनाली प्रकृति और साहसिक टूर", circuit2: "शिमला–कुफरी शैक्षिक टूर",
      circuit3: "दिल्ली–आगरा ऐतिहासिक टूर", circuit4: "चंडीगढ़–अमृतसर विरासत टूर",
      circuit5: "हरिद्वार–ऋषिकेश शैक्षिक टूर", circuit6: "राजस्थान किले और इतिहास टूर",

      dest_btn_shimla: "शिमला कुफरी टूर प्लान करें",
      dest_btn_manali: "कुल्लू मनाली टूर प्लान करें",
      dest_btn_dharamshala: "धर्मशाला टूर प्लान करें",
      dest_btn_dalhousie: "डलहौज़ी खज्जियार टूर प्लान करें",
      dest_btn_kinnaur: "किन्नौर संगला टूर प्लान करें",
      dest_btn_spiti: "स्पीति घाटी टूर प्लान करें",
      dest_btn_bir: "बीर बिलिंग टूर प्लान करें",
      dest_btn_renuka: "रेणुका जी टूर प्लान करें",
      dest_btn_chandigarh: "चंडीगढ़ सिटी टूर प्लान करें",
      dest_btn_amritsar: "अमृतसर विरासत टूर प्लान करें",
      dest_btn_wagah: "वाघा बॉर्डर टूर प्लान करें",
      dest_btn_delhi: "नई दिल्ली टूर प्लान करें",
      dest_btn_agra: "आगरा ऐतिहासिक टूर प्लान करें",
      dest_btn_haridwar: "हरिद्वार ऋषिकेश टूर प्लान करें",
      dest_btn_mussoorie: "देहरादून मसूरी टूर प्लान करें",
      dest_btn_vrindavan: "मथुरा वृंदावन टूर प्लान करें",
      dest_btn_varanasi: "वाराणसी टूर प्लान करें",
      dest_btn_ayodhya: "अयोध्या टूर प्लान करें",
      dest_btn_jaipur: "जयपुर अजमेर टूर प्लान करें",
      dest_btn_udaipur: "राजस्थान टूर प्लान करें",
      dest_btn_chittorgarh: "चित्तौड़गढ़ टूर प्लान करें",
      dest_btn_circuit1: "कुल्लू मनाली सर्किट प्लान करें",
      dest_btn_circuit2: "शिमला कुफरी सर्किट प्लान करें",
      dest_btn_circuit3: "दिल्ली आगरा सर्किट प्लान करें",
      dest_btn_circuit4: "चंडीगढ़ अमृतसर सर्किट प्लान करें",
      dest_btn_circuit5: "हरिद्वार ऋषिकेश सर्किट प्लान करें",
      dest_btn_circuit6: "राजस्थान सर्किट प्लान करें",

      dest_note: "मार्ग, पहुंच, मौसम, अनुमति और उपलब्धता अंतिम टूर योजना को प्रभावित कर सकते हैं।",

      td_kicker: "वास्तविक स्कूल टूर", td_title: "स्कूल टूर डायरी",
      td_subtitle: "वास्तविक यात्राएं। साझा अनुभव। यादगार शिक्षा।",
      td_placeholder: "वीडियो जल्द आ रहा है। यहां यूट्यूब एम्बेड जोड़ा जाएगा।",
      td_video_title: "वृंदावन शैक्षिक यात्रा", td_video_dest: "गंतव्य: वृंदावन",
      td_video_desc: "राजकीय वरिष्ठ माध्यमिक विद्यालय, सौंजली की वृंदावन शैक्षिक यात्रा की एक झलक देखें, और जानें कि कैसे यात्रा संस्कृति, शिक्षा, अन्वेषण और यादगार अनुभवों को जोड़ सकती है।",
      td_btn: "टूर डायरी देखें",

      doc_kicker: "विश्वास और पारदर्शिता", doc_title: "कंपनी दस्तावेज़ और प्रमाणपत्र",
      doc_text: "हमारे उपलब्ध व्यावसायिक दस्तावेज़, प्रमाणपत्र, लाइसेंस और अन्य संबंधित प्रमाण देखें। आवश्यकतानुसार दस्तावेज़ जोड़े या अपडेट किए जा सकते हैं।",
      doc1_title: "व्यवसाय पंजीकरण", doc1_text: "कंपनी पंजीकरण दस्तावेज़।",
      doc2_title: "ट्रैवल एजेंसी लाइसेंस / प्राधिकरण", doc2_text: "व्यवसाय प्राधिकरण दस्तावेज़।",
      doc3_title: "अन्य प्रमाणपत्र / प्रमाण", doc3_text: "अतिरिक्त व्यावसायिक प्रमाण।",
      doc_view: "कंपनी प्रमाणपत्र देखें",
      doc_note: "इस पृष्ठ पर दिखाए गए दस्तावेज़ कंपनी द्वारा प्रदान किए गए हैं।",

      contact_kicker: "संपर्क करें", contact_title: "आइए अपने स्कूल की अगली यात्रा की योजना बनाएं।",
      contact_text: "अपनी आवश्यकताएं साझा करें और हम आपको उपयुक्त गंतव्य, यात्रा योजना और बजट विकल्प खोजने में मदद करेंगे।",

      contact_email_title: "स्कूल टूर पूछताछ के लिए ईमेल",
      contact_email_btn: "ईमेल पूछताछ भेजें",

      contact_call_title_main: "हमें कॉल करें – मुख्य लाइन",
      contact_call_btn_main: "मुख्य लाइन पर कॉल करें",

      contact_call_title_alt: "हमें कॉल करें – वैकल्पिक लाइन",
      contact_call_btn_alt: "वैकल्पिक लाइन पर कॉल करें",

      contact_wa_title_main: "व्हाट्सएप – प्राथमिक",
      contact_wa_btn_main: "व्हाट्सएप पर चैट करें – प्राथमिक",

      contact_wa_title_alt: "व्हाट्सएप – वैकल्पिक",
      contact_wa_btn_alt: "व्हाट्सएप पर चैट करें – वैकल्पिक",

      form_title: "कस्टम कोटेशन मांगें", form_school: "स्कूल का नाम *",
      form_contact_person: "प्रधानाचार्य / शिक्षक / समन्वयक का नाम *", form_contact_number: "संपर्क नंबर *",
      form_email: "ईमेल पता (वैकल्पिक)", form_students: "छात्रों की संख्या *",
      form_teachers: "शिक्षकों / स्टाफ की संख्या *", form_start_location: "प्रारंभिक स्थान *",
      form_destination: "पसंदीदा गंतव्य *", form_travel_date: "यात्रा तिथि *",
      form_days: "दिनों की संख्या *", form_budget: "प्रति छात्र अनुमानित बजट *",
      form_food: "भोजन आवश्यकताएं", form_transport: "परिवहन प्राथमिकता",
      form_accommodation: "आवास आवश्यक है?", form_additional: "अतिरिक्त आवश्यकताएं",
      form_submit: "कस्टम कोटेशन मांगें",
      form_success: "धन्यवाद! आपका अनुरोध तैयार किया गया है। कृपया अपनी पूछताछ पूरी करने के लिए इसे व्हाट्सएप पर भेजें।",
      err_required: "यह फ़ील्ड आवश्यक है।", err_phone: "एक वैध 10-अंकीय नंबर दर्ज करें।",
      err_email: "एक वैध ईमेल पता दर्ज करें।",
      food_veg: "शाकाहारी", food_nonveg: "मांसाहारी", food_both: "दोनों", food_discuss: "चर्चा की जाएगी",
      transport_bus: "बस", transport_train: "ट्रेन", transport_mixed: "मिश्रित / निश्चित नहीं",
      opt_yes: "हां", opt_no: "नहीं",

      footer_tagline: "अन्वेषण करें। सीखें। अनुभव करें।", footer_since: "2022 से सेवा में",
      footer_contact_title: "संपर्क", footer_links_title: "त्वरित लिंक"
    },

    hinglish: {
      nav_home: "Home", nav_school_tours: "School Tours", nav_packages: "Packages",
      nav_destinations: "Destinations", nav_facilities: "Facilities", nav_tour_diary: "Tour Diary",
      nav_custom_plan: "Custom Plan", nav_documents: "Documents", nav_contact: "Contact",
      nav_cta: "Quote Mangwayein",

      hero_kicker: "SCHOOL TOURS • EDUCATIONAL TRAVEL • STUDENT EXPERIENCES",
      hero_title: "Himachal Pradesh Mein School Educational Tours",
      hero_tagline: "Har Safar Ek Sabak Ban Jaata Hai.",
      hero_text: "Yatharth Tour and Travels Himachal Pradesh aur North India mein customized school educational tours plan karta hai — comfortable group travel, flexible itinerary, aur students ke hisaab se banaya gaya budget ke saath. Hamare liye har safar ek sabak ban jaata hai jab learning real-world exploration se milti hai.",
      hero_btn1: "Apna School Tour Plan Karein", hero_btn2: "Destinations Dekhein", hero_btn3: "Custom Quote Lein",
      trust1: "2022 Se Schools Ki Service Mein*", trust2: "Customized Itinerary",
      trust3: "Transparent Budgeting", trust4: "Comfortable Group Travel",
      trust_note: "*Yatharth Tour and Travels dwara bataya gaya, jo 2022 se operate kar raha hai.",

      offer_label: "SPECIAL SCHOOL GROUP OFFER", offer_title: "60% TAK KI SAVING*",
      offer_sub1: "Zyada Students. Smart Budget. Better Experience.",
      offer_sub2: "Apne school ki requirement aur budget ke hisaab se ek educational trip plan karein.",
      offer_btn: "Apne School Ka Custom Offer Lein",
      offer_disclaimer: "*Discount aur final pricing group size, destination, travel dates, inclusions, aur customization par depend karti hai. Terms apply.",

      st_kicker: "HUM KYA ORGANIZE KARTE HAIN",
      st_title: "Curious Minds Ke Liye Design Kiye Gaye Educational Tours.",
      st_text: "Yatharth Tour and Travels school educational tours, student group excursions, historical aur cultural tours, nature aur adventure trips, educational field visits, religious aur cultural circuits, inter-state school tours, aur fully customized school travel programs organize karta hai.",
      st_card1_title: "Educational Experiences", st_card1_text: "History, culture, nature, aur nayi jagah explore karein.",
      st_card2_title: "Comfortable Group Travel", st_card2_text: "School groups ke hisaab se travel arrangements plan kiye jaate hain.",
      st_card3_title: "Flexible Itineraries", st_card3_text: "Destination, duration, activities, aur travel style choose karein.",
      st_card4_title: "Budget-Friendly Planning", st_card4_text: "Student budget ke hisaab se practical packages.",

      about_kicker: "HAMARE BAARE MEIN",
      about_title: "2022 Se Experience Ke Saath Travel Planning.",
      about_text: "Yatharth Tour and Travels 2022 se operate kar raha hai, jo schools aur groups ko Himachal Pradesh aur North India mein meaningful journeys plan karne mein help karta hai. Hamara school-tour approach practical budget, customized itinerary, comfortable travel arrangements, aur memorable educational experiences par focus karta hai. Hamare liye har safar ek sabak ban jaata hai — structured learning ko exploration, culture, aur real-world exposure ke saath jodkar.",
      timeline1: "Operations Start Kiye", timeline2: "School & Group Travel", timeline3: "Customized Tour Planning",

      pkg_kicker: "PRICING", pkg_title: "Har School Budget Ke Liye Travel Plans.",
      pkg_text: "Ek starting plan choose karein ya humein apne school ke liye custom quotation banane dein.",
      pkg_range: "₹2,000 – ₹20,000+ per student",
      pkg_note: "Ye indicative prices hain. Final pricing destination, group size, duration, travel dates, transport, accommodation, meals, activities, aur inclusions par depend karti hai.",
      pkg1_title: "Local Explorer", pkg1_price_label: "Starting from", per_student: "/student",
      pkg1_li1: "Local educational visits", pkg1_li2: "Nearby sightseeing",
      pkg1_li3: "One-day school excursions", pkg1_li4: "Short-distance group trips",
      pkg1_btn: "Local Explorer Chunein",
      pkg2_title: "Budget Discovery",
      pkg2_li1: "Budget-friendly school tours", pkg2_li2: "Short-distance destinations", pkg2_li3: "Basic group travel plans",
      pkg2_btn: "Budget Discovery Chunein",
      pkg3_title: "Educational Explorer", pkg_popular: "Popular",
      pkg3_li1: "Multi-day educational tours", pkg3_li2: "Intercity travel", pkg3_li3: "Historical aur cultural sightseeing",
      pkg3_btn: "Educational Explorer Quote Lein",
      pkg4_title: "Grand Journey",
      pkg4_li1: "Long-distance school tours", pkg4_li2: "Extended multi-day itinerary", pkg4_li3: "Comprehensive travel experience",
      pkg4_btn: "Grand Journey Plan Chunein",
      pkg_final_note: "Aapke school ki requirements samajhne ke baad final quotation banaya jaata hai.",

      fac_kicker: "HUM KYA PROVIDE KARTE HAIN", fac_title: "Ek Smooth School Journey Ke Liye Sab Kuch Planned.",
      fac1_title: "Travel & Transport",
      fac1_li1: "Comfortable group transportation", fac1_li2: "Route planning",
      fac1_li3: "Agreed terms ke hisaab se pickup aur drop coordination", fac1_li4: "School-group travel coordination",
      fac2_title: "Food & Meals",
      fac2_li1: "Breakfast, lunch, aur dinner options", fac2_li2: "Package mein selected meal arrangements",
      fac2_li3: "Selected vendors/partners ke through hygienic food arrangements", fac2_li4: "Dietary requirements pehle se discuss ki ja sakti hain",
      fac3_title: "Itinerary Planning",
      fac3_li1: "Complete tour itinerary", fac3_li2: "Destination-wise schedule",
      fac3_li3: "Sightseeing coordination", fac3_li4: "School-friendly travel planning & time management",
      fac4_title: "Guide & Tour Support",
      fac4_li1: "Tour coordination", fac4_li2: "Available hone par local guide options",
      fac4_li3: "Destination information", fac4_li4: "Educational sightseeing assistance & group coordination",
      fac5_title: "Customization",
      fac5_li1: "Customized destinations", fac5_li2: "Customized duration & activities",
      fac5_li3: "Customized food options", fac5_li4: "Customized transport & budget",
      fac6_title: "Budget Planning",
      fac6_li1: "Transparent estimated budget", fac6_li2: "Student-wise cost calculation",
      fac6_li3: "Group-size-based pricing", fac6_li4: "Confirmation se pehle clear inclusions aur exclusions",
      fac_note: "Inclusions selected package aur final quotation par depend karte hain. Har facility har package mein include nahi hoti.",

      cp_kicker: "CUSTOM PLANNING", cp_title: "Aapka School. Aapke Students. Aapka Perfect Itinerary.",
      cp_text: "Humein bataein aapko kya chahiye, aur hum aapke school ke interests, schedule, aur budget ke hisaab se tour shape karne mein help karenge.",
      cp1_title: "Apni Requirements Share Karein",
      cp1_li1: "Destination", cp1_li2: "Students aur teachers ki number",
      cp1_li3: "Travel dates aur days ki number", cp1_li4: "Per student budget",
      cp2_title: "Apna Experience Customize Karein",
      cp2_li1: "Transport & food", cp2_li2: "Accommodation", cp2_li3: "Activities & educational visits", cp2_li4: "Sightseeing",
      cp3_title: "Apna Plan & Budget Paayein",
      cp3_li1: "Suggested itinerary", cp3_li2: "Estimated cost",
      cp3_li3: "Inclusions aur exclusions", cp3_li4: "Customized quotation",
      cp_btn: "Apna Custom School Tour Banayein",

      dest_kicker: "HUM STUDENTS KO KAHAN LE JAATE HAIN", dest_title: "North India Ke Destinations Explore Karein.",
      dest_text: "Himachal ki pahadiyon se lekar aage ke heritage cities tak — suitable school-tour destinations dekhne ke liye ek region choose karein.",
      filter_all: "All", filter_himachal: "Himachal Pradesh", filter_punjab: "Chandigarh & Punjab",
      filter_delhi_agra: "Delhi & Agra", filter_uttarakhand: "Uttarakhand", filter_up: "Uttar Pradesh",
      filter_rajasthan: "Rajasthan", filter_circuits: "Circuit Tours",

      dest_shimla: "State capital ke paas colonial heritage, mountain views, aur nature-based learning.",
      dest_manali: "Adventure activities, valleys, rivers, aur cultural sightseeing.",
      dest_dharamshala: "Tibetan culture, monasteries, aur scenic learning experience.",
      dest_dalhousie: "Colonial towns, meadows, aur heritage temple architecture.",
      dest_kinnaur: "Advanced student groups ke liye remote mountain villages aur unique geography.",
      dest_spiti: "High-altitude desert landscapes, monasteries, aur geography field study.",
      dest_bir: "Tea gardens, nature trails, aur peaceful valley experience.",
      dest_renuka: "Day trips ke liye lakes, religious sites, aur short-distance excursions.",
      dest_chandigarh: "Planned city excursions ke liye Rock Garden, Sukhna Lake, aur museums.",
      dest_amritsar: "Historical learning ke liye Golden Temple, Jallianwala Bagh, aur Partition Museum.",
      dest_wagah: "Travel ke time current access aur permissions ke subject.",
      dest_delhi: "India Gate, National Museum, National Science Centre, Qutub Minar & Humayun's Tomb.",
      dest_agra: "Taj Mahal, Agra Fort, aur Mehtab Bagh — ek classic history circuit.",
      dest_haridwar: "Ganga Aarti, spiritual sites, aur river-side learning experience.",
      dest_mussoorie: "Educational institution visits ke saath hill-station sightseeing.",
      dest_vrindavan: "Cultural aur spiritual circuit — jaisa hamari tour diary mein neeche dikhaya gaya hai.",
      dest_varanasi: "Ancient culture, Buddhist heritage, aur riverfront history.",
      dest_ayodhya: "School requirements ke basis par cultural, historical, aur spiritual destinations.",
      dest_jaipur: "Classic history tour ke liye forts, palaces, aur heritage architecture.",
      dest_udaipur: "Western Rajasthan mein lakes, forts, aur desert landscapes.",
      dest_chittorgarh: "Fort history aur wildlife exposure, safari availability aur rules ke subject.",
      circuit1: "Kullu–Manali Nature & Adventure Tour", circuit2: "Shimla–Kufri Educational Tour",
      circuit3: "Delhi–Agra Historical Tour", circuit4: "Chandigarh–Amritsar Heritage Tour",
      circuit5: "Haridwar–Rishikesh Educational Tour", circuit6: "Rajasthan Forts & History Tour",

      dest_btn_shimla: "Shimla Kufri Tour Plan Karein",
      dest_btn_manali: "Kullu Manali Tour Plan Karein",
      dest_btn_dharamshala: "Dharamshala Tour Plan Karein",
      dest_btn_dalhousie: "Dalhousie Khajjiar Tour Plan Karein",
      dest_btn_kinnaur: "Kinnaur Sangla Tour Plan Karein",
      dest_btn_spiti: "Spiti Valley Tour Plan Karein",
      dest_btn_bir: "Bir Billing Tour Plan Karein",
      dest_btn_renuka: "Renuka Ji Tour Plan Karein",
      dest_btn_chandigarh: "Chandigarh City Tour Plan Karein",
      dest_btn_amritsar: "Amritsar Heritage Tour Plan Karein",
      dest_btn_wagah: "Wagah Border Tour Plan Karein",
      dest_btn_delhi: "New Delhi Tour Plan Karein",
      dest_btn_agra: "Agra Historical Tour Plan Karein",
      dest_btn_haridwar: "Haridwar Rishikesh Tour Plan Karein",
      dest_btn_mussoorie: "Dehradun Mussoorie Tour Plan Karein",
      dest_btn_vrindavan: "Mathura Vrindavan Tour Plan Karein",
      dest_btn_varanasi: "Varanasi Tour Plan Karein",
      dest_btn_ayodhya: "Ayodhya Tour Plan Karein",
      dest_btn_jaipur: "Jaipur Ajmer Tour Plan Karein",
      dest_btn_udaipur: "Rajasthan Tour Plan Karein",
      dest_btn_chittorgarh: "Chittorgarh Tour Plan Karein",
      dest_btn_circuit1: "Kullu Manali Circuit Plan Karein",
      dest_btn_circuit2: "Shimla Kufri Circuit Plan Karein",
      dest_btn_circuit3: "Delhi Agra Circuit Plan Karein",
      dest_btn_circuit4: "Chandigarh Amritsar Circuit Plan Karein",
      dest_btn_circuit5: "Haridwar Rishikesh Circuit Plan Karein",
      dest_btn_circuit6: "Rajasthan Circuit Plan Karein",

      dest_note: "Routes, access, weather, permissions, aur availability final tour plan ko affect kar sakte hain.",

      td_kicker: "REAL SCHOOL TOURS", td_title: "School Tour Diaries",
      td_subtitle: "Real journeys. Shared experiences. Memorable learning.",
      td_placeholder: "Video jald aa raha hai. Yahan YouTube embed add kiya jaayega.",
      td_video_title: "Vrindavan Educational Tour", td_video_dest: "Destination: Vrindavan",
      td_video_desc: "Government Senior Secondary School, Saunjali ki Vrindavan educational tour ki ek jhalak dekhein, aur jaanein ki travel kaise culture, learning, exploration, aur memorable experiences ko combine kar sakti hai.",
      td_btn: "Tour Diary Dekhein",

      doc_kicker: "TRUST & TRANSPARENCY", doc_title: "Company Documents & Credentials",
      doc_text: "Hamare available business documents, certificates, licenses, aur other relevant credentials dekhein. Documents zaroorat ke hisaab se add ya update kiye ja sakte hain.",
      doc1_title: "Business Registration", doc1_text: "Company registration document.",
      doc2_title: "Travel Agency License / Authorization", doc2_text: "Business authorization document.",
      doc3_title: "Other Certificate / Credential", doc3_text: "Additional business credential.",
      doc_view: "Company Certificate Dekhein",
      doc_note: "Is page par dikhaye gaye documents company dwara provide kiye gaye hain.",

      contact_kicker: "SAMPARK KAREIN", contact_title: "Chaliye Aapke School Ki Next Journey Plan Karein.",
      contact_text: "Apni requirements share karein aur hum aapko suitable destinations, itinerary, aur budget options explore karne mein madad karenge.",

      contact_email_title: "School Tour Enquiries Ke Liye Email",
      contact_email_btn: "Email Enquiry Bhejein",

      contact_call_title_main: "Humein Call Karein – Main Line",
      contact_call_btn_main: "Main Line Par Call Karein",

      contact_call_title_alt: "Humein Call Karein – Alternate Line",
      contact_call_btn_alt: "Alternate Line Par Call Karein",

      contact_wa_title_main: "WhatsApp – Primary",
      contact_wa_btn_main: "WhatsApp Par Chat Karein – Primary",

      contact_wa_title_alt: "WhatsApp – Alternate",
      contact_wa_btn_alt: "WhatsApp Par Chat Karein – Alternate",

      form_title: "Custom Quote Mangwayein", form_school: "School Ka Naam *",
      form_contact_person: "Principal / Teacher / Coordinator Ka Naam *", form_contact_number: "Contact Number *",
      form_email: "Email Address (optional)", form_students: "Students Ki Number *",
      form_teachers: "Teachers / Staff Ki Number *", form_start_location: "Starting Location *",
      form_destination: "Preferred Destination *", form_travel_date: "Travel Date *",
      form_days: "Days Ki Number *", form_budget: "Per Student Approximate Budget *",
      form_food: "Food Requirements", form_transport: "Transport Preference",
      form_accommodation: "Accommodation Chahiye?", form_additional: "Additional Requirements",
      form_submit: "Custom Quote Mangwayein",
      form_success: "Dhanyavaad! Aapka request taiyaar ho gaya hai. Apni inquiry complete karne ke liye ise WhatsApp par bhejein.",
      err_required: "Yeh field zaroori hai.", err_phone: "Ek valid 10-digit number daalein.",
      err_email: "Ek valid email address daalein.",
      food_veg: "Vegetarian", food_nonveg: "Non-Vegetarian", food_both: "Dono", food_discuss: "Discuss karenge",
      transport_bus: "Bus", transport_train: "Train", transport_mixed: "Mixed / Sure nahi",
      opt_yes: "Haan", opt_no: "Nahi",

      footer_tagline: "Explore. Learn. Experience.", footer_since: "2022 Se Service Mein",
      footer_contact_title: "Contact", footer_links_title: "Quick Links"
    }
  };

  const langButtons = document.querySelectorAll('.lang-btn');
  const bodyEl = document.body;

  function applyLanguage(lang) {
    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    });

    // Toggle Hindi font class
    bodyEl.classList.toggle('lang-hi', lang === 'hi');

    // Highlight active language buttons
    langButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update <html lang> attribute dynamically (helps accessibility)
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');

    localStorage.setItem('yatharth_lang', lang);
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLanguage(btn.getAttribute('data-lang'));
    });
  });

  // Load saved language preference (default English)
  const savedLang = localStorage.getItem('yatharth_lang') || 'en';
  applyLanguage(savedLang);

});
