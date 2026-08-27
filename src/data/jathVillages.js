/**
 * GoMate Pilot Launch: 125 Villages of Jath (Jat) Taluka, Sangli District
 * PIN Code: 416404
 */

const JATH_VILLAGES = [
  { id: 1, name: 'Achkanhalli', nameMr: 'अचकनहळ्ळी', pop: 1888 },
  { id: 2, name: 'Akkalawadi', nameMr: 'अक्कलवाडी', pop: 1503 },
  { id: 3, name: 'Ambyachiwadi', nameMr: 'आंब्याचीवाडी', pop: 657 },
  { id: 4, name: 'Amrutwadi', nameMr: 'अमृतवाडी', pop: 1032 },
  { id: 5, name: 'Ankalagi', nameMr: 'अंकलगी', pop: 3670 },
  { id: 6, name: 'Ankale', nameMr: 'अंकले', pop: 3103 },
  { id: 7, name: 'Antral', nameMr: 'अंत्राळ', pop: 1310 },
  { id: 8, name: 'Asangi Jat', nameMr: 'असांगी जत', pop: 3097 },
  { id: 9, name: 'Asangi Turk', nameMr: 'असांगी तुर्क', pop: 1150 },
  { id: 10, name: 'Avandhi', nameMr: 'आवंधी', pop: 2821 },
  { id: 11, name: 'Bagalwadi', nameMr: 'बागलवाडी', pop: 770 },
  { id: 12, name: 'Bagewadi', nameMr: 'बागेवाडी', pop: 1677 },
  { id: 13, name: 'Baj', nameMr: 'बाज', pop: 4699 },
  { id: 14, name: 'Balgaon', nameMr: 'बाळगाव', pop: 3084 },
  { id: 15, name: 'Banali', nameMr: 'बनाळी', pop: 3212 },
  { id: 16, name: 'Basargi', nameMr: 'बसरगी', pop: 2184 },
  { id: 17, name: 'Belondgi', nameMr: 'बेलोडगी', pop: 2675 },
  { id: 18, name: 'Belunki', nameMr: 'बेलुंकी', pop: 2910 },
  { id: 19, name: 'Bevanur', nameMr: 'बेवनूर', pop: 2818 },
  { id: 20, name: 'Bhivargi', nameMr: 'भिवर्गी', pop: 3613 },
  { id: 21, name: 'Bilur', nameMr: 'बिळूर', pop: 9841 },
  { id: 22, name: 'Birnal', nameMr: 'बिरनाळ', pop: 1554 },
  { id: 23, name: 'Borgi Bk', nameMr: 'बोरगी बु.', pop: 1092 },
  { id: 24, name: 'Borgi Kh', nameMr: 'बोरगी खु.', pop: 1385 },
  { id: 25, name: 'Dafalapur', nameMr: 'डफळापूर', pop: 7591 },
  { id: 26, name: 'Daribadachi', nameMr: 'दरीबडची', pop: 5085 },
  { id: 27, name: 'Darikonur', nameMr: 'दरीकोनूर', pop: 1855 },
  { id: 28, name: 'Devnal', nameMr: 'देवनळ', pop: 1166 },
  { id: 29, name: 'Dhavadwadi', nameMr: 'धावडवाडी', pop: 1108 },
  { id: 30, name: 'Dhulkarwadi', nameMr: 'धुळकरवाडी', pop: 1284 },
  { id: 31, name: 'Dorli', nameMr: 'डोर्ली', pop: 1961 },
  { id: 32, name: 'Ekundi', nameMr: 'एकुंडी', pop: 2200 },
  { id: 33, name: 'Gholeshwar', nameMr: 'घोळेश्वर', pop: 1118 },
  { id: 34, name: 'Girgaon', nameMr: 'गिरगाव', pop: 3673 },
  { id: 35, name: 'Gondhalewadi', nameMr: 'गोंधळेवाडी', pop: 1369 },
  { id: 36, name: 'Guddapur', nameMr: 'गुडापूर', pop: 1622 },
  { id: 37, name: 'Gugwad', nameMr: 'गुगवाड', pop: 3821 },
  { id: 38, name: 'Gulgunjnal', nameMr: 'गुळगुंजनळ', pop: 555 },
  { id: 39, name: 'Gulvanchi', nameMr: 'गुळवंची', pop: 1480 },
  { id: 40, name: 'Halli', nameMr: 'हळ्ळी', pop: 2669 },
  { id: 41, name: 'Hivare', nameMr: 'हिवरे', pop: 1619 },
  { id: 42, name: 'Jadraboblad', nameMr: 'जाद्राबोबलाद', pop: 5915 },
  { id: 43, name: 'Jalyal Bk', nameMr: 'जाल्याळ बु.', pop: 1909 },
  { id: 44, name: 'Jalyal Kh', nameMr: 'जाल्याळ खु.', pop: 831 },
  { id: 45, name: 'Jat', nameMr: 'जत', pop: 35336 },
  { id: 46, name: 'Jirgyal', nameMr: 'जिरग्याळ', pop: 2284 },
  { id: 47, name: 'Kaganari', nameMr: 'कागनरी', pop: 1917 },
  { id: 48, name: 'Kanthi', nameMr: 'कांथी', pop: 2043 },
  { id: 49, name: 'Karajagi', nameMr: 'करजगी', pop: 4346 },
  { id: 50, name: 'Karajanagi', nameMr: 'करजनगी', pop: 1618 },
  { id: 51, name: 'Karewadi (North)', nameMr: 'कारेवाडी (उत्तर)', pop: 1045 },
  { id: 52, name: 'Karewadi (South)', nameMr: 'कारेवाडी (दक्षिण)', pop: 1277 },
  { id: 53, name: 'Kaslingwadi', nameMr: 'कासलिंगवाडी', pop: 841 },
  { id: 54, name: 'Khairao', nameMr: 'खैराव', pop: 1963 },
  { id: 55, name: 'Khalati', nameMr: 'खळती', pop: 2329 },
  { id: 56, name: 'Khandnal', nameMr: 'खांडनाळ', pop: 1774 },
  { id: 57, name: 'Khilarwadi', nameMr: 'खिलारवाडी', pop: 853 },
  { id: 58, name: 'Khojanwadi', nameMr: 'खोजनवाडी', pop: 2775 },
  { id: 59, name: 'Kolgiri', nameMr: 'कोळगिरी', pop: 2022 },
  { id: 60, name: 'Konbagi', nameMr: 'कोणबागी', pop: 498 },
  { id: 61, name: 'Kontya Boblad', nameMr: 'कोंत्या बोबलाद', pop: 2997 },
  { id: 62, name: 'Kosari', nameMr: 'कोसरी', pop: 4017 },
  { id: 63, name: 'Kudnur', nameMr: 'कुदनूर', pop: 1978 },
  { id: 64, name: 'Kulalwadi', nameMr: 'कुलाळवाडी', pop: 1561 },
  { id: 65, name: 'Kumbhari', nameMr: 'कुंभारी', pop: 3739 },
  { id: 66, name: 'Kunikonur', nameMr: 'कुणीकोनूर', pop: 1409 },
  { id: 67, name: 'Lakdewadi', nameMr: 'लाकडेवाडी', pop: 1175 },
  { id: 68, name: 'Lamantanda (East)', nameMr: 'लमाणतांडा (पूर्व)', pop: 701 },
  { id: 69, name: 'Lamantanda (West)', nameMr: 'लमाणतांडा (पश्चिम)', pop: 1102 },
  { id: 70, name: 'Lavanga', nameMr: 'लवांगा', pop: 773 },
  { id: 71, name: 'Lohagaon', nameMr: 'लोहगाव', pop: 1912 },
  { id: 72, name: 'Madgyal', nameMr: 'माडग्याळ', pop: 5528 },
  { id: 73, name: 'Maithal', nameMr: 'मैथाळ', pop: 638 },
  { id: 74, name: 'Mallal', nameMr: 'मल्लाळ', pop: 612 },
  { id: 75, name: 'Manik Nal', nameMr: 'माणिकनाळ', pop: 1199 },
  { id: 76, name: 'Mendhegiri', nameMr: 'मेंढेगिरी', pop: 1775 },
  { id: 77, name: 'Mirawad', nameMr: 'मिरावाड', pop: 1271 },
  { id: 78, name: 'Mokashawadi', nameMr: 'मोकाशीवाडी', pop: 400 },
  { id: 79, name: 'Morbagi', nameMr: 'मोरबागी', pop: 2043 },
  { id: 80, name: 'Motewadi (East)', nameMr: 'मोटेवाडी (पूर्व)', pop: 672 },
  { id: 81, name: 'Motewadi (West)', nameMr: 'मोटेवाडी (पश्चिम)', pop: 1475 },
  { id: 82, name: 'Muchandi', nameMr: 'मुचंडी', pop: 4295 },
  { id: 83, name: 'Navalwadi', nameMr: 'नवलवाडी', pop: 560 },
  { id: 84, name: 'Nigadi Bk', nameMr: 'निगडी बु.', pop: 2628 },
  { id: 85, name: 'Nigadi Kh', nameMr: 'निगडी खु.', pop: 2121 },
  { id: 86, name: 'Pandharewadi', nameMr: 'पांढरेवाडी', pop: 2126 },
  { id: 87, name: 'Pandozari', nameMr: 'पांढोझरी', pop: 1351 },
  { id: 88, name: 'Paradhi Wasti', nameMr: 'पारधी वस्ती', pop: 420 },
  { id: 89, name: 'Pratapur', nameMr: 'प्रतापूर', pop: 989 },
  { id: 90, name: 'Rajobawadi', nameMr: 'राजोबावाडी', pop: 709 },
  { id: 91, name: 'Rampur', nameMr: 'रामपूर', pop: 2577 },
  { id: 92, name: 'Ravalgundwadi', nameMr: 'रावळगुंडवाडी', pop: 2412 },
  { id: 93, name: 'Revnal', nameMr: 'रेवणनाळ', pop: 1968 },
  { id: 94, name: 'Salekari', nameMr: 'सालेकरी', pop: 1927 },
  { id: 95, name: 'Salmalgewadi', nameMr: 'सळमळगेवाडी', pop: 1312 },
  { id: 96, name: 'Sanamadi', nameMr: 'सनमडी', pop: 2170 },
  { id: 97, name: 'Sankh', nameMr: 'संख', pop: 8447 },
  { id: 98, name: 'Shedyal', nameMr: 'शेड्याळ', pop: 1721 },
  { id: 99, name: 'Shegaon', nameMr: 'शेगाव', pop: 5614 },
  { id: 100, name: 'Shelkewadi', nameMr: 'शेळकेवाडी', pop: 599 },
  { id: 101, name: 'Siddhanath', nameMr: 'सिद्धनाथ', pop: 2314 },
  { id: 102, name: 'Sindur', nameMr: 'सिंदूर', pop: 3483 },
  { id: 103, name: 'Singanhalli', nameMr: 'सिंगनहळ्ळी', pop: 2420 },
  { id: 104, name: 'Singnapur', nameMr: 'सिंगणापूर', pop: 1332 },
  { id: 105, name: 'Sonalagi', nameMr: 'सोनालगी', pop: 2197 },
  { id: 106, name: 'Sonyal', nameMr: 'सोन्याळ', pop: 4992 },
  { id: 107, name: 'Sordi', nameMr: 'सोर्डी', pop: 2716 },
  { id: 108, name: 'Suslad', nameMr: 'सुसलाद', pop: 2645 },
  { id: 109, name: 'Tikondi', nameMr: 'तिकोंडी', pop: 3352 },
  { id: 110, name: 'Tilyal', nameMr: 'तिळयाळ', pop: 832 },
  { id: 111, name: 'Tippehalli', nameMr: 'तिप्पेहळ्ळी', pop: 1032 },
  { id: 112, name: 'Tonewadi', nameMr: 'टोनेवाडी', pop: 1186 },
  { id: 113, name: 'Umadi', nameMr: 'उमदी', pop: 10627 },
  { id: 114, name: 'Umarani', nameMr: 'उमराणी', pop: 6108 },
  { id: 115, name: 'Untwadi', nameMr: 'उंटवाडी', pop: 1349 },
  { id: 116, name: 'Utagi', nameMr: 'उटागी', pop: 5781 },
  { id: 117, name: 'Vajrawad', nameMr: 'वज्रवाड', pop: 2351 },
  { id: 118, name: 'Vhaspeth', nameMr: 'व्हासपेठ', pop: 1938 },
  { id: 119, name: 'Vithalwadi', nameMr: 'विठ्ठलवाडी', pop: 1927 },
  { id: 120, name: 'Waifal', nameMr: 'वायफळ', pop: 2334 },
  { id: 121, name: 'Walekhindi', nameMr: 'वाळेखिंडी', pop: 4642 },
  { id: 122, name: 'Walsang', nameMr: 'वळसंग', pop: 2941 },
  { id: 123, name: 'Washan', nameMr: 'वाशन', pop: 819 },
  { id: 124, name: 'Yelavi', nameMr: 'येळवी', pop: 2959 },
  { id: 125, name: 'Yeldari', nameMr: 'येळदरी', pop: 1627 }
];

/**
 * Match a user input against Jath villages
 */
function findJathVillage(query) {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  
  if (q.includes('jat') || q.includes('jath') || q.includes('जत') || q.includes('416404') || q.includes('sangli') || q.includes('सांगली')) {
    return { name: 'Jat Center', nameMr: 'जत मुख्य केंद्र', pop: 35336, isCenter: true };
  }

  const direct = JATH_VILLAGES.find(v => 
    v.name.toLowerCase() === q || 
    v.nameMr === query.trim() ||
    v.name.toLowerCase().includes(q) ||
    v.nameMr.includes(query.trim())
  );

  return direct || null;
}

/**
 * Check if the entered location belongs to Jath pilot area
 */
function isJathLocation(text) {
  if (!text) return false;
  const t = String(text).trim().toLowerCase();
  if (t.includes('jat') || t.includes('jath') || t.includes('जत') || t.includes('416404') || t.includes('sangli') || t.includes('सांगली')) {
    return true;
  }
  return !!findJathVillage(text);
}

module.exports = {
  JATH_VILLAGES,
  findJathVillage,
  isJathLocation
};

