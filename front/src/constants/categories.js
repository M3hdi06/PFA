// Categories list used throughout the app
export const CATEGORIES = [
  {
    group: "🍔 Alimentation & boissons",
    items: [
      { value: "Restaurants", label: "🍽️ Restaurants" },
      { value: "Bar", label: "🍺 Bars" },
      { value: "Cafes", label: "☕ Cafés" },
      { value: "VenteAEmporter", label: "🥡 Vente à emporter" },
      { value: "Livraison", label: "🚚 Livraison" },
    ]
  },
  {
    group: "📍 A faire / A voir",
    items: [
      { value: "Parc", label: "🌳 Parcs" },
      { value: "SalleDeSport", label: "🏋️ Salle de sport" },
      { value: "Art", label: "🎨 Art" },
      { value: "Attractions", label: "🎡 Attractions" },
      { value: "VieNocturne", label: "🌙 Vie nocturne" },
      { value: "Concerts", label: "🎵 Concerts" },
      { value: "Cinemas", label: "🎬 Cinémas" },
      { value: "Musees", label: "🏛️ Musées" },
      { value: "Bibliotheques", label: "📚 Bibliothèques" },
      { value: "Skatepark", label: "🛹 skatepark" },
      { value: "Surf", label: "🏄‍♂️ Surf" },
      { value: "Musique", label: "🎵 Musique" },
    ]
  },
  {
    group: "🛍️ Shopping",
    items: [
      { value: "Supermarche", label: "🛒 Supermarché" },
      { value: "Beaute", label: "💅 Beauté" },
      { value: "ConcessAuto", label: "🚗 Concess. auto" },
      { value: "MaisonJardin", label: "🏡 Maison et jardin" },
      { value: "Vetements", label: "👕 Vêtements" },
      { value: "CentresCommerciaux", label: "🏬 Centres commerciaux" },
      { value: "Electronique", label: "🔌 Électronique" },
      { value: "ArticlesSport", label: "🏀 Articles de sport" },
    ]
  },
  {
    group: "🔧 Services",
    items: [
      { value: "Hotels", label: "🏨 Hôtels" },
      { value: "DAB", label: "🏧 DAB" },
      { value: "SalonsBeaute", label: "✂️ Salons de beauté" },
      { value: "LocationVoiture", label: "🚙 Location voiture" },
      { value: "LavageAuto", label: "🧽 Lavage auto" },
      { value: "Pressing", label: "🧺 Pressing" },
      { value: "BornesRecharge", label: "🔌 Bornes de recharge" },
      { value: "Carburant", label: "⛽ Carburant" },
      { value: "Hopitaux", label: "🏥 Hôpitaux et cliniques" },
      { value: "BibliothequesService", label: "📚 Bibliothèques" },
      { value: "EnvoiCourrier", label: "📮 Envoi de courrier" },
      { value: "Parking", label: "🅿️ Parking" },
      { value: "Pharmacies", label: "💊 Pharmacies" },
    ]
  },
];

// Get label for a category value
export const getCategoryLabel = (value) => {
  for (const group of CATEGORIES) {
    const item = group.items.find(i => i.value === value);
    if (item) return item.label;
  }
  return value;
};

// Flatten all categories for quick lookup
export const FLAT_CATEGORIES = CATEGORIES.flatMap(group => group.items);
