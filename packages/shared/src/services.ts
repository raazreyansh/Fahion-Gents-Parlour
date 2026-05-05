export type ServiceCategory = "Haircut" | "Beard" | "Facial" | "Spa" | "Color" | "Massage";

export type Service = {
  id: string;
  name: string;
  nameHindi?: string;
  priceInr: number;
  durationMinutes: number;
  category: ServiceCategory;
  description: string;
  isActive: boolean;
  imageUrl?: string;
};

export const serviceCatalog: Service[] = [
  {
    id: "haircut",
    name: "Haircut (Bal Cutting)",
    priceInr: 50,
    durationMinutes: 15,
    category: "Haircut",
    description: "Basic precision haircut",
    isActive: true
  },
  {
    id: "shaving",
    name: "Shaving (Seving)",
    priceInr: 30,
    durationMinutes: 10,
    category: "Beard",
    description: "Clean razor shave",
    isActive: true
  },
  {
    id: "massage",
    name: "Massage",
    priceInr: 100,
    durationMinutes: 20,
    category: "Massage",
    description: "Head & neck massage",
    isActive: true
  },
  {
    id: "bleach",
    name: "Bleach",
    priceInr: 150,
    durationMinutes: 20,
    category: "Facial",
    description: "Skin brightening bleach",
    isActive: true
  },
  {
    id: "facial",
    name: "Facial",
    priceInr: 300,
    durationMinutes: 45,
    category: "Facial",
    description: "Standard facial treatment",
    isActive: true
  },
  {
    id: "d-tan",
    name: "D-Tan (Diten)",
    priceInr: 250,
    durationMinutes: 30,
    category: "Facial",
    description: "De-tanning treatment",
    isActive: true
  },
  {
    id: "hair-straightening",
    name: "Hair Straightening",
    priceInr: 1050,
    durationMinutes: 90,
    category: "Haircut",
    description: "Permanent hair straightening",
    isActive: true
  },
  {
    id: "scrub",
    name: "Scrub",
    priceInr: 100,
    durationMinutes: 20,
    category: "Facial",
    description: "Exfoliating face scrub",
    isActive: true
  },
  {
    id: "shaving-foam",
    name: "Shaving Foam",
    priceInr: 50,
    durationMinutes: 10,
    category: "Beard",
    description: "Foam-assisted shave",
    isActive: true
  },
  {
    id: "hair-spa",
    name: "Hair Spa",
    priceInr: 300,
    durationMinutes: 45,
    category: "Spa",
    description: "Deep conditioning spa",
    isActive: true
  },
  {
    id: "hair-color",
    name: "Hair Color",
    priceInr: 150,
    durationMinutes: 30,
    category: "Color",
    description: "Basic hair coloring",
    isActive: true
  },
  {
    id: "massage-shahnaz",
    name: "Massage Shahnaz",
    priceInr: 350,
    durationMinutes: 30,
    category: "Massage",
    description: "Premium Shahnaz massage",
    isActive: true
  },
  {
    id: "facial-shahnaz",
    name: "Facial Shahnaz",
    priceInr: 1200,
    durationMinutes: 60,
    category: "Facial",
    description: "Premium Shahnaz facial",
    isActive: true
  },
  {
    id: "beard-setting",
    name: "Beard Setting (Daadi)",
    priceInr: 50,
    durationMinutes: 10,
    category: "Beard",
    description: "Beard shape & styling",
    isActive: true
  },
  {
    id: "loreal-color",
    name: "Loreal Color",
    priceInr: 550,
    durationMinutes: 45,
    category: "Color",
    description: "Professional Loreal coloring",
    isActive: true
  },
  {
    id: "steam-wash",
    name: "Steam Wash",
    priceInr: 300,
    durationMinutes: 20,
    category: "Spa",
    description: "Steam-assisted hair wash",
    isActive: true
  }
];

export function getActiveServices(services = serviceCatalog) {
  return services.filter((service) => service.isActive);
}

export function calculateServiceTotal(serviceIds: string[], services = serviceCatalog) {
  const selected = serviceIds.map((id) => {
    const service = services.find((candidate) => candidate.id === id && candidate.isActive);
    if (!service) throw new Error(`Unknown or inactive service: ${id}`);
    return service;
  });

  return {
    priceInr: selected.reduce((sum, service) => sum + service.priceInr, 0),
    durationMinutes: selected.reduce((sum, service) => sum + service.durationMinutes, 0),
    services: selected
  };
}
