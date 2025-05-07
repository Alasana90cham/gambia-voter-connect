
import { RegionConstituencies, UserRole } from "../types/form";

export const regionConstituencies: RegionConstituencies = {
  "Banjul": [
    "Banjul South",
    "Banjul Central", 
    "Banjul North"
  ],
  "Kanifing": [
    "Bakau",
    "Jeshwang",
    "Serekunda West",
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

// Mock admin users with passwords (in a real system, passwords would be hashed)
export const adminUsers: UserRole[] = [
  { id: "admin1", email: "admin@nypg.org", password: "admin123", isAdmin: true },
  { id: "admin2", email: "director@nypg.org", password: "admin123", isAdmin: true }
];

// Function to add a new admin user
export const addAdminUser = (id: string, email: string, password: string) => {
  const newAdmin = { id, email, password, isAdmin: true };
  adminUsers.push(newAdmin);
  return newAdmin;
};

// Function to remove an admin user
export const removeAdminUser = (id: string) => {
  const index = adminUsers.findIndex(admin => admin.id === id);
  if (index !== -1) {
    adminUsers.splice(index, 1);
    return true;
  }
  return false;
};
