// constants/index.ts
import type { Category, Subcategory, Product, Company } from '../types';

// -----------------------------------------------------------------------------
// MOCK API DATA – Categories
// -----------------------------------------------------------------------------
const apiCategories = [
  { id: 1, name: "Consumption Products", name_am: "የፍጆታ ምርቶች", slug: "consumption-products", code: "1", icon: null, order: 1, is_active: true, company_count: 14 },
  { id: 2, name: "Cloth and Garment", name_am: "ልብስና ጨርቃጨርቅ", slug: "cloth-garment", code: "2", icon: null, order: 2, is_active: true, company_count: 4 },
  { id: 3, name: "Education and Media", name_am: "ትምህርትና ሚዲያ", slug: "education-media", code: "3", icon: null, order: 3, is_active: true, company_count: 8 },
  { id: 4, name: "Furniture and Construction", name_am: "ቤትና ህንጻ", slug: "furniture-construction", code: "4", icon: null, order: 4, is_active: true, company_count: 5 },
  { id: 5, name: "Agro", name_am: "አግሮ", slug: "agro", code: "5", icon: null, order: 5, is_active: true, company_count: 4 },
  { id: 6, name: "Health and Transport", name_am: "ጤናና ትራንስፖርት", slug: "health-transport", code: "6", icon: null, order: 6, is_active: true, company_count: 3 }
];

// -----------------------------------------------------------------------------
// MOCK API DATA – Subcategories
// -----------------------------------------------------------------------------
const apiSubcategories = [
  { id: 1, category: 1, name: "Grain", name_am: "እህል", slug: "grain", item_code: "1", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 2, category: 1, name: "Food", name_am: "ምግብ", slug: "food", item_code: "2", description: "", icon: null, order: 0, is_active: true, company_count: 7 },
  { id: 3, category: 1, name: "Flour", name_am: "ዱቄት", slug: "flour", item_code: "3", description: "", icon: null, order: 0, is_active: true, company_count: 2 },
  { id: 4, category: 1, name: "Balitina", name_am: "ባልትና", slug: "balitina", item_code: "4", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 5, category: 1, name: "Cleaning", name_am: "ጽዳት", slug: "cleaning", item_code: "5", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 6, category: 1, name: "Supermarket", name_am: "ሱፐርማርኬት", slug: "supermarket", item_code: "6", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 7, category: 1, name: "Fruit & Vegetable", name_am: "አትክልትና ፍራፍሬ", slug: "fruit-vegetable", item_code: "7", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 8, category: 2, name: "Leather Products", name_am: "የቆዳ ውጤቶች", slug: "leather-products", item_code: "8", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 9, category: 2, name: "Garment", name_am: "ጋርመንት", slug: "garment", item_code: "9", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 10, category: 2, name: "Traditional Cloth", name_am: "ባህላዊ ልብስ", slug: "traditional-cloth", item_code: "10", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 11, category: 3, name: "Media", name_am: "ሚዲያ", slug: "media", item_code: "11", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 12, category: 3, name: "Stationary", name_am: "ስቴሽናሪ", slug: "stationary", item_code: "12", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 13, category: 3, name: "Printing", name_am: "ህትመት", slug: "printing", item_code: "13", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 14, category: 3, name: "Education", name_am: "ትምህርት", slug: "education", item_code: "14", description: "", icon: null, order: 0, is_active: true, company_count: 2 },
  { id: 15, category: 3, name: "Kids", name_am: "ህጻናት", slug: "kids", item_code: "15", description: "", icon: null, order: 0, is_active: true, company_count: 2 },
  { id: 16, category: 4, name: "Furniture", name_am: "ፈርኒቸር", slug: "furniture", item_code: "16", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 17, category: 4, name: "Construction", name_am: "ህንጻ", slug: "construction", item_code: "17", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 18, category: 4, name: "Engineering", name_am: "ኢንጂነሪንግ", slug: "engineering", item_code: "18", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 19, category: 5, name: "Animal", name_am: "እንስሳት", slug: "animal", item_code: "19", description: "", icon: null, order: 0, is_active: true, company_count: 3 },
  { id: 20, category: 5, name: "Dairy", name_am: "ወተት", slug: "dairy", item_code: "20", description: "", icon: null, order: 0, is_active: true, company_count: 1 },
  { id: 21, category: 6, name: "Health", name_am: "ጤና", slug: "health", item_code: "21", description: "", icon: null, order: 0, is_active: true, company_count: 2 },
  { id: 22, category: 6, name: "Transport", name_am: "ትራንስፖርት", slug: "transport", item_code: "22", description: "", icon: null, order: 0, is_active: true, company_count: 1 }
];

// -----------------------------------------------------------------------------
// MOCK API DATA – Companies (all 38 companies from your data)
// -----------------------------------------------------------------------------
const apiCompanies = [
  { id: 1, name: "Semhan Grain Trade", name_am: "ሰምሐን እህል ንግድ", slug: "semhan-grain-trade", logo: null, category: 1, category_name: "Consumption Products", sub_category: 1, sub_category_name: "Grain", business_type: "brand", is_active: true, is_featured: false },
  { id: 2, name: "Mati Bakery and Cake", name_am: "ማቲ ዳቦና ኬከ", slug: "mati-bakery-cake", logo: null, category: 1, category_name: "Consumption Products", sub_category: 2, sub_category_name: "Food", business_type: "brand", is_active: true, is_featured: false },
  { id: 3, name: "Ancif Food and Drink", name_am: "አንሲፍ ምግብና መጠጥ", slug: "ancif-food-drink", logo: null, category: 1, category_name: "Consumption Products", sub_category: 2, sub_category_name: "Food", business_type: "brand", is_active: true, is_featured: false },
  { id: 4, name: "Ancif Coffee", name_am: "አንሲፍ ቡና", slug: "ancif-coffee", logo: null, category: 1, category_name: "Consumption Products", sub_category: 2, sub_category_name: "Food", business_type: "brand", is_active: true, is_featured: false },
  { id: 5, name: "Kers Injera Production", name_am: "ቅርስ እንጀራ ማምረቻ", slug: "kers-injera-production", logo: null, category: 1, category_name: "Consumption Products", sub_category: 2, sub_category_name: "Food", business_type: "brand", is_active: true, is_featured: false },
  { id: 6, name: "Mena Cafe and Restaurant", name_am: "መና ካፌና ራስቶራንት", slug: "mena-cafe-restaurant", logo: null, category: 1, category_name: "Consumption Products", sub_category: 2, sub_category_name: "Food", business_type: "store", is_active: true, is_featured: false },
  { id: 7, name: "Tiyash Honey", name_am: "ጢያሽ ማር", slug: "tiyash-honey", logo: null, category: 1, category_name: "Consumption Products", sub_category: 2, sub_category_name: "Food", business_type: "brand", is_active: true, is_featured: false },
  { id: 8, name: "Silvas Oil Production", name_am: "ሲልቫስ ዘይት ማምረቻ", slug: "silvas-oil-production", logo: null, category: 1, category_name: "Consumption Products", sub_category: 2, sub_category_name: "Food", business_type: "factory", is_active: true, is_featured: false },
  { id: 9, name: "Hawlet Flour Production", name_am: "ሐውለት ዱቄት ማምረቻ", slug: "hawlet-flour-production", logo: null, category: 1, category_name: "Consumption Products", sub_category: 3, sub_category_name: "Flour", business_type: "brand", is_active: true, is_featured: false },
  { id: 10, name: "Alfia Flour Factory", name_am: "አልፍያ የዱቄት ፋብሪካ", slug: "alfia-flour-factory", logo: null, category: 1, category_name: "Consumption Products", sub_category: 3, sub_category_name: "Flour", business_type: "brand", is_active: true, is_featured: false },
  { id: 11, name: "Feqis Balitina and Chimta Spice", name_am: "ፈቅስ ባልትናና ቅምጣ ቅመም", slug: "feqis-balitina-chimta-spice", logo: null, category: 1, category_name: "Consumption Products", sub_category: 4, sub_category_name: "Balitina", business_type: "brand", is_active: true, is_featured: false },
  { id: 12, name: "Femona Soap and Detergent", name_am: "ፈሞና የሳሙናና ዲትረጅንት አምራች", slug: "femona-soap-detergent", logo: null, category: 1, category_name: "Consumption Products", sub_category: 5, sub_category_name: "Cleaning", business_type: "brand", is_active: true, is_featured: false },
  { id: 13, name: "Yason Consumption Product Trade", name_am: "ያሲን የፍጆታ ምርት ንግድ", slug: "yason-consumption-product-trade", logo: null, category: 1, category_name: "Consumption Products", sub_category: 6, sub_category_name: "Supermarket", business_type: "store", is_active: true, is_featured: false },
  { id: 14, name: "Halus Fruit and Vegetable", name_am: "ሃሉስ አትክልትና ፍራፍሬ", slug: "halus-fruit-vegetable", logo: null, category: 1, category_name: "Consumption Products", sub_category: 7, sub_category_name: "Fruit & Vegetable", business_type: "store", is_active: true, is_featured: false },
  { id: 15, name: "Mahber Leather and Leather Products", name_am: "ማህበር ቆዳ እና የቆዳ ውጤቶች", slug: "mahber-leather-leather-products", logo: null, category: 2, category_name: "Cloth and Garment", sub_category: 8, sub_category_name: "Leather Products", business_type: "brand", is_active: true, is_featured: false },
  { id: 16, name: "Kidusi Garment", name_am: "ቅዱስ ጋርመንት", slug: "kidusi-garment", logo: null, category: 2, category_name: "Cloth and Garment", sub_category: 9, sub_category_name: "Garment", business_type: "brand", is_active: true, is_featured: false },
  { id: 17, name: "Kobros Traditional Cloth and Tailoring", name_am: "ኮብሮስ የባህል ልብስ እና ስፌት", slug: "kobros-traditional-cloth-tailoring", logo: null, category: 2, category_name: "Cloth and Garment", sub_category: 10, sub_category_name: "Traditional Cloth", business_type: "brand", is_active: true, is_featured: false },
  { id: 18, name: "Meqdem Photo Studio and Event Organizer", name_am: "መቅድም ፎቶ ስቴዲዮና ኩነት አቀናጅ", slug: "meqdem-photo-studio-event-organizer", logo: null, category: 3, category_name: "Education and Media", sub_category: 11, sub_category_name: "Media", business_type: "brand", is_active: true, is_featured: false },
  { id: 19, name: "Admas Stationery and Paper Product", name_am: "አድማስ እስቴሽናሪ እና የወረቀት ምርት", slug: "admas-stationery-paper-product", logo: null, category: 3, category_name: "Education and Media", sub_category: 12, sub_category_name: "Stationary", business_type: "store", is_active: true, is_featured: false },
  { id: 20, name: "Lomins Printing Service", name_am: "ሎሚንስ የህትመት አገልግሎት", slug: "lomins-printing-service", logo: null, category: 3, category_name: "Education and Media", sub_category: 13, sub_category_name: "Printing", business_type: "service", is_active: true, is_featured: false },
  { id: 21, name: "Agabas School", name_am: "አጋባስ ትምህርት ቤት", slug: "agabas-school", logo: null, category: 3, category_name: "Education and Media", sub_category: 14, sub_category_name: "Education", business_type: "service", is_active: true, is_featured: false },
  { id: 22, name: "Phanos Education and Training", name_am: "ፋኖስ ትምህርትና ስልጠና", slug: "phanos-education-training", logo: null, category: 3, category_name: "Education and Media", sub_category: 14, sub_category_name: "Education", business_type: "brand", is_active: true, is_featured: false },
  { id: 23, name: "Iglass School", name_am: "ኢግላስ ትምህርት ቤት", slug: "iglass-school", logo: null, category: 3, category_name: "Education and Media", sub_category: 14, sub_category_name: "Education", business_type: "service", is_active: true, is_featured: false },
  { id: 24, name: "Selome Kids Care", name_am: "ሰሎሜ የህጻናት እንክብካቤ", slug: "selome-kids-care", logo: null, category: 3, category_name: "Education and Media", sub_category: 15, sub_category_name: "Kids", business_type: "service", is_active: true, is_featured: false },
  { id: 25, name: "Merlo Multipurpose Kids Entertainment", name_am: "መርሎ ሁለገብ የህጻናት መዝናኛ", slug: "merlo-multipurpose-kids-entertainment", logo: null, category: 3, category_name: "Education and Media", sub_category: 15, sub_category_name: "Kids", business_type: "brand", is_active: true, is_featured: false },
  { id: 26, name: "Bayos Woodwork", name_am: "ባዮስ የእንጨት ስራ", slug: "bayos-woodwork", logo: null, category: 4, category_name: "Furniture and Construction", sub_category: 16, sub_category_name: "Furniture", business_type: "brand", is_active: true, is_featured: false },
  { id: 27, name: "Belos Construction Contractor", name_am: "በሎስ ሆንጻ ተቋራጭ", slug: "belos-construction-contractor", logo: null, category: 4, category_name: "Furniture and Construction", sub_category: 16, sub_category_name: "Furniture", business_type: "service", is_active: true, is_featured: false },
  { id: 28, name: "Enayanos Construction Supplies", name_am: "እናያኖስ የግምባታ እቃዎች አቅርቦት", slug: "enayanos-construction-supplies", logo: null, category: 4, category_name: "Furniture and Construction", sub_category: 17, sub_category_name: "Construction", business_type: "store", is_active: true, is_featured: false },
  { id: 29, name: "Mayas Block Production", name_am: "ማያስ ብሎኬት ማምረቻ", slug: "mayas-block-production", logo: null, category: 4, category_name: "Furniture and Construction", sub_category: 17, sub_category_name: "Construction", business_type: "brand", is_active: true, is_featured: false },
  { id: 30, name: "Tito Engineering", name_am: "ቲቶ ኢንጂነሪንግ", slug: "tito-engineering", logo: null, category: 4, category_name: "Furniture and Construction", sub_category: 18, sub_category_name: "Engineering", business_type: "service", is_active: true, is_featured: false },
  { id: 31, name: "Nikos Animal Feed Processing", name_am: "ኒቆስ የእንሣት መኖ ማቀነባበሪያ", slug: "nikos-animal-feed-processing", logo: null, category: 5, category_name: "Agro", sub_category: 19, sub_category_name: "Animal", business_type: "brand", is_active: true, is_featured: false },
  { id: 32, name: "Edios Livestock Breeding", name_am: "ኤዲዎስ የቁም እንስሳት ማደለብ", slug: "edios-livestock-breeding", logo: null, category: 5, category_name: "Agro", sub_category: 19, sub_category_name: "Animal", business_type: "store", is_active: true, is_featured: false },
  { id: 33, name: "Hudasef Poultry and Egg Product", name_am: "ሁዳሴፍ የስጋ ዶሮና እንቀላል ምርት", slug: "hudasef-poultry-egg-product", logo: null, category: 5, category_name: "Agro", sub_category: 19, sub_category_name: "Animal", business_type: "store", is_active: true, is_featured: false },
  { id: 34, name: "Haqyos Dairy and Dairy Products Processing", name_am: "ሃቅዮስ የወተትና ወተት ውጤቶች ማቀነባበሪያ", slug: "haqyos-dairy-dairy-products-processing", logo: null, category: 5, category_name: "Agro", sub_category: 20, sub_category_name: "Dairy", business_type: "brand", is_active: true, is_featured: false },
  { id: 35, name: "Elenos Health Diagnostic Center", name_am: "ኤሌኖስ የጤና ምርመራ ማዕከል", slug: "elenos-health-diagnostic-center", logo: null, category: 6, category_name: "Health and Transport", sub_category: 21, sub_category_name: "Health", business_type: "service", is_active: true, is_featured: false },
  { id: 36, name: "Yolyan Medicine and Medical Equipment", name_am: "ዮልያን የመድጋኒትና የሕክምና መሳሪያዎች አስመጪ እና አከፋፋይ", slug: "yolyan-medicine-medical-equipment", logo: null, category: 6, category_name: "Health and Transport", sub_category: 21, sub_category_name: "Health", business_type: "store", is_active: true, is_featured: false },
  { id: 37, name: "Kolya Medicine and Medical Equipment", name_am: "ኮልያ መድሃኒትና የህክምና መሳሪያዎች አስመጪ እና አከፋፋይ", slug: "kolya-medicine-medical-equipment", logo: null, category: 6, category_name: "Health and Transport", sub_category: 21, sub_category_name: "Health", business_type: "store", is_active: true, is_featured: false },
  { id: 38, name: "Hafifi Transport and Logistics", name_am: "ሐፊፊ ትራንስፖርትና ሎጅስቲክስ", slug: "hafifi-transport-logistics", logo: null, category: 6, category_name: "Health and Transport", sub_category: 22, sub_category_name: "Transport", business_type: "service", is_active: true, is_featured: false }
];

// -----------------------------------------------------------------------------
// Helper to generate products for a company (same as before but with API fields)
// -----------------------------------------------------------------------------
interface CompanyWithPath extends Company {
  categoryId: number;
  categoryName: string;
  subcategoryId: number;
  subcategoryName: string;
}

const generateProductsForCompany = (company: CompanyWithPath): Product[] => {
  const productCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 products
  const products: Product[] = [];
  const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  for (let i = 0; i < productCount; i++) {
    products.push({
      id: `${company.id}_p${i}`,
      name: `${company.name} ${['Deluxe', 'Premium', 'Standard', 'Basic', 'Pro'][i % 5]}`,
      price: Math.floor(Math.random() * 800) + 100,
      image: company.logo || `https://picsum.photos/id/${Math.floor(Math.random() * 50) + 100}/400/400`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      type: company.business_type, // use business_type
      description: `High-quality ${company.name} product.`,
      colors: colors.slice(0, Math.floor(Math.random() * 3) + 1),
      sizes: sizes.slice(0, Math.floor(Math.random() * 4) + 1),
      images: [
        company.logo || `https://picsum.photos/id/${Math.floor(Math.random() * 50) + 100}/400/400`,
        `https://picsum.photos/id/${Math.floor(Math.random() * 50) + 200}/400/400`,
        `https://picsum.photos/id/${Math.floor(Math.random() * 50) + 300}/400/400`,
      ],
      companyId: String(company.id),
      companyName: company.name,
      categoryId: company.categoryId,
      category: company.categoryName,
      subcategoryId: String(company.subcategoryId),
      subcategory: company.subcategoryName,
    });
  }
  return products;
};

// -----------------------------------------------------------------------------
// Build nested categories and subcategories
// -----------------------------------------------------------------------------
export const categories: Category[] = apiCategories.map(cat => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon || 'default-icon', // fallback
  image: `https://picsum.photos/id/${cat.id * 10}/200/200`, // placeholder image
  subcategories: apiSubcategories
    .filter(sub => sub.category === cat.id)
    .map(sub => ({
      id: String(sub.id),
      name: sub.name,
      items: apiCompanies
        .filter(comp => comp.sub_category === sub.id)
        .map(comp => ({
          id: String(comp.id),
          name: comp.name,
          type: comp.business_type, // map to type
          image: comp.logo || `https://picsum.photos/id/${comp.id}/200/200`,
          description: `Leading provider of ${cat.name} products.`,
        })),
    })),
}));

// -----------------------------------------------------------------------------
// Flatten companies with full path
// -----------------------------------------------------------------------------
const companiesWithPath: CompanyWithPath[] = apiCompanies.map(comp => ({
  id: String(comp.id),
  name: comp.name,
  type: comp.business_type,
  image: comp.logo || `https://picsum.photos/id/${comp.id}/200/200`,
  description: `Leading provider of ${comp.category_name} products.`,
  categoryId: comp.category,
  categoryName: comp.category_name,
  subcategoryId: comp.sub_category,
  subcategoryName: comp.sub_category_name,
  business_type: comp.business_type,
}));

// -----------------------------------------------------------------------------
// Generate all products
// -----------------------------------------------------------------------------
export const allProducts: Product[] = companiesWithPath.flatMap(company =>
  generateProductsForCompany(company)
);

// -----------------------------------------------------------------------------
// Export all companies
// -----------------------------------------------------------------------------
export const allCompanies: CompanyWithPath[] = companiesWithPath;

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------
export const getSubcategoriesByCategoryId = (categoryId: number): Subcategory[] => {
  const category = categories.find(c => c.id === categoryId);
  return category?.subcategories || [];
};

export const getProductsBySubcategoryId = (subcategoryId: string): Product[] => {
  return allProducts.filter(p => p.subcategoryId === subcategoryId);
};

export const getProductsByCategoryId = (categoryId: number): Product[] => {
  return allProducts.filter(p => p.categoryId === categoryId);
};

// -----------------------------------------------------------------------------
// Extract unique business types (for tabs)
// -----------------------------------------------------------------------------
const allTypes = new Set(companiesWithPath.map(c => c.type));
export const businessTypes = Array.from(allTypes).map(type => ({
  id: type,
  name: type,
  icon: getIconForType(type),
  image: getImageForType(type),
}));

function getIconForType(type: string): string {
  switch (type) {
    case 'brand': return 'star';
    case 'store': return 'store';
    case 'garment': return 'shirt';
    case 'garments': return 'shirts';
    case 'service': return 'briefcase';
    case 'factory': return 'factory';
    default: return 'briefcase';
  }
}
function getImageForType(type: string): string {
  return `https://picsum.photos/id/${type === 'brand' ? 1 : type === 'store' ? 2 : 3}/200/200`;
}

// -----------------------------------------------------------------------------
// Other exports for HomeScreen components
// -----------------------------------------------------------------------------
// ... (everything above remains the same)

// -----------------------------------------------------------------------------
// Other exports for HomeScreen components
// -----------------------------------------------------------------------------
export const popularCategories = categories.map(cat => ({
  id: cat.id.toString(),
  name: cat.name,
  image: cat.image,
}));

export const bestSelling = allProducts.slice(0, 6).map(p => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: p.image,
  rating: p.rating,
}));

// Brand shops – companies with business_type 'brand'
export const brandShops = allCompanies
  .filter(c => c.type === 'brand')
  .map(c => ({
    id: c.id,
    name: c.name,
    logo: c.image,
    productCount: allProducts.filter(p => p.companyId === c.id).length,
    rating: (Math.random() * 2 + 3).toFixed(1),
  }));

// Top shops – companies with business_type 'store'
export const topShops = allCompanies
  .filter(c => c.type === 'store')
  .map(c => ({
    id: c.id,
    name: c.name,
    rating: (Math.random() * 2 + 3).toFixed(1),
    productCount: allProducts.filter(p => p.companyId === c.id).length,
    bonus: Math.floor(Math.random() * 500) + 100,
    image: c.image,
  }));
export const serviceShops = allCompanies
  .filter(c => c.type === 'service')
  .map(c => ({
    id: c.id,
    name: c.name,
    rating: (Math.random() * 2 + 3).toFixed(1),
    productCount: allProducts.filter(p => p.companyId === c.id).length,
    image: c.image,
    description: c.description,
  }));

// Latest news (mock)
export const news = [
  {
    id: '1',
    title: 'የንግድ ትርኢት',
    description: 'በአዲስ አበባ የሚካሄደው የንግድ ትርኢት ላይ ተሳትፉ',
    image: 'https://picsum.photos/id/15/400/200',
  },
  {
    id: '2',
    title: 'አዲስ ምርቶች',
    description: 'በገበያ ላይ የወጡ አዳዲስ ምርቶችን ይመልከቱ',
    image: 'https://picsum.photos/id/16/400/200',
  },
   {
    id: '3',
    title: 'የንግድ ትርኢት',
    description: 'በአዲስ አበባ የሚካሄደው የንግድ ትርኢት ላይ ተሳትፉ',
    image: 'https://picsum.photos/id/15/400/200',
  },
  {
    id: '4',
    title: 'አዲስ ምርቶች',
    description: 'በገበያ ላይ የወጡ አዳዲስ ምርቶችን ይመልከቱ',
    image: 'https://picsum.photos/id/16/400/200',
  },
];

// Debug logs (after definitions)
console.log('Total companies:', allCompanies.length);
console.log('Brand shops count:', brandShops.length);
console.log('Top shops count:', topShops.length);
console.log('Service shops count:', serviceShops.length);