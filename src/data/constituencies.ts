
import { RegionConstituencies } from "../types/form";

export const regionConstituencies: RegionConstituencies = {
  "Banjul": [
    "Banjul South",
    "Banjul Central", 
    "Banjul North"
  ],
  "Kanifing": [
    "Kanifing",
    "Bakau",
    "Jeshwang",
    "Serekunda West",
    "Serrekunda",
    "Bundungka Kunda",
    "Latrikunda Sabijie",
    "Talinding Kunjang"
  ],
  "West Coast": [
    "Foni Jarrol",
    "Foni Brefet",
    "Foni Bintang",
    "Foni Bondali",
    "Foni Kansala",
    "Kombo East",
    "Kombo South",
    "Brikama North",
    "Brikama South",
    "Sanneh Mentereng",
    "Old Yundum",
    "Busumbala"
  ],
  "North Bank": [
    "Lower Nuimi",
    "Upper Nuimi",
    "Jokadu",
    "Lower Baddibu",
    "Central Baddibu",
    "Illiassa",
    "Sabach Sanjal"
  ],
  "Lower River": [
    "Jarra West",
    "Jarra East",
    "Jarra Central",
    "Kiang West",
    "Kiang East",
    "Kiang Central"
  ],
  "Central River": [
    "Janjanbureh",
    "Niani",
    "Nianija",
    "Niamina West",
    "Niamina East",
    "Niamina Dankunku",
    "Lower Fulladu West",
    "Upper Fulladu West",
    "Lower Saloum",
    "Upper Saloum",
    "Sami"
  ],
  "Upper River": [
    "Basse",
    "Jimara",
    "Tumana",
    "Kantora",
    "Sandu",
    "Wulli West",
    "Wulli East"
  ]
};

// Mock database of registered emails to prevent duplicate registrations
export const registeredEmails = new Set<string>();

// Mock admin users
export const adminUsers = [
  { id: "admin1", email: "admin@nypg.org", isAdmin: true },
  { id: "admin2", email: "director@nypg.org", isAdmin: true }
];
