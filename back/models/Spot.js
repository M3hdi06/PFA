// Dummy spots data (replaces mongoose schema)
const spots = [
  {
    id: 1,
    nom: "Café du Coin",
    description: "Petit café sympa",
    category: "café",
    location: "Casablanca",
    lat: 33.5731,
    lng: -7.5898,
    rating: 4.5,
    reviews: [
      { userId: 1, comment: "Super endroit !", rating: 5, createdAt: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    nom: "Pizzeria Bella",
    description: "Pizzas délicieuses",
    category: "pizzeria",
    location: "Casablanca",
    lat: 33.5741,
    lng: -7.5908,
    rating: 4.2,
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

module.exports = spots;
