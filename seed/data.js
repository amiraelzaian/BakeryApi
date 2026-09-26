// seed/data.js

const categories = [
  {
    name: "Cakes",
    description: "Freshly baked cakes for birthdays, celebrations, and everyday sweet moments.",
    imageUrl: null,
    imagePublicId: "bakery/categories/cakes",
    isActive: true,
  },
  {
    name: "Pastries",
    description: "Fresh buttery pastries, croissants, danishes, and cinnamon rolls.",
    imageUrl: null,
    imagePublicId: "bakery/categories/pastries",
    isActive: true,
  },
  {
    name: "Bread",
    description: "Freshly baked artisan and everyday breads made throughout the day.",
    imageUrl: null,
    imagePublicId: "bakery/categories/bread",
    isActive: true,
  },
  {
    name: "Cookies",
    description: "Soft and crunchy handmade cookies baked with premium ingredients.",
    imageUrl: null,
    imagePublicId: "bakery/categories/cookies",
    isActive: true,
  },
  {
    name: "Cupcakes",
    description: "Individual cupcakes with delicious flavors and creamy toppings.",
    imageUrl: null,
    imagePublicId: "bakery/categories/cupcakes",
    isActive: true,
  },
  {
    name: "Donuts",
    description: "Freshly made donuts covered with delicious glazes and toppings.",
    imageUrl: null,
    imagePublicId: "bakery/categories/donuts",
    isActive: true,
  },
  {
    name: "Hot Drinks",
    description: "Freshly prepared coffee, chocolate, and other comforting hot drinks.",
    imageUrl: null,
    imagePublicId: "bakery/categories/hot-drinks",
    isActive: true,
  },
  {
    name: "Cold Drinks",
    description: "Refreshing iced coffees, milkshakes, smoothies, and cold beverages.",
    imageUrl: null,
    imagePublicId: "bakery/categories/cold-drinks",
    isActive: true,
  },
];

const products = [
  // =========================
  // CAKES
  // =========================

  {
    name: "Classic Chocolate Cake",
    description:
      "Moist chocolate sponge layered with smooth chocolate cream and finished with chocolate shavings.",
    category: "Cakes",
    price: null,
    sizes: [
      { name: "small", price: 350 },
      { name: "medium", price: 550 },
      { name: "large", price: 750 },
    ],
    stockQuantity: 15,
    imageUrl: null,
    imagePublicId: "bakery/products/classic-chocolate-cake",
  },

  {
    name: "Red Velvet Cake",
    description:
      "Soft red velvet sponge layered with silky cream cheese frosting.",
    category: "Cakes",
    price: null,
    sizes: [
      { name: "small", price: 400 },
      { name: "medium", price: 600 },
      { name: "large", price: 850 },
    ],
    stockQuantity: 12,
    imageUrl: null,
    imagePublicId: "bakery/products/red-velvet-cake",
  },

  {
    name: "Vanilla Berry Cake",
    description:
      "Light vanilla sponge with whipped cream and a selection of fresh berries.",
    category: "Cakes",
    price: null,
    sizes: [
      { name: "small", price: 400 },
      { name: "medium", price: 600 },
      { name: "large", price: 850 },
    ],
    stockQuantity: 10,
    imageUrl: null,
    imagePublicId: "bakery/products/vanilla-berry-cake",
  },

  {
    name: "Lotus Biscoff Cake",
    description:
      "Creamy vanilla cake filled with Biscoff spread and topped with crushed Lotus biscuits.",
    category: "Cakes",
    price: null,
    sizes: [
      { name: "small", price: 450 },
      { name: "medium", price: 650 },
      { name: "large", price: 900 },
    ],
    stockQuantity: 10,
    imageUrl: null,
    imagePublicId: "bakery/products/lotus-biscoff-cake",
  },

  {
    name: "Black Forest Cake",
    description:
      "Chocolate sponge, whipped cream, and cherries finished with chocolate curls.",
    category: "Cakes",
    price: null,
    sizes: [
      { name: "small", price: 420 },
      { name: "medium", price: 620 },
      { name: "large", price: 880 },
    ],
    stockQuantity: 8,
    imageUrl: null,
    imagePublicId: "bakery/products/black-forest-cake",
  },

  {
    name: "Carrot Cake",
    description:
      "Moist spiced carrot cake with walnuts and a creamy cheese frosting.",
    category: "Cakes",
    price: null,
    sizes: [
      { name: "small", price: 380 },
      { name: "medium", price: 580 },
      { name: "large", price: 800 },
    ],
    stockQuantity: 9,
    imageUrl: null,
    imagePublicId: "bakery/products/carrot-cake",
  },

  // =========================
  // PASTRIES
  // =========================

  {
    name: "Butter Croissant",
    description:
      "Classic French-style croissant with crisp flaky layers and a buttery center.",
    category: "Pastries",
    price: 65,
    sizes: [],
    stockQuantity: 40,
    imageUrl: null,
    imagePublicId: "bakery/products/butter-croissant",
  },

  {
    name: "Chocolate Croissant",
    description:
      "Flaky buttery pastry filled with rich chocolate.",
    category: "Pastries",
    price: 80,
    sizes: [],
    stockQuantity: 35,
    imageUrl: null,
    imagePublicId: "bakery/products/chocolate-croissant",
  },

  {
    name: "Cinnamon Roll",
    description:
      "Soft baked cinnamon roll topped with creamy vanilla glaze.",
    category: "Pastries",
    price: 75,
    sizes: [],
    stockQuantity: 30,
    imageUrl: null,
    imagePublicId: "bakery/products/cinnamon-roll",
  },

  {
    name: "Apple Danish",
    description:
      "Flaky Danish pastry filled with cinnamon apples and a light glaze.",
    category: "Pastries",
    price: 70,
    sizes: [],
    stockQuantity: 25,
    imageUrl: null,
    imagePublicId: "bakery/products/apple-danish",
  },

  {
    name: "Cheese Danish",
    description:
      "Golden Danish pastry filled with sweet creamy cheese.",
    category: "Pastries",
    price: 70,
    sizes: [],
    stockQuantity: 25,
    imageUrl: null,
    imagePublicId: "bakery/products/cheese-danish",
  },

  // =========================
  // BREAD
  // =========================

  {
    name: "Sourdough Loaf",
    description:
      "Traditional sourdough loaf with a crisp crust and naturally fermented flavor.",
    category: "Bread",
    price: 120,
    sizes: [],
    stockQuantity: 20,
    imageUrl: null,
    imagePublicId: "bakery/products/sourdough-loaf",
  },

  {
    name: "French Baguette",
    description:
      "Classic French baguette with a crisp crust and airy interior.",
    category: "Bread",
    price: 65,
    sizes: [],
    stockQuantity: 30,
    imageUrl: null,
    imagePublicId: "bakery/products/french-baguette",
  },

  {
    name: "Brioche Bread",
    description:
      "Soft and rich buttery brioche loaf with a delicate golden crust.",
    category: "Bread",
    price: 110,
    sizes: [],
    stockQuantity: 20,
    imageUrl: null,
    imagePublicId: "bakery/products/brioche-bread",
  },

  {
    name: "Multigrain Bread",
    description:
      "Nutritious bread made with a blend of grains and seeds.",
    category: "Bread",
    price: 95,
    sizes: [],
    stockQuantity: 18,
    imageUrl: null,
    imagePublicId: "bakery/products/multigrain-bread",
  },

  // =========================
  // COOKIES
  // =========================

  {
    name: "Chocolate Chip Cookies",
    description:
      "Soft-centered cookies packed with semi-sweet chocolate chips.",
    category: "Cookies",
    price: 90,
    sizes: [],
    stockQuantity: 50,
    imageUrl: null,
    imagePublicId: "bakery/products/chocolate-chip-cookies",
  },

  {
    name: "Double Chocolate Cookies",
    description:
      "Rich chocolate cookies loaded with dark and milk chocolate chunks.",
    category: "Cookies",
    price: 100,
    sizes: [],
    stockQuantity: 45,
    imageUrl: null,
    imagePublicId: "bakery/products/double-chocolate-cookies",
  },

  {
    name: "Red Velvet Cookies",
    description:
      "Soft red velvet cookies with white chocolate chunks.",
    category: "Cookies",
    price: 100,
    sizes: [],
    stockQuantity: 35,
    imageUrl: null,
    imagePublicId: "bakery/products/red-velvet-cookies",
  },

  {
    name: "Oatmeal Raisin Cookies",
    description:
      "Chewy oatmeal cookies with sweet raisins and warm cinnamon.",
    category: "Cookies",
    price: 85,
    sizes: [],
    stockQuantity: 40,
    imageUrl: null,
    imagePublicId: "bakery/products/oatmeal-raisin-cookies",
  },

  // =========================
  // CUPCAKES
  // =========================

  {
    name: "Chocolate Cupcake",
    description:
      "Moist chocolate cupcake topped with chocolate buttercream.",
    category: "Cupcakes",
    price: 60,
    sizes: [],
    stockQuantity: 40,
    imageUrl: null,
    imagePublicId: "bakery/products/chocolate-cupcake",
  },

  {
    name: "Vanilla Cupcake",
    description:
      "Light vanilla cupcake topped with smooth vanilla frosting.",
    category: "Cupcakes",
    price: 55,
    sizes: [],
    stockQuantity: 40,
    imageUrl: null,
    imagePublicId: "bakery/products/vanilla-cupcake",
  },

  {
    name: "Red Velvet Cupcake",
    description:
      "Classic red velvet cupcake with creamy cheese frosting.",
    category: "Cupcakes",
    price: 65,
    sizes: [],
    stockQuantity: 35,
    imageUrl: null,
    imagePublicId: "bakery/products/red-velvet-cupcake",
  },

  {
    name: "Lotus Cupcake",
    description:
      "Vanilla cupcake topped with Biscoff cream and biscuit crumbs.",
    category: "Cupcakes",
    price: 70,
    sizes: [],
    stockQuantity: 30,
    imageUrl: null,
    imagePublicId: "bakery/products/lotus-cupcake",
  },

  // =========================
  // DONUTS
  // =========================

  {
    name: "Glazed Donut",
    description:
      "Soft fluffy donut covered with a classic sweet glaze.",
    category: "Donuts",
    price: 45,
    sizes: [],
    stockQuantity: 50,
    imageUrl: null,
    imagePublicId: "bakery/products/glazed-donut",
  },

  {
    name: "Chocolate Donut",
    description:
      "Fresh donut covered with chocolate glaze and chocolate sprinkles.",
    category: "Donuts",
    price: 50,
    sizes: [],
    stockQuantity: 45,
    imageUrl: null,
    imagePublicId: "bakery/products/chocolate-donut",
  },

  {
    name: "Strawberry Donut",
    description:
      "Soft donut topped with strawberry glaze and colorful sprinkles.",
    category: "Donuts",
    price: 55,
    sizes: [],
    stockQuantity: 35,
    imageUrl: null,
    imagePublicId: "bakery/products/strawberry-donut",
  },

  {
    name: "Lotus Donut",
    description:
      "Soft donut filled and topped with creamy Biscoff spread.",
    category: "Donuts",
    price: 65,
    sizes: [],
    stockQuantity: 30,
    imageUrl: null,
    imagePublicId: "bakery/products/lotus-donut",
  },

  // =========================
  // HOT DRINKS
  // =========================

  {
    name: "Espresso",
    description: "Rich and intense freshly brewed espresso.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 55 },
      { name: "medium", price: 65 },
      { name: "large", price: 75 },
    ],
    stockQuantity: 100,
    imageUrl: null,
    imagePublicId: "bakery/products/espresso",
  },

  {
    name: "Americano",
    description: "Smooth espresso combined with hot water.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 60 },
      { name: "medium", price: 70 },
      { name: "large", price: 80 },
    ],
    stockQuantity: 100,
    imageUrl: null,
    imagePublicId: "bakery/products/americano",
  },

  {
    name: "Cappuccino",
    description:
      "Espresso topped with steamed milk and a generous layer of milk foam.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 75 },
      { name: "medium", price: 90 },
      { name: "large", price: 105 },
    ],
    stockQuantity: 80,
    imageUrl: null,
    imagePublicId: "bakery/products/cappuccino",
  },

  {
    name: "Latte",
    description:
      "Smooth espresso blended with steamed milk and light foam.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 75 },
      { name: "medium", price: 90 },
      { name: "large", price: 105 },
    ],
    stockQuantity: 80,
    imageUrl: null,
    imagePublicId: "bakery/products/latte",
  },

  {
    name: "Spanish Latte",
    description:
      "Creamy espresso drink sweetened with condensed milk.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 85 },
      { name: "medium", price: 100 },
      { name: "large", price: 115 },
    ],
    stockQuantity: 75,
    imageUrl: null,
    imagePublicId: "bakery/products/spanish-latte",
  },

  {
    name: "Mocha",
    description:
      "Espresso combined with chocolate and steamed milk.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 80 },
      { name: "medium", price: 95 },
      { name: "large", price: 110 },
    ],
    stockQuantity: 70,
    imageUrl: null,
    imagePublicId: "bakery/products/mocha",
  },

  {
    name: "Hot Chocolate",
    description:
      "Rich creamy hot chocolate topped with a light layer of foam.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 70 },
      { name: "medium", price: 85 },
      { name: "large", price: 100 },
    ],
    stockQuantity: 70,
    imageUrl: null,
    imagePublicId: "bakery/products/hot-chocolate",
  },

  {
    name: "Chai Latte",
    description:
      "Warm spiced tea blended with steamed milk.",
    category: "Hot Drinks",
    price: null,
    sizes: [
      { name: "small", price: 75 },
      { name: "medium", price: 90 },
      { name: "large", price: 105 },
    ],
    stockQuantity: 60,
    imageUrl: null,
    imagePublicId: "bakery/products/chai-latte",
  },

  {
    name: "Turkish Coffee",
    description:
      "Traditional strong Turkish coffee prepared with finely ground coffee.",
    category: "Hot Drinks",
    price: 60,
    sizes: [],
    stockQuantity: 60,
    imageUrl: null,
    imagePublicId: "bakery/products/turkish-coffee",
  },

  // =========================
  // COLD DRINKS
  // =========================

  {
    name: "Iced Americano",
    description:
      "Chilled espresso served over ice with cold water.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 70 },
      { name: "medium", price: 85 },
      { name: "large", price: 100 },
    ],
    stockQuantity: 80,
    imageUrl: null,
    imagePublicId: "bakery/products/iced-americano",
  },

  {
    name: "Iced Latte",
    description:
      "Smooth espresso and cold milk served over ice.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 80 },
      { name: "medium", price: 95 },
      { name: "large", price: 110 },
    ],
    stockQuantity: 80,
    imageUrl: null,
    imagePublicId: "bakery/products/iced-latte",
  },

  {
    name: "Iced Spanish Latte",
    description:
      "Espresso, cold milk, and sweet condensed milk served over ice.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 90 },
      { name: "medium", price: 110 },
      { name: "large", price: 130 },
    ],
    stockQuantity: 75,
    imageUrl: null,
    imagePublicId: "bakery/products/iced-spanish-latte",
  },

  {
    name: "Iced Mocha",
    description:
      "Chilled espresso mixed with chocolate and milk over ice.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 85 },
      { name: "medium", price: 100 },
      { name: "large", price: 115 },
    ],
    stockQuantity: 70,
    imageUrl: null,
    imagePublicId: "bakery/products/iced-mocha",
  },

  {
    name: "Iced Caramel Latte",
    description:
      "Cold espresso and milk finished with sweet caramel flavor.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 90 },
      { name: "medium", price: 105 },
      { name: "large", price: 120 },
    ],
    stockQuantity: 70,
    imageUrl: null,
    imagePublicId: "bakery/products/iced-caramel-latte",
  },

  {
    name: "Cold Brew",
    description:
      "Smooth coffee slowly brewed cold for a naturally rich flavor.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 80 },
      { name: "medium", price: 95 },
      { name: "large", price: 110 },
    ],
    stockQuantity: 60,
    imageUrl: null,
    imagePublicId: "bakery/products/cold-brew",
  },

  {
    name: "Strawberry Milkshake",
    description:
      "Creamy strawberry milkshake topped with whipped cream.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 100 },
      { name: "medium", price: 120 },
      { name: "large", price: 140 },
    ],
    stockQuantity: 50,
    imageUrl: null,
    imagePublicId: "bakery/products/strawberry-milkshake",
  },

  {
    name: "Chocolate Milkshake",
    description:
      "Thick creamy chocolate milkshake topped with whipped cream.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 100 },
      { name: "medium", price: 120 },
      { name: "large", price: 140 },
    ],
    stockQuantity: 50,
    imageUrl: null,
    imagePublicId: "bakery/products/chocolate-milkshake",
  },

  {
    name: "Vanilla Milkshake",
    description:
      "Classic creamy vanilla milkshake with whipped cream.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 95 },
      { name: "medium", price: 115 },
      { name: "large", price: 135 },
    ],
    stockQuantity: 50,
    imageUrl: null,
    imagePublicId: "bakery/products/vanilla-milkshake",
  },

  {
    name: "Mango Smoothie",
    description:
      "Refreshing smoothie made with ripe mango and creamy yogurt.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 95 },
      { name: "medium", price: 115 },
      { name: "large", price: 135 },
    ],
    stockQuantity: 45,
    imageUrl: null,
    imagePublicId: "bakery/products/mango-smoothie",
  },

  {
    name: "Strawberry Smoothie",
    description:
      "Fresh strawberry smoothie blended until perfectly creamy.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 95 },
      { name: "medium", price: 115 },
      { name: "large", price: 135 },
    ],
    stockQuantity: 45,
    imageUrl: null,
    imagePublicId: "bakery/products/strawberry-smoothie",
  },

  {
    name: "Iced Tea",
    description:
      "Refreshing chilled black tea served over ice.",
    category: "Cold Drinks",
    price: null,
    sizes: [
      { name: "small", price: 55 },
      { name: "medium", price: 70 },
      { name: "large", price: 85 },
    ],
    stockQuantity: 60,
    imageUrl: null,
    imagePublicId: "bakery/products/iced-tea",
  },
];

const coupons = [
  {
    name: "WELCOME10",
    expire: new Date("2027-12-31T23:59:59.000Z"),
    discount: 10,
  },
  {
    name: "SWEET15",
    expire: new Date("2027-06-30T23:59:59.000Z"),
    discount: 15,
  },
  {
    name: "WEEKEND20",
    expire: new Date("2027-12-31T23:59:59.000Z"),
    discount: 20,
  },
];

const seasonalOffers = [
  {
    name: "Chocolate Lovers",
    description:
      "Enjoy 25% off selected chocolate cakes, cupcakes, cookies, and drinks.",
    discountPercentage: 25,
    startDate: new Date("2026-09-01T00:00:00.000Z"),
    endDate: new Date("2026-10-15T23:59:59.000Z"),
    productNames: [
      "Classic Chocolate Cake",
      "Double Chocolate Cookies",
      "Chocolate Cupcake",
      "Chocolate Donut",
      "Mocha",
      "Hot Chocolate",
      "Chocolate Milkshake",
    ],
    categoryName: null,
    bannerImage: null,
    isActive: true,
  },

  {
    name: "Coffee & Croissant",
    description:
      "A special 15% discount on selected coffee and pastry favorites.",
    discountPercentage: 15,
    startDate: new Date("2026-09-01T00:00:00.000Z"),
    endDate: new Date("2026-11-30T23:59:59.000Z"),
    productNames: [
      "Butter Croissant",
      "Chocolate Croissant",
      "Cinnamon Roll",
      "Cappuccino",
      "Latte",
      "Spanish Latte",
      "Iced Latte",
    ],
    categoryName: null,
    bannerImage: null,
    isActive: true,
  },

  {
    name: "Weekend Sweet Deal",
    description:
      "Save 20% on our most-loved sweet treats.",
    discountPercentage: 20,
    startDate: new Date("2026-09-01T00:00:00.000Z"),
    endDate: new Date("2026-12-31T23:59:59.000Z"),
    productNames: [
      "Lotus Biscoff Cake",
      "Red Velvet Cake",
      "Lotus Cupcake",
      "Lotus Donut",
      "Strawberry Milkshake",
    ],
    categoryName: null,
    bannerImage: null,
    isActive: true,
  },
];

const users = [
  {
    name: "Bakery Admin",
    email: "admin@skumjehbakery.com",
    password: "Admin123456",
    provider: "local",
    role: "admin",
    phone: "01000000001",
    address: {
      governorate: "Alexandria",
      city: "Alexandria",
      street: "Bakery Street",
      zipCode: "21500",
    },
  },

  {
    name: "Ahmed Baker",
    email: "baker@skumjehbakery.com",
    password: "Baker123456",
    provider: "local",
    role: "baker",
    phone: "01000000002",
  },

  {
    name: "Omar Delivery",
    email: "delivery@skumjehbakery.com",
    password: "Delivery123456",
    provider: "local",
    role: "delivery",
    phone: "01000000003",
  },

  {
    name: "Mariam Hassan",
    email: "mariam@example.com",
    password: "Customer123456",
    provider: "local",
    role: "customer",
    phone: "01000000011",
    address: {
      governorate: "Alexandria",
      city: "Smouha",
      street: "Fictional Street 12",
      zipCode: "21648",
    },
  },

  {
    name: "Youssef Ali",
    email: "youssef@example.com",
    password: "Customer123456",
    provider: "local",
    role: "customer",
    phone: "01000000012",
    address: {
      governorate: "Alexandria",
      city: "Miami",
      street: "Fictional Street 8",
      zipCode: "21611",
    },
  },

  {
    name: "Nour Ahmed",
    email: "nour@example.com",
    password: "Customer123456",
    provider: "local",
    role: "customer",
    phone: "01000000013",
    address: {
      governorate: "Alexandria",
      city: "Gleem",
      street: "Fictional Street 21",
      zipCode: "21532",
    },
  },

  {
    name: "Karim Mostafa",
    email: "karim@example.com",
    password: "Customer123456",
    provider: "local",
    role: "customer",
    phone: "01000000014",
    address: {
      governorate: "Alexandria",
      city: "Stanley",
      street: "Fictional Street 5",
      zipCode: "21500",
    },
  },

  {
    name: "Salma Adel",
    email: "salma@example.com",
    password: "Customer123456",
    provider: "local",
    role: "customer",
    phone: "01000000015",
    address: {
      governorate: "Alexandria",
      city: "Sidi Gaber",
      street: "Fictional Street 17",
      zipCode: "21523",
    },
  },
];

const reviews = [
  {
    userEmail: "mariam@example.com",
    productName: "Classic Chocolate Cake",
    rating: 5,
    comment: "The cake was incredibly soft and the chocolate flavor was perfect.",
  },
  {
    userEmail: "youssef@example.com",
    productName: "Butter Croissant",
    rating: 5,
    comment: "Very flaky and buttery. One of the best croissants I've had.",
  },
  {
    userEmail: "nour@example.com",
    productName: "Iced Spanish Latte",
    rating: 5,
    comment: "Creamy, smooth, and not too sweet. Loved it.",
  },
  {
    userEmail: "karim@example.com",
    productName: "Lotus Biscoff Cake",
    rating: 4,
    comment: "Really good cake and the Lotus topping was delicious.",
  },
  {
    userEmail: "salma@example.com",
    productName: "Red Velvet Cupcake",
    rating: 5,
    comment: "The frosting was so creamy and the cupcake was very fresh.",
  },
  {
    userEmail: "mariam@example.com",
    productName: "Chocolate Milkshake",
    rating: 4,
    comment: "Very rich chocolate flavor and a generous size.",
  },
  {
    userEmail: "youssef@example.com",
    productName: "Cinnamon Roll",
    rating: 5,
    comment: "Soft, warm, and perfectly sweet.",
  },
  {
    userEmail: "nour@example.com",
    productName: "Sourdough Loaf",
    rating: 5,
    comment: "Great crust and a really nice sourdough flavor.",
  },
];

module.exports = {
  categories,
  products,
  coupons,
  seasonalOffers,
  users,
  reviews,
};
// data seeder