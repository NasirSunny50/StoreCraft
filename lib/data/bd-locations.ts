/**
 * Bangladesh delivery locations: city (district / metro) → its areas
 * (thanas / upazilas). Used to drive the dependent City → Area dropdowns on the
 * address form. Curated for the major delivery hubs; extend as coverage grows.
 */
export type BdCity = { city: string; areas: string[] };

export const BD_LOCATIONS: BdCity[] = [
  {
    city: "Dhaka",
    areas: [
      "Uttara", "Mirpur", "Pallabi", "Kafrul", "Cantonment", "Gulshan",
      "Banani", "Badda", "Rampura", "Khilgaon", "Mohammadpur", "Dhanmondi",
      "Hazaribagh", "Lalbagh", "Kotwali", "Sutrapur", "Jatrabari", "Demra",
      "Motijheel", "Paltan", "Ramna", "Tejgaon", "Sabujbagh", "Shyampur",
      "Adabor", "Sher-e-Bangla Nagar", "Shahbagh", "New Market", "Wari",
      "Bashundhara", "Dakshinkhan", "Uttarkhan", "Turag", "Keraniganj",
      "Savar", "Dohar", "Nawabganj",
    ],
  },
  {
    city: "Chattogram",
    areas: [
      "Kotwali", "Pahartali", "Panchlaish", "Double Mooring", "Chandgaon",
      "Bakalia", "Bayezid Bostami", "Halishahar", "Khulshi", "Patenga",
      "Bandar", "EPZ", "Chawkbazar", "Agrabad", "Nasirabad", "GEC",
      "Muradpur", "Oxygen", "Sitakunda", "Hathazari", "Patiya",
    ],
  },
  {
    city: "Gazipur",
    areas: [
      "Joydebpur", "Tongi", "Board Bazar", "Chandana", "Konabari", "Gacha",
      "Kaliakair", "Kaliganj", "Kapasia", "Sreepur",
    ],
  },
  {
    city: "Narayanganj",
    areas: [
      "Narayanganj Sadar", "Chashara", "Fatullah", "Siddhirganj", "Bandar",
      "Araihazar", "Rupganj", "Sonargaon",
    ],
  },
  {
    city: "Narsingdi",
    areas: ["Narsingdi Sadar", "Madhabdi", "Palash", "Raipura", "Shibpur", "Monohardi"],
  },
  {
    city: "Munshiganj",
    areas: ["Munshiganj Sadar", "Sreenagar", "Sirajdikhan", "Lohajang", "Gazaria", "Tongibari"],
  },
  {
    city: "Manikganj",
    areas: ["Manikganj Sadar", "Singair", "Saturia", "Ghior", "Shibalaya", "Harirampur"],
  },
  {
    city: "Tangail",
    areas: ["Tangail Sadar", "Mirzapur", "Ghatail", "Kalihati", "Sakhipur", "Madhupur", "Gopalpur"],
  },
  {
    city: "Faridpur",
    areas: ["Faridpur Sadar", "Bhanga", "Boalmari", "Nagarkanda", "Madhukhali", "Alfadanga"],
  },
  {
    city: "Khulna",
    areas: [
      "Khulna Sadar", "Khalishpur", "Sonadanga", "Daulatpur", "Khan Jahan Ali",
      "Boyra", "Rupsha", "Dumuria", "Batiaghata", "Phultala",
    ],
  },
  {
    city: "Jashore",
    areas: ["Jashore Sadar", "Chowgacha", "Jhikargacha", "Benapole", "Monirampur", "Abhaynagar", "Keshabpur"],
  },
  {
    city: "Kushtia",
    areas: ["Kushtia Sadar", "Kumarkhali", "Bheramara", "Mirpur", "Daulatpur", "Khoksa"],
  },
  {
    city: "Satkhira",
    areas: ["Satkhira Sadar", "Kalaroa", "Tala", "Kaliganj", "Shyamnagar", "Debhata"],
  },
  {
    city: "Bagerhat",
    areas: ["Bagerhat Sadar", "Mongla", "Morrelganj", "Fakirhat", "Rampal", "Chitalmari"],
  },
  {
    city: "Rajshahi",
    areas: ["Boalia", "Rajpara", "Motihar", "Shah Makhdum", "Paba", "Godagari", "Puthia", "Durgapur"],
  },
  {
    city: "Bogura",
    areas: ["Bogura Sadar", "Sathmatha", "Jaleshwaritola", "Shibganj", "Gabtali", "Sherpur", "Sariakandi", "Shajahanpur"],
  },
  {
    city: "Pabna",
    areas: ["Pabna Sadar", "Ishwardi", "Bera", "Chatmohar", "Santhia", "Sujanagar"],
  },
  {
    city: "Sirajganj",
    areas: ["Sirajganj Sadar", "Ullapara", "Shahjadpur", "Belkuchi", "Kazipur", "Raiganj"],
  },
  {
    city: "Naogaon",
    areas: ["Naogaon Sadar", "Mahadebpur", "Patnitala", "Raninagar", "Manda", "Niamatpur"],
  },
  {
    city: "Chapainawabganj",
    areas: ["Chapainawabganj Sadar", "Shibganj", "Gomastapur", "Nachole", "Bholahat"],
  },
  {
    city: "Sylhet",
    areas: [
      "Sylhet Sadar", "Zindabazar", "Ambarkhana", "Subid Bazar", "Uposhohor",
      "Tilagor", "Beanibazar", "Golapganj", "South Surma", "Bishwanath",
    ],
  },
  {
    city: "Moulvibazar",
    areas: ["Moulvibazar Sadar", "Sreemangal", "Kulaura", "Kamalganj", "Rajnagar", "Barlekha"],
  },
  {
    city: "Habiganj",
    areas: ["Habiganj Sadar", "Madhabpur", "Nabiganj", "Chunarughat", "Bahubal", "Baniachong"],
  },
  {
    city: "Sunamganj",
    areas: ["Sunamganj Sadar", "Chhatak", "Jagannathpur", "Sulla", "Dharmapasha", "Tahirpur"],
  },
  {
    city: "Barishal",
    areas: ["Barishal Sadar", "Band Road", "Nathullabad", "Rupatoli", "Kawnia", "Bakerganj", "Gournadi", "Babuganj"],
  },
  {
    city: "Bhola",
    areas: ["Bhola Sadar", "Char Fasson", "Lalmohan", "Borhanuddin", "Daulatkhan", "Tazumuddin"],
  },
  {
    city: "Patuakhali",
    areas: ["Patuakhali Sadar", "Kalapara", "Kuakata", "Bauphal", "Galachipa", "Dashmina"],
  },
  {
    city: "Rangpur",
    areas: ["Rangpur Sadar", "Modern More", "Jahaj Company More", "Dhap", "Mithapukur", "Badarganj", "Pirganj", "Gangachara"],
  },
  {
    city: "Dinajpur",
    areas: ["Dinajpur Sadar", "Birganj", "Parbatipur", "Fulbari", "Birampur", "Chirirbandar", "Bochaganj"],
  },
  {
    city: "Nilphamari",
    areas: ["Nilphamari Sadar", "Saidpur", "Domar", "Jaldhaka", "Kishoreganj", "Dimla"],
  },
  {
    city: "Kurigram",
    areas: ["Kurigram Sadar", "Ulipur", "Nageshwari", "Bhurungamari", "Chilmari", "Rajarhat"],
  },
  {
    city: "Gaibandha",
    areas: ["Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Sundarganj", "Phulchhari"],
  },
  {
    city: "Mymensingh",
    areas: ["Mymensingh Sadar", "Chorpara", "Ganginar Par", "Trishal", "Bhaluka", "Muktagacha", "Gouripur", "Phulpur"],
  },
  {
    city: "Jamalpur",
    areas: ["Jamalpur Sadar", "Sarishabari", "Melandaha", "Islampur", "Dewanganj", "Madarganj"],
  },
  {
    city: "Netrokona",
    areas: ["Netrokona Sadar", "Mohanganj", "Kendua", "Durgapur", "Purbadhala", "Atpara"],
  },
  {
    city: "Sherpur",
    areas: ["Sherpur Sadar", "Nakla", "Nalitabari", "Sreebardi", "Jhenaigati"],
  },
  {
    city: "Cumilla",
    areas: ["Cumilla Sadar", "Kandirpar", "Jhawtola", "Race Course", "Laksam", "Chauddagram", "Daudkandi", "Chandina"],
  },
  {
    city: "Chandpur",
    areas: ["Chandpur Sadar", "Hajiganj", "Kachua", "Matlab", "Faridganj", "Shahrasti"],
  },
  {
    city: "Brahmanbaria",
    areas: ["Brahmanbaria Sadar", "Ashuganj", "Sarail", "Nabinagar", "Bancharampur", "Kasba"],
  },
  {
    city: "Feni",
    areas: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Sonagazi", "Parshuram", "Fulgazi"],
  },
  {
    city: "Noakhali",
    areas: ["Maijdee", "Chowmuhani", "Begumganj", "Sonaimuri", "Hatiya", "Senbagh", "Companiganj"],
  },
  {
    city: "Lakshmipur",
    areas: ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"],
  },
  {
    city: "Cox's Bazar",
    areas: ["Cox's Bazar Sadar", "Kolatoli", "Teknaf", "Ukhia", "Chakaria", "Ramu", "Maheshkhali"],
  },
];

/** Flat list of city names for the City dropdown. */
export const BD_CITIES: string[] = BD_LOCATIONS.map((l) => l.city);

/** Areas for a given city (empty if the city isn't in the dataset). */
export function areasForCity(city: string): string[] {
  return BD_LOCATIONS.find((l) => l.city === city)?.areas ?? [];
}
