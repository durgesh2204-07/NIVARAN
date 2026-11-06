/**
 * Complete Directory of All 36 Maharashtra Districts, their Talukas and Monitored Villages/Gaons
 * for NIVARAN Live GIS Map Navigation & Disaster Intelligence.
 */

export interface MaharashtraVillage {
  name: string;
  nameMr: string;
  lat: number;
  lng: number;
  hazardLevel?: 'Red' | 'Yellow' | 'Orange' | 'Green';
  hazardType?: string;
  population?: number;
}

export interface MaharashtraTaluka {
  name: string;
  nameMr: string;
  lat: number;
  lng: number;
  zoom?: number;
  villages: MaharashtraVillage[];
}

export interface MaharashtraDistrict {
  id: string;
  name: string;
  nameMr: string;
  division: 'Konkan' | 'Pune' | 'Nashik' | 'Chhatrapati Sambhajinagar' | 'Amravati' | 'Nagpur';
  hq: string;
  lat: number;
  lng: number;
  zoom: number;
  talukas: MaharashtraTaluka[];
}

export const MAHARASHTRA_DISTRICTS_DATA: MaharashtraDistrict[] = [
  // ==========================================
  // 1. PUNE DIVISION
  // ==========================================
  {
    id: 'dist-pune',
    name: 'Pune',
    nameMr: 'पुणे',
    division: 'Pune',
    hq: 'Pune City',
    lat: 18.5204,
    lng: 73.8567,
    zoom: 11.5,
    talukas: [
      {
        name: 'Haveli / PCMC',
        nameMr: 'हवेली / पिंपरी-चिंचवड',
        lat: 18.6298,
        lng: 73.7997,
        villages: [
          { name: 'Akurdi / Nigdi', nameMr: 'आकुर्डी / निगडी', lat: 18.6517, lng: 73.7615, hazardLevel: 'Green', hazardType: 'Safe Urban Base' },
          { name: 'Pune District Emergency Operations Center (DEOC)', nameMr: 'पुणे जिल्हा आपत्कालीन नियंत्रण केंद्र', lat: 18.5204, lng: 73.8567, hazardLevel: 'Green', hazardType: 'District Emergency Command Hub' },
          { name: 'Chinchwad Station', nameMr: 'चिंचवड स्टेशन', lat: 18.6346, lng: 73.7895, hazardLevel: 'Green' },
          { name: 'Bhosari MIDC', nameMr: 'भोसरी', lat: 18.6247, lng: 73.8478, hazardLevel: 'Green' },
          { name: 'Khadakwasla Dam Basin', nameMr: 'खडकवासला', lat: 18.4312, lng: 73.7632, hazardLevel: 'Yellow', hazardType: 'Reservoir Buffer' },
        ],
      },
      {
        name: 'Maval',
        nameMr: 'मावळ',
        lat: 18.7422,
        lng: 73.6418,
        villages: [
          { name: 'Vadgaon Maval', nameMr: 'वडगाव मावळ', lat: 18.7422, lng: 73.6418, hazardLevel: 'Yellow' },
          { name: 'Lonavala Hill Enclave', nameMr: 'लोणावळा', lat: 18.7557, lng: 73.4091, hazardLevel: 'Orange', hazardType: 'Ghat Landslide' },
          { name: 'Khandala Ghat', nameMr: 'खंडाळा घाट', lat: 18.7618, lng: 73.3768, hazardLevel: 'Red', hazardType: 'Scarp Slope Failure' },
          { name: 'Talegaon Dabhade', nameMr: 'तळेगाव दाभाडे', lat: 18.7302, lng: 73.6781, hazardLevel: 'Green' },
          { name: 'Kamshet Valley', nameMr: 'कामशेत', lat: 18.7584, lng: 73.5582, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Mulshi',
        nameMr: 'मुळशी',
        lat: 18.5102,
        lng: 73.5112,
        villages: [
          { name: 'Kondhavale', nameMr: 'कोंढवळे', lat: 18.5102, lng: 73.4718, hazardLevel: 'Red', hazardType: 'Landslide' },
          { name: 'Paud Central Gaon', nameMr: 'पौड', lat: 18.5332, lng: 73.6142, hazardLevel: 'Yellow' },
          { name: 'Tamhini Ghat Basin', nameMr: 'ताम्हिणी घाट', lat: 18.4682, lng: 73.4215, hazardLevel: 'Red', hazardType: 'High Ghat Flash Inundation' },
          { name: 'Lavasa Valley Scarp', nameMr: 'लवासा', lat: 18.4092, lng: 73.5098, hazardLevel: 'Orange' },
          { name: 'Male Gaon', nameMr: 'माले', lat: 18.5142, lng: 73.5412, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Ambegaon',
        nameMr: 'आंबेगाव',
        lat: 19.0445,
        lng: 73.8352,
        villages: [
          { name: 'Malin Pada', nameMr: 'माळीण पाडा', lat: 19.1588, lng: 73.6815, hazardLevel: 'Red', hazardType: 'Landslide Debris Flow' },
          { name: 'Ghodegaon Tehsil', nameMr: 'घोडेगाव', lat: 19.0445, lng: 73.8352, hazardLevel: 'Yellow' },
          { name: 'Dimbhe Dam Catchment', nameMr: 'डिंभे धरण', lat: 19.0984, lng: 73.7421, hazardLevel: 'Orange', hazardType: 'Reservoir Rim Slip' },
          { name: 'Bhimashankar Sanctuary Base', nameMr: 'भीमाशंकर', lat: 19.0722, lng: 73.5358, hazardLevel: 'Red' },
        ],
      },
      {
        name: 'Junnar',
        nameMr: 'जुन्नर',
        lat: 19.2089,
        lng: 73.8745,
        villages: [
          { name: 'Junnar Town', nameMr: 'जुन्नर', lat: 19.2089, lng: 73.8745, hazardLevel: 'Yellow' },
          { name: 'Malshej Ghat Pass', nameMr: 'माळशेज घाट', lat: 19.3412, lng: 73.7845, hazardLevel: 'Red', hazardType: 'Rockfall & Mudflow' },
          { name: 'Otur Gaon', nameMr: 'ओतूर', lat: 19.2592, lng: 73.9842, hazardLevel: 'Green' },
          { name: 'Narayangaon', nameMr: 'नारायणगाव', lat: 19.1172, lng: 73.9782, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Bhor',
        nameMr: 'भोर',
        lat: 18.1462,
        lng: 73.8453,
        villages: [
          { name: 'Bhor Tehsil Head', nameMr: 'भोर', lat: 18.1462, lng: 73.8453, hazardLevel: 'Yellow' },
          { name: 'Bhatghar Dam Foot', nameMr: 'भातघर धरण', lat: 18.1724, lng: 73.8542, hazardLevel: 'Yellow' },
          { name: 'Varandha Ghat Crest', nameMr: 'वरंधा घाट', lat: 18.1124, lng: 73.6142, hazardLevel: 'Red', hazardType: 'Landslide' },
        ],
      },
      {
        name: 'Velhe',
        nameMr: 'वेल्हे',
        lat: 18.2921,
        lng: 73.6334,
        villages: [
          { name: 'Velhe Gaon', nameMr: 'वेल्हे', lat: 18.2921, lng: 73.6334, hazardLevel: 'Orange' },
          { name: 'Panshet Dam Settlement', nameMr: 'पानशेत', lat: 18.3742, lng: 73.6125, hazardLevel: 'Yellow' },
          { name: 'Torna Escarpment Toe', nameMr: 'तोरणा पायथा', lat: 18.2762, lng: 73.6198, hazardLevel: 'Red' },
        ],
      },
      {
        name: 'Shirur',
        nameMr: 'शिरूर',
        lat: 18.8282,
        lng: 74.3782,
        villages: [
          { name: 'Shirur Town', nameMr: 'शिरूर', lat: 18.8282, lng: 74.3782, hazardLevel: 'Green' },
          { name: 'Ranjangaon MIDC', nameMr: 'रांजणगाव', lat: 18.7521, lng: 74.2415, hazardLevel: 'Green' },
          { name: 'Sanaswadi', nameMr: 'सणसवाडी', lat: 18.6672, lng: 74.1245, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Baramati',
        nameMr: 'बारामती',
        lat: 18.1524,
        lng: 74.5772,
        villages: [
          { name: 'Baramati City', nameMr: 'बारामती', lat: 18.1524, lng: 74.5772, hazardLevel: 'Green' },
          { name: 'Malegaon Budruk', nameMr: 'माळेगाव बु.', lat: 18.1892, lng: 74.5124, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Indapur',
        nameMr: 'इंदापूर',
        lat: 18.1162,
        lng: 75.0312,
        villages: [
          { name: 'Indapur Town', nameMr: 'इंदापूर', lat: 18.1162, lng: 75.0312, hazardLevel: 'Green' },
          { name: 'Bhigwan Ujani Bird Sanctuary', nameMr: 'भिगवण', lat: 18.2912, lng: 74.8824, hazardLevel: 'Yellow', hazardType: 'Reservoir Backwater' },
        ],
      },
      {
        name: 'Daund',
        nameMr: 'दौंड',
        lat: 18.4652,
        lng: 74.5824,
        villages: [
          { name: 'Daund Junction Node', nameMr: 'दौंड', lat: 18.4652, lng: 74.5824, hazardLevel: 'Green' },
          { name: 'Yavat Gaon', nameMr: 'यवत', lat: 18.4721, lng: 74.2815, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Purandar',
        nameMr: 'पुरंदर',
        lat: 18.3412,
        lng: 74.0215,
        villages: [
          { name: 'Saswad Central', nameMr: 'सासवड', lat: 18.3412, lng: 74.0215, hazardLevel: 'Green' },
          { name: 'Purandar Fort Base', nameMr: 'पुरंदर पायथा', lat: 18.2812, lng: 73.9812, hazardLevel: 'Yellow' },
          { name: 'Jejuri Temple Town', nameMr: 'जेजुरी', lat: 18.2752, lng: 74.1612, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Khed (Rajgurunagar)',
        nameMr: 'खेड (राजगुरुनगर)',
        lat: 18.8512,
        lng: 73.8924,
        villages: [
          { name: 'Rajgurunagar', nameMr: 'राजगुरुनगर', lat: 18.8512, lng: 73.8924, hazardLevel: 'Green' },
          { name: 'Chakan Industrial Hub', nameMr: 'चाकण', lat: 18.7612, lng: 73.8542, hazardLevel: 'Green' },
          { name: 'Alandi Holy Town', nameMr: 'आळंदी', lat: 18.6782, lng: 73.8982, hazardLevel: 'Yellow', hazardType: 'River Inundation' },
        ],
      },
    ],
  },

  // ==========================================
  // 2. RAIGAD DISTRICT (KONKAN)
  // ==========================================
  {
    id: 'dist-raigad',
    name: 'Raigad',
    nameMr: 'रायगड',
    division: 'Konkan',
    hq: 'Alibag',
    lat: 18.6414,
    lng: 72.8722,
    zoom: 11.5,
    talukas: [
      {
        name: 'Khalapur',
        nameMr: 'खालापूर',
        lat: 18.8825,
        lng: 73.2852,
        villages: [
          { name: 'Irshalwadi', nameMr: 'इरशाळवाडी', lat: 18.9265, lng: 73.2361, hazardLevel: 'Red', hazardType: 'Landslide Debris Flow' },
          { name: 'Khalapur Chowk Township', nameMr: 'खालापूर चौक', lat: 18.8945, lng: 73.2140, hazardLevel: 'Green', hazardType: 'Designated Safe Host Plateau' },
          { name: 'Khopoli Foothills', nameMr: 'खोपोली', lat: 18.7892, lng: 73.3445, hazardLevel: 'Orange', hazardType: 'Flash Floodway' },
          { name: 'Nanivali', nameMr: 'नानिवली', lat: 18.9142, lng: 73.2512, hazardLevel: 'Red' },
        ],
      },
      {
        name: 'Mahad',
        nameMr: 'महाड',
        lat: 18.0823,
        lng: 73.4184,
        villages: [
          { name: 'Taliye Gaon', nameMr: 'तळीये', lat: 18.1284, lng: 73.5012, hazardLevel: 'Red', hazardType: 'Catastrophic Hill Failure' },
          { name: 'Mahad City Savitri Confluence', nameMr: 'महाड शहर', lat: 18.0823, lng: 73.4184, hazardLevel: 'Red', hazardType: 'Flash Flood Danger Mark' },
          { name: 'Mahad MIDC Safe Plateau', nameMr: 'महाड एमआयडीसी', lat: 18.1052, lng: 73.4481, hazardLevel: 'Green', hazardType: 'Safe Relocation Host' },
          { name: 'Birwadi Gaon', nameMr: 'बिरवाडी', lat: 18.1342, lng: 73.4512, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Karjat',
        nameMr: 'कर्जत',
        lat: 18.9102,
        lng: 73.3283,
        villages: [
          { name: 'Karjat Central', nameMr: 'कर्जत', lat: 18.9102, lng: 73.3283, hazardLevel: 'Yellow' },
          { name: 'Matheran Escarpment', nameMr: 'माथेरान', lat: 18.9848, lng: 73.2712, hazardLevel: 'Red', hazardType: 'Escarpment Landslide' },
          { name: 'Neral Foothill Node', nameMr: 'नेरळ', lat: 19.0282, lng: 73.3182, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Poladpur',
        nameMr: 'पोलादपूर',
        lat: 17.9825,
        lng: 73.4651,
        villages: [
          { name: 'Kewnale', nameMr: 'केवणाळे', lat: 17.9682, lng: 73.4892, hazardLevel: 'Red', hazardType: 'Ghat Landslide' },
          { name: 'Poladpur Town', nameMr: 'पोलादपूर', lat: 17.9825, lng: 73.4651, hazardLevel: 'Orange' },
          { name: 'Kapade Khurd', nameMr: 'कपडे खुर्द', lat: 17.9512, lng: 73.4912, hazardLevel: 'Red' },
        ],
      },
      {
        name: 'Alibag',
        nameMr: 'अलिबाग',
        lat: 18.6414,
        lng: 72.8722,
        villages: [
          { name: 'Alibag City Coastal Node', nameMr: 'अलिबाग शहर', lat: 18.6414, lng: 72.8722, hazardLevel: 'Yellow', hazardType: 'Coastal Inundation' },
          { name: 'Kashid Beach Coast', nameMr: 'काशिद', lat: 18.4412, lng: 72.9012, hazardLevel: 'Yellow' },
          { name: 'Varsoli Gaon', nameMr: 'वरसोली', lat: 18.6612, lng: 72.8612, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Panvel',
        nameMr: 'पनवेल',
        lat: 18.9894,
        lng: 73.1175,
        villages: [
          { name: 'Panvel City', nameMr: 'पनवेल', lat: 18.9894, lng: 73.1175, hazardLevel: 'Green' },
          { name: 'Kalamboli Node', nameMr: 'कळंबोली', lat: 19.0212, lng: 73.1012, hazardLevel: 'Green' },
          { name: 'Gadi River Catchment', nameMr: 'गाढी नदी क्षेत्र', lat: 18.9712, lng: 73.1312, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Pen',
        nameMr: 'पेण',
        lat: 18.7376,
        lng: 73.0964,
        villages: [
          { name: 'Pen Town', nameMr: 'पेण', lat: 18.7376, lng: 73.0964, hazardLevel: 'Yellow', hazardType: 'Bhogeshwari Tidal Basin' },
          { name: 'Antora Salt Pans', nameMr: 'अंतोरा', lat: 18.7512, lng: 73.0612, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Roha',
        nameMr: 'रोहा',
        lat: 18.4368,
        lng: 73.1196,
        villages: [
          { name: 'Roha Kundalika Basin', nameMr: 'रोहा', lat: 18.4368, lng: 73.1196, hazardLevel: 'Orange', hazardType: 'Kundalika Floodway' },
          { name: 'Kolad Rafting Hub', nameMr: 'कोलाड', lat: 18.4112, lng: 73.2112, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Mangaon',
        nameMr: 'माणगाव',
        lat: 18.2345,
        lng: 73.2812,
        villages: [
          { name: 'Mangaon Central', nameMr: 'माणगाव', lat: 18.2345, lng: 73.2812, hazardLevel: 'Yellow' },
          { name: 'Nizampur Valley', nameMr: 'निजामपूर', lat: 18.2812, lng: 73.3412, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Shrivardhan & Murud',
        nameMr: 'श्रीवर्धन व मुरुड',
        lat: 18.0338,
        lng: 73.0156,
        villages: [
          { name: 'Shrivardhan Port', nameMr: 'श्रीवर्धन', lat: 18.0338, lng: 73.0156, hazardLevel: 'Yellow', hazardType: 'Coastal Cyclone Surge' },
          { name: 'Murud Janjira Coastal Fort', nameMr: 'मुरुड जंजिरा', lat: 18.3292, lng: 72.9614, hazardLevel: 'Yellow' },
        ],
      },
    ],
  },

  // ==========================================
  // 3. SATARA DISTRICT (WESTERN MAHARASHTRA)
  // ==========================================
  {
    id: 'dist-satara',
    name: 'Satara',
    nameMr: 'सातारा',
    division: 'Pune',
    hq: 'Satara City',
    lat: 17.6805,
    lng: 74.0183,
    zoom: 11.5,
    talukas: [
      {
        name: 'Patan',
        nameMr: 'पाटण',
        lat: 17.3752,
        lng: 73.9012,
        villages: [
          { name: 'Ambeghar', nameMr: 'आंबेघर', lat: 17.3921, lng: 73.8542, hazardLevel: 'Red', hazardType: 'Koyna-Patan Mudslide' },
          { name: 'Mirgaon', nameMr: 'मिरगाव', lat: 17.4195, lng: 73.7611, hazardLevel: 'Red', hazardType: 'Active Lateritic Fissure' },
          { name: 'Koynanagar Dam Environs', nameMr: 'कोयनानगर', lat: 17.3982, lng: 73.7524, hazardLevel: 'Orange', hazardType: 'Seismic & Dam Rim Slip' },
          { name: 'Patan Tehsil Center', nameMr: 'पाटण शहर', lat: 17.3752, lng: 73.9012, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Mahabaleshwar',
        nameMr: 'महाबळेश्वर',
        lat: 17.9307,
        lng: 73.6477,
        villages: [
          { name: 'Mahabaleshwar Hill Station', nameMr: 'महाबळेश्वर', lat: 17.9307, lng: 73.6477, hazardLevel: 'Orange', hazardType: 'Extreme Ghat Rainfall' },
          { name: 'Ambenali Ghat Crest', nameMr: 'आंबेनळी घाट माथा', lat: 17.9120, lng: 73.6350, hazardLevel: 'Red', hazardType: 'Ghat Landslide' },
          { name: 'Pratapgad Foothills', nameMr: 'प्रतापगड पायथा', lat: 17.9324, lng: 73.5824, hazardLevel: 'Red' },
          { name: 'Tapola (Mini Kashmir)', nameMr: 'ताप secret', lat: 17.7812, lng: 73.6912, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Wai',
        nameMr: 'वाई',
        lat: 17.9482,
        lng: 73.8912,
        villages: [
          { name: 'Wai Town Krishna Ghat', nameMr: 'वाई', lat: 17.9482, lng: 73.8912, hazardLevel: 'Yellow', hazardType: 'Krishna Inundation' },
          { name: 'Dhom Dam Buffer', nameMr: 'धोम धरण', lat: 17.9812, lng: 73.8124, hazardLevel: 'Yellow' },
          { name: 'Panchgani Plateau', nameMr: 'पाचगणी', lat: 17.9240, lng: 73.8005, hazardLevel: 'Green', hazardType: 'Safe Basalt Plateau' },
        ],
      },
      {
        name: 'Karad',
        nameMr: 'कराड',
        lat: 17.2865,
        lng: 74.1814,
        villages: [
          { name: 'Karad Krishna-Koyna Preeti Sangam', nameMr: 'कराड', lat: 17.2865, lng: 74.1814, hazardLevel: 'Yellow', hazardType: 'River Confluence Inundation' },
          { name: 'Ogalewadi MIDC', nameMr: 'ओगलेवाडी', lat: 17.3112, lng: 74.2112, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Jawali / Medha',
        nameMr: 'जावळी / मेढा',
        lat: 17.7412,
        lng: 73.8124,
        villages: [
          { name: 'Medha Gaon', nameMr: 'मेढा', lat: 17.7412, lng: 73.8124, hazardLevel: 'Orange' },
          { name: 'Kas Plateau Border', nameMr: 'कास पठार', lat: 17.7212, lng: 73.8198, hazardLevel: 'Yellow' },
        ],
      },
    ],
  },

  // ==========================================
  // 4. RATNAGIRI DISTRICT (KONKAN)
  // ==========================================
  {
    id: 'dist-ratnagiri',
    name: 'Ratnagiri',
    nameMr: 'रत्नागिरी',
    division: 'Konkan',
    hq: 'Ratnagiri City',
    lat: 16.9902,
    lng: 73.3120,
    zoom: 11.5,
    talukas: [
      {
        name: 'Chiplun',
        nameMr: 'चिपळूण',
        lat: 17.5324,
        lng: 73.5178,
        villages: [
          { name: 'Chiplun Market & Flood Basin', nameMr: 'चिपळूण शहर', lat: 17.5324, lng: 73.5178, hazardLevel: 'Red', hazardType: 'Vashishti River Flash Inundation' },
          { name: 'Tiware Dam Catchment', nameMr: 'तिवरे धरण', lat: 17.5812, lng: 73.6512, hazardLevel: 'Red', hazardType: 'Breach Vulnerability' },
          { name: 'Kherdi MIDC Host Zone', nameMr: 'खेर्डी एमआयडीसी', lat: 17.5512, lng: 73.5512, hazardLevel: 'Green', hazardType: 'Designated Safe Shelter Area' },
        ],
      },
      {
        name: 'Khed',
        nameMr: 'खेड',
        lat: 17.7176,
        lng: 73.3932,
        villages: [
          { name: 'Khed Jagbudi Riverfront', nameMr: 'खेड', lat: 17.7176, lng: 73.3932, hazardLevel: 'Red', hazardType: 'Jagbudi River Overtopping' },
          { name: 'Lote Parshuram MIDC High Ground', nameMr: 'लोटे परशुराम', lat: 17.6512, lng: 73.4512, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Dapoli & Mandangad',
        nameMr: 'दापोली व मंडणगड',
        lat: 17.7574,
        lng: 73.1856,
        villages: [
          { name: 'Dapoli Town', nameMr: 'दापोली', lat: 17.7574, lng: 73.1856, hazardLevel: 'Yellow' },
          { name: 'Harnai Fishing Port', nameMr: 'हर्णे', lat: 17.8124, lng: 73.0912, hazardLevel: 'Yellow', hazardType: 'Storm Surge' },
          { name: 'Mandangad Fort Toe', nameMr: 'मंडणगड', lat: 17.9812, lng: 73.2512, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Sangameshwar',
        nameMr: 'संगमेश्वर',
        lat: 17.1872,
        lng: 73.5514,
        villages: [
          { name: 'Sangameshwar Shastri Confluence', nameMr: 'संगमेश्वर', lat: 17.1872, lng: 73.5514, hazardLevel: 'Orange', hazardType: 'Shastri River Flood' },
          { name: 'Marleshwar Ghat & Waterfall Toe', nameMr: 'मार्लेश्वर', lat: 17.0612, lng: 73.6812, hazardLevel: 'Red', hazardType: 'Ghat Landslide' },
        ],
      },
      {
        name: 'Ratnagiri & Rajapur',
        nameMr: 'रत्नागिरी व राजापूर',
        lat: 16.9902,
        lng: 73.3120,
        villages: [
          { name: 'Ratnagiri Port & Mirya Beach', nameMr: 'रत्नागिरी', lat: 16.9902, lng: 73.3120, hazardLevel: 'Yellow', hazardType: 'Coastal Erosion' },
          { name: 'Rajapur Kodavali Basin', nameMr: 'राजापूर', lat: 16.6572, lng: 73.5162, hazardLevel: 'Orange', hazardType: 'Kodavali Flash Inundation' },
        ],
      },
    ],
  },

  // ==========================================
  // 5. KOLHAPUR DISTRICT
  // ==========================================
  {
    id: 'dist-kolhapur',
    name: 'Kolhapur',
    nameMr: 'कोल्हापूर',
    division: 'Pune',
    hq: 'Kolhapur City',
    lat: 16.7050,
    lng: 74.2433,
    zoom: 11.5,
    talukas: [
      {
        name: 'Karveer (Kolhapur)',
        nameMr: 'करवीर',
        lat: 16.7050,
        lng: 74.2433,
        villages: [
          { name: 'Kolhapur City Panchganga Ghat', nameMr: 'कोल्हापूर शहर', lat: 16.7050, lng: 74.2433, hazardLevel: 'Orange', hazardType: 'Panchganga Warning Mark' },
          { name: 'Chikhali Gaon', nameMr: 'चिखली', lat: 16.7312, lng: 74.1912, hazardLevel: 'Red', hazardType: 'Recurring River Inundation' },
          { name: 'Ambewadi Gaon', nameMr: 'आंबेवाडी', lat: 16.7212, lng: 74.2112, hazardLevel: 'Red', hazardType: 'Recurring Floodway' },
        ],
      },
      {
        name: 'Shirol',
        nameMr: 'शिरोळ',
        lat: 16.7318,
        lng: 74.5964,
        villages: [
          { name: 'Shirol Town', nameMr: 'शिरोळ', lat: 16.7318, lng: 74.5964, hazardLevel: 'Orange' },
          { name: 'Kurundwad Krishna Confluence', nameMr: 'कुरुंदवाड', lat: 16.6912, lng: 74.6112, hazardLevel: 'Red', hazardType: 'Panchganga-Krishna Backflow' },
          { name: 'Nrusinhawadi Pilgrimage Ghat', nameMr: 'नृसिंहवाडी', lat: 16.6812, lng: 74.6012, hazardLevel: 'Red', hazardType: 'Submersion Hazard' },
        ],
      },
      {
        name: 'Gaganbawda',
        nameMr: 'गगनबावडा',
        lat: 16.5412,
        lng: 73.8312,
        villages: [
          { name: 'Bawda Hill Pass', nameMr: 'गगनबावडा', lat: 16.5412, lng: 73.8312, hazardLevel: 'Red', hazardType: 'High Rain Ghat Debris' },
          { name: 'Karul Ghat Escarpment', nameMr: 'करूळ घाट', lat: 16.5212, lng: 73.7912, hazardLevel: 'Red' },
        ],
      },
      {
        name: 'Radhanagari & Shahuwadi',
        nameMr: 'राधानगरी व शाहूवाडी',
        lat: 16.4112,
        lng: 73.9912,
        villages: [
          { name: 'Radhanagari Dam Buffer', nameMr: 'राधानगरी', lat: 16.4112, lng: 73.9912, hazardLevel: 'Orange' },
          { name: 'Barki Waterfall Toe', nameMr: 'बरकी', lat: 16.8512, lng: 73.8112, hazardLevel: 'Red', hazardType: 'Flash Torrent' },
          { name: 'Amba Ghat Pass', nameMr: 'आंबा घाट', lat: 16.9612, lng: 73.8012, hazardLevel: 'Red' },
        ],
      },
    ],
  },

  // ==========================================
  // 6. SANGLI DISTRICT
  // ==========================================
  {
    id: 'dist-sangli',
    name: 'Sangli',
    nameMr: 'सांगली',
    division: 'Pune',
    hq: 'Sangli City',
    lat: 16.8524,
    lng: 74.5815,
    zoom: 11.5,
    talukas: [
      {
        name: 'Miraj / Sangli',
        nameMr: 'मिरज / सांगली',
        lat: 16.8524,
        lng: 74.5815,
        villages: [
          { name: 'Sangli City Irwin Bridge Gauge', nameMr: 'सांगली शहर', lat: 16.8524, lng: 74.5815, hazardLevel: 'Red', hazardType: 'Krishna River Flood Danger Level' },
          { name: 'Haripur Krishna-Warna Sangam', nameMr: 'हरिपूर', lat: 16.8212, lng: 74.5412, hazardLevel: 'Red' },
          { name: 'Bhilwadi Riverbank', nameMr: 'भिलवडी', lat: 17.0112, lng: 74.4512, hazardLevel: 'Red', hazardType: 'Chronic Submersion' },
        ],
      },
      {
        name: 'Shirala (Chandoli)',
        nameMr: 'शिराळा',
        lat: 16.9812,
        lng: 74.1312,
        villages: [
          { name: 'Chandoli Dam Basin', nameMr: 'चांदोली', lat: 17.1312, lng: 73.8512, hazardLevel: 'Orange', hazardType: 'High Rain Ghat Slopes' },
          { name: 'Shirala Town', nameMr: 'शिराळा', lat: 16.9812, lng: 74.1312, hazardLevel: 'Yellow' },
        ],
      },
    ],
  },

  // ==========================================
  // 7. SINDHUDURG DISTRICT
  // ==========================================
  {
    id: 'dist-sindhudurg',
    name: 'Sindhudurg',
    nameMr: 'सिंधुदुर्ग',
    division: 'Konkan',
    hq: 'Oros / Kudal',
    lat: 16.0322,
    lng: 73.7001,
    zoom: 11.5,
    talukas: [
      {
        name: 'Sawantwadi & Dodamarg',
        nameMr: 'सावंतवाडी व दोडामार्ग',
        lat: 15.9042,
        lng: 73.8198,
        villages: [
          { name: 'Amboli Ghat Waterfall Scarp', nameMr: 'आंबोली', lat: 15.9612, lng: 74.0034, hazardLevel: 'Red', hazardType: 'Extreme Rainfall Debris Flow' },
          { name: 'Sawantwadi Palace Lake', nameMr: 'सावंतवाडी', lat: 15.9042, lng: 73.8198, hazardLevel: 'Green' },
          { name: 'Banda Town Terekhol Border', nameMr: 'बांदा', lat: 15.8112, lng: 73.8612, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Kankavli & Vaibhavwadi',
        nameMr: 'कणकवली व वैभववाडी',
        lat: 16.2612,
        lng: 73.7112,
        villages: [
          { name: 'Kankavli Town Gad Riverfront', nameMr: 'कणकवली', lat: 16.2612, lng: 73.7112, hazardLevel: 'Yellow' },
          { name: 'Bhuibawda Ghat Toe', nameMr: 'भुईबावडा घाट', lat: 16.5412, lng: 73.7512, hazardLevel: 'Red' },
        ],
      },
      {
        name: 'Malvan & Devgad',
        nameMr: 'मालवण व देवगड',
        lat: 16.0612,
        lng: 73.4612,
        villages: [
          { name: 'Sindhudurg Fort Malvan', nameMr: 'मालवण', lat: 16.0612, lng: 73.4612, hazardLevel: 'Yellow' },
          { name: 'Tarkarli Coastal Spit', nameMr: 'तारकर्ली', lat: 16.0112, lng: 73.4912, hazardLevel: 'Yellow', hazardType: 'Coastal Surge' },
          { name: 'Devgad Fort Creek', nameMr: 'देवगड', lat: 16.3712, lng: 73.3812, hazardLevel: 'Yellow' },
        ],
      },
    ],
  },

  // ==========================================
  // 8. THANE DISTRICT
  // ==========================================
  {
    id: 'dist-thane',
    name: 'Thane',
    nameMr: 'ठाणे',
    division: 'Konkan',
    hq: 'Thane City',
    lat: 19.2183,
    lng: 72.9781,
    zoom: 11.5,
    talukas: [
      {
        name: 'Thane City & Creek',
        nameMr: 'ठाणे शहर',
        lat: 19.2183,
        lng: 72.9781,
        villages: [
          { name: 'Thane Naupada Central', nameMr: 'ठाणे नौपाडा', lat: 19.1912, lng: 72.9712, hazardLevel: 'Green' },
          { name: 'Ghubandar Road Ghat Section', nameMr: 'घोडबंदर', lat: 19.2612, lng: 72.9112, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Kalyan - Dombivli',
        nameMr: 'कल्याण - डोंबिवली',
        lat: 19.2403,
        lng: 73.1305,
        villages: [
          { name: 'Kalyan Ulhas River Floodplain', nameMr: 'कल्याण', lat: 19.2403, lng: 73.1305, hazardLevel: 'Orange', hazardType: 'Ulhas Basin Inundation' },
          { name: 'Dombivli MIDC Node', nameMr: 'डोंबिवली', lat: 19.2184, lng: 73.0867, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Shahapur & Murbad',
        nameMr: 'शहापूर व मुरबाड',
        lat: 19.4512,
        lng: 73.3312,
        villages: [
          { name: 'Kasara Ghat (Thal Ghat)', nameMr: 'कसारा घाट', lat: 19.6612, lng: 73.4812, hazardLevel: 'Red', hazardType: 'Railway-Highway Landslide Scarp' },
          { name: 'Bhatsa Dam Settlement', nameMr: 'भातसा धरण', lat: 19.5212, lng: 73.4112, hazardLevel: 'Orange' },
          { name: 'Murbad Town Node', nameMr: 'मुरबाड', lat: 19.2512, lng: 73.4012, hazardLevel: 'Yellow' },
          { name: 'Badlapur Ulhas Flood Basin', nameMr: 'बदलापूर', lat: 19.1612, lng: 73.2612, hazardLevel: 'Orange' },
        ],
      },
    ],
  },

  // ==========================================
  // 9. PALGHAR DISTRICT
  // ==========================================
  {
    id: 'dist-palghar',
    name: 'Palghar',
    nameMr: 'पालघर',
    division: 'Konkan',
    hq: 'Palghar City',
    lat: 19.6967,
    lng: 72.7699,
    zoom: 11.5,
    talukas: [
      {
        name: 'Jawhar & Mokhada',
        nameMr: 'जव्हार व मोखाडा',
        lat: 19.9162,
        lng: 73.2312,
        villages: [
          { name: 'Jawhar Hill Plateau', nameMr: 'जव्हार', lat: 19.9162, lng: 73.2312, hazardLevel: 'Orange', hazardType: 'Flash Runoff Ghat' },
          { name: 'Mokhada Escarpment Toe', nameMr: 'मोखाडा', lat: 19.9312, lng: 73.3412, hazardLevel: 'Red', hazardType: 'Slope Instability' },
          { name: 'Dabhosa Waterfall Basin', nameMr: 'दाभोसा', lat: 19.9412, lng: 73.2112, hazardLevel: 'Orange' },
        ],
      },
      {
        name: 'Dahanu & Palghar',
        nameMr: 'डहाणू व पालघर',
        lat: 19.9712,
        lng: 72.7312,
        villages: [
          { name: 'Dahanu Coastal Belt', nameMr: 'डहाणू', lat: 19.9712, lng: 72.7312, hazardLevel: 'Yellow' },
          { name: 'Tarapur Atomic Plant Buffer', nameMr: 'तारापूर', lat: 19.8212, lng: 72.6912, hazardLevel: 'Yellow', hazardType: 'Industrial Coastal Watch' },
          { name: 'Manor Vaitarna Crossing', nameMr: 'मनोर', lat: 19.7412, lng: 72.9112, hazardLevel: 'Orange', hazardType: 'Vaitarna River Inundation' },
        ],
      },
    ],
  },

  // ==========================================
  // 10. MUMBAI CITY & SUBURBAN
  // ==========================================
  {
    id: 'dist-mumbai',
    name: 'Mumbai City & Suburban',
    nameMr: 'मुंबई शहर व उपनगर',
    division: 'Konkan',
    hq: 'Mumbai',
    lat: 19.0760,
    lng: 72.8777,
    zoom: 12.0,
    talukas: [
      {
        name: 'Mumbai City',
        nameMr: 'मुंबई शहर',
        lat: 18.9322,
        lng: 72.8347,
        villages: [
          { name: 'Colaba / Marine Drive', nameMr: 'कुलाबा', lat: 18.9067, lng: 72.8147, hazardLevel: 'Yellow', hazardType: 'Sea Wall Overtopping' },
          { name: 'Dadar Central / Hindmata', nameMr: 'दादर हिंदमाता', lat: 19.0178, lng: 72.8478, hazardLevel: 'Orange', hazardType: 'Urban Low-Lying Waterlogging' },
        ],
      },
      {
        name: 'Mumbai Suburban',
        nameMr: 'मुंबई उपनगर',
        lat: 19.0596,
        lng: 72.8402,
        villages: [
          { name: 'Bandra Kurla Complex', nameMr: 'बीकेसी', lat: 19.0657, lng: 72.8683, hazardLevel: 'Yellow', hazardType: 'Mithi River Basin' },
          { name: 'Andheri Subway', nameMr: 'अंधेरी', lat: 19.1197, lng: 72.8464, hazardLevel: 'Orange', hazardType: 'Micro-Topography Flooding' },
          { name: 'Kurla / Mithi River Corridor', nameMr: 'कुर्ला', lat: 19.0682, lng: 72.8812, hazardLevel: 'Red', hazardType: 'Mithi River Flash Inundation' },
          { name: 'Borivali National Park Scarp', nameMr: 'बोरिवली', lat: 19.2288, lng: 72.8541, hazardLevel: 'Yellow' },
        ],
      },
    ],
  },

  // ==========================================
  // 11. NASHIK DISTRICT (NORTH MAHARASHTRA)
  // ==========================================
  {
    id: 'dist-nashik',
    name: 'Nashik',
    nameMr: 'नाशिक',
    division: 'Nashik',
    hq: 'Nashik City',
    lat: 19.9975,
    lng: 73.7898,
    zoom: 11.5,
    talukas: [
      {
        name: 'Nashik & Trimbakeshwar',
        nameMr: 'नाशिक व त्र्यंबकेश्वर',
        lat: 19.9312,
        lng: 73.5312,
        villages: [
          { name: 'Nashik City Godavari Ramkund', nameMr: 'नाशिक रामकुंड', lat: 19.9975, lng: 73.7898, hazardLevel: 'Orange', hazardType: 'Godavari Flood Danger Mark' },
          { name: 'Trimbakeshwar Brahmagiri Scarp', nameMr: 'त्र्यंबकेश्वर', lat: 19.9312, lng: 73.5312, hazardLevel: 'Red', hazardType: 'Brahmagiri Slope Slide' },
          { name: 'Gangapur Dam Catchment', nameMr: 'गंगापूर धरण', lat: 20.0212, lng: 73.6812, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Igatpuri',
        nameMr: 'इगतपुरी',
        lat: 19.6982,
        lng: 73.5612,
        villages: [
          { name: 'Igatpuri Town Ghat Crest', nameMr: 'इगतपुरी', lat: 19.6982, lng: 73.5612, hazardLevel: 'Orange', hazardType: 'High Ghat Cloudburst Hazard' },
          { name: 'Bhavali Dam / Vaitarna Foot', nameMr: 'भावली धरण', lat: 19.6512, lng: 73.5112, hazardLevel: 'Yellow' },
          { name: 'Kasara Escarpment Border', nameMr: 'कसारा सीमा', lat: 19.6812, lng: 73.4912, hazardLevel: 'Red' },
        ],
      },
      {
        name: 'Kalwan (Saptashrungi)',
        nameMr: 'कळवण',
        lat: 20.4812,
        lng: 73.9112,
        villages: [
          { name: 'Saptashrungi Gad Cliff Face', nameMr: 'सप्तशृंगी गड', lat: 20.3912, lng: 73.9012, hazardLevel: 'Red', hazardType: 'Cliff Rockfall Vulnerability' },
          { name: 'Kalwan Town', nameMr: 'कळवण', lat: 20.4812, lng: 73.9112, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Malegaon & Niphad',
        nameMr: 'मालेगाव व निफाड',
        lat: 20.5532,
        lng: 74.5284,
        villages: [
          { name: 'Malegaon Mosam River Confluence', nameMr: 'मालेगाव', lat: 20.5532, lng: 74.5284, hazardLevel: 'Orange', hazardType: 'Girna-Mosam Inundation' },
          { name: 'Niphad Grape Valley', nameMr: 'निफाड', lat: 20.0812, lng: 74.1112, hazardLevel: 'Green' },
        ],
      },
    ],
  },

  // ==========================================
  // 12. AHILYANAGAR (AHMEDNAGAR)
  // ==========================================
  {
    id: 'dist-ahmednagar',
    name: 'Ahilyanagar (Ahmednagar)',
    nameMr: 'अहिल्यानगर (अहमदनगर)',
    division: 'Nashik',
    hq: 'Ahilyanagar',
    lat: 19.0948,
    lng: 74.7496,
    zoom: 11.5,
    talukas: [
      {
        name: 'Akole (Bhandardara)',
        nameMr: 'अकोले',
        lat: 19.5412,
        lng: 73.9312,
        villages: [
          { name: 'Bhandardara Dam & Wilson Basin', nameMr: 'भंडारदरा', lat: 19.5312, lng: 73.7612, hazardLevel: 'Red', hazardType: 'Very High Ghat Precipitation' },
          { name: 'Ratanwadi & Harishchandragad Base', nameMr: 'रतनवाडी', lat: 19.5112, lng: 73.6912, hazardLevel: 'Red', hazardType: 'Remote Ghat Rockslide' },
          { name: 'Akole Town Pravara Basin', nameMr: 'अकोले', lat: 19.5412, lng: 73.9312, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Sangamner & Rahata (Shirdi)',
        nameMr: 'संगमनेर व राहाता (शिर्डी)',
        lat: 19.5712,
        lng: 74.2112,
        villages: [
          { name: 'Shirdi Temple Township', nameMr: 'शिर्डी', lat: 19.7645, lng: 74.4776, hazardLevel: 'Green', hazardType: 'Safe Pilgrim Centre' },
          { name: 'Sangamner Pravara Confluence', nameMr: 'संगमनेर', lat: 19.5712, lng: 74.2112, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Nagar Central & Parner',
        nameMr: 'नगर व पारनेर',
        lat: 19.0948,
        lng: 74.7496,
        villages: [
          { name: 'Ahilyanagar City', nameMr: 'अहिल्यानगर शहर', lat: 19.0948, lng: 74.7496, hazardLevel: 'Green' },
          { name: 'Ralegan Siddhi', nameMr: 'राळेगण सिद्धी', lat: 18.9112, lng: 74.4112, hazardLevel: 'Green', hazardType: 'Watershed Benchmark' },
        ],
      },
    ],
  },

  // ==========================================
  // 13. SOLAPUR DISTRICT
  // ==========================================
  {
    id: 'dist-solapur',
    name: 'Solapur',
    nameMr: 'सोलापूर',
    division: 'Pune',
    hq: 'Solapur City',
    lat: 17.6599,
    lng: 75.9064,
    zoom: 11.5,
    talukas: [
      {
        name: 'Pandharpur',
        nameMr: 'पंढरपूर',
        lat: 17.6782,
        lng: 75.3282,
        villages: [
          { name: 'Pandharpur Bhima Chandrabhaga Ghat', nameMr: 'पंढरपूर', lat: 17.6782, lng: 75.3282, hazardLevel: 'Red', hazardType: 'Bhima River Ujani Flood Inundation' },
          { name: 'Wakhari Pilgrimage Encampment', nameMr: 'वाखरी', lat: 17.7112, lng: 75.2812, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Madha (Ujani)',
        nameMr: 'माढा',
        lat: 18.0312,
        lng: 75.5212,
        villages: [
          { name: 'Ujani Dam Spillway Gate Area', nameMr: 'उजनी धरण', lat: 18.0712, lng: 75.1212, hazardLevel: 'Orange', hazardType: 'Dam Discharge Floodway' },
          { name: 'Kurduwadi Junction', nameMr: 'कुर्डुवाडी', lat: 18.0812, lng: 75.4312, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Solapur City & Akkalkot',
        nameMr: 'सोलापूर व अक्कलकोट',
        lat: 17.6599,
        lng: 75.9064,
        villages: [
          { name: 'Solapur North Central', nameMr: 'सोलापूर', lat: 17.6599, lng: 75.9064, hazardLevel: 'Green' },
          { name: 'Akkalkot Holy Shrine', nameMr: 'अक्कलकोट', lat: 17.5212, lng: 76.2012, hazardLevel: 'Green' },
        ],
      },
    ],
  },

  // ==========================================
  // 14. CHHATRAPATI SAMBHAJINAGAR (AURANGABAD)
  // ==========================================
  {
    id: 'dist-aurangabad',
    name: 'Chhatrapati Sambhajinagar',
    nameMr: 'छत्रपती संभाजीनगर',
    division: 'Chhatrapati Sambhajinagar',
    hq: 'Chhatrapati Sambhajinagar',
    lat: 19.8762,
    lng: 75.3433,
    zoom: 11.5,
    talukas: [
      {
        name: 'Aurangabad Central',
        nameMr: 'संभाजीनगर शहर',
        lat: 19.8762,
        lng: 75.3433,
        villages: [
          { name: 'Chhatrapati Sambhajinagar City', nameMr: 'संभाजीनगर', lat: 19.8762, lng: 75.3433, hazardLevel: 'Green' },
          { name: 'Kham River Corridor', nameMr: 'खाम नदी क्षेत्र', lat: 19.8912, lng: 75.3112, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Khuldabad & Kannad',
        nameMr: 'खुलताबाद व कन्नड',
        lat: 20.0092,
        lng: 75.1845,
        villages: [
          { name: 'Ellora Caves (Verul) Scarp', nameMr: 'वेरूळ', lat: 20.0264, lng: 75.1792, hazardLevel: 'Yellow', hazardType: 'Ghat Heritage Buffer' },
          { name: 'Autram Ghat (Kannad Ghat)', nameMr: 'कन्नड घाट', lat: 20.3112, lng: 75.1012, hazardLevel: 'Red', hazardType: 'Ghat Landslide & Choke' },
        ],
      },
      {
        name: 'Paithan',
        nameMr: 'पैठण',
        lat: 19.4792,
        lng: 75.3852,
        villages: [
          { name: 'Jayakwadi Dam (Nath Sagar)', nameMr: 'जायकवाडी धरण', lat: 19.4982, lng: 75.3612, hazardLevel: 'Orange', hazardType: 'Godavari Surplus Discharge' },
          { name: 'Paithan Godavari Ghat', nameMr: 'पैठण शहर', lat: 19.4792, lng: 75.3852, hazardLevel: 'Yellow' },
        ],
      },
    ],
  },

  // ==========================================
  // 15. JALGAON DISTRICT
  // ==========================================
  {
    id: 'dist-jalgaon',
    name: 'Jalgaon',
    nameMr: 'जळगाव',
    division: 'Nashik',
    hq: 'Jalgaon City',
    lat: 21.0077,
    lng: 75.5626,
    zoom: 11.5,
    talukas: [
      {
        name: 'Jalgaon & Bhusawal',
        nameMr: 'जळगाव व भुसावळ',
        lat: 21.0452,
        lng: 75.7912,
        villages: [
          { name: 'Jalgaon City Girna Confluence', nameMr: 'जळगाव', lat: 21.0077, lng: 75.5626, hazardLevel: 'Green' },
          { name: 'Bhusawal Tapi River Bridge', nameMr: 'भुसावळ', lat: 21.0452, lng: 75.7912, hazardLevel: 'Yellow', hazardType: 'Tapi River Floodway' },
          { name: 'Hatnur Dam Reservoir', nameMr: 'हतनूर धरण', lat: 21.2112, lng: 75.9112, hazardLevel: 'Orange' },
        ],
      },
      {
        name: 'Chalisgaon & Pachora',
        nameMr: 'चाळीसगाव व पाचोरा',
        lat: 20.4612,
        lng: 74.9912,
        villages: [
          { name: 'Chalisgaon Titur River Basin', nameMr: 'चाळीसगाव', lat: 20.4612, lng: 74.9912, hazardLevel: 'Red', hazardType: 'Severe Flash Flooding' },
          { name: 'Pachora Junction', nameMr: 'पाचोरा', lat: 20.6712, lng: 75.3512, hazardLevel: 'Green' },
        ],
      },
    ],
  },

  // ==========================================
  // 16. DHULE & NANDURBAR
  // ==========================================
  {
    id: 'dist-dhule-nandurbar',
    name: 'Dhule & Nandurbar',
    nameMr: 'धुळे व नंदुरबार',
    division: 'Nashik',
    hq: 'Dhule / Nandurbar',
    lat: 20.9042,
    lng: 74.7749,
    zoom: 11.5,
    talukas: [
      {
        name: 'Dhule & Shirpur',
        nameMr: 'धुळे व शिरपूर',
        lat: 20.9042,
        lng: 74.7749,
        villages: [
          { name: 'Dhule City Panzara Basin', nameMr: 'धुळे', lat: 20.9042, lng: 74.7749, hazardLevel: 'Yellow' },
          { name: 'Shirpur Pattern Check Dams', nameMr: 'शिरपूर', lat: 21.3512, lng: 74.8812, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Toranmal & Dhadgaon (Satpura)',
        nameMr: 'तोरणमाळ व धडगाव',
        lat: 21.8712,
        lng: 74.4512,
        villages: [
          { name: 'Toranmal Satpura Plateau', nameMr: 'तोरणमाळ', lat: 21.8712, lng: 74.4512, hazardLevel: 'Yellow' },
          { name: 'Dhadgaon (Akrani) Tribal Belt', nameMr: 'धडगाव', lat: 21.6512, lng: 74.2212, hazardLevel: 'Red', hazardType: 'Severe Inaccessibility' },
          { name: 'Nandurbar City', nameMr: 'नंदुरबार', lat: 21.3705, lng: 74.2403, hazardLevel: 'Green' },
        ],
      },
    ],
  },

  // ==========================================
  // 17. MARATHWADA (Nanded, Latur, Beed, Dharashiv, Jalna, Parbhani, Hingoli)
  // ==========================================
  {
    id: 'dist-nanded-latur',
    name: 'Nanded, Latur & Marathwada',
    nameMr: 'नांदेड, लातूर व मराठवाडा',
    division: 'Chhatrapati Sambhajinagar',
    hq: 'Nanded / Latur',
    lat: 19.1383,
    lng: 77.3150,
    zoom: 11.0,
    talukas: [
      {
        name: 'Nanded (Godavari Basin)',
        nameMr: 'नांदेड',
        lat: 19.1383,
        lng: 77.3150,
        villages: [
          { name: 'Nanded City Sachkhand Gurdwara Ghat', nameMr: 'नांदेड', lat: 19.1383, lng: 77.3150, hazardLevel: 'Orange', hazardType: 'Godavari High Watermark' },
          { name: 'Vishnupuri Barrage', nameMr: 'विष्णुपूरी', lat: 19.1112, lng: 77.2912, hazardLevel: 'Orange' },
          { name: 'Kinwat Forest Hill Tract', nameMr: 'किनवट', lat: 19.6212, lng: 78.2012, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Latur & Ausa',
        nameMr: 'लातूर',
        lat: 18.4088,
        lng: 76.5604,
        villages: [
          { name: 'Latur City', nameMr: 'लातूर', lat: 18.4088, lng: 76.5604, hazardLevel: 'Green' },
          { name: 'Killari (1993 Seismic Epicenter)', nameMr: 'किल्लारी', lat: 18.0512, lng: 76.5812, hazardLevel: 'Orange', hazardType: 'Intraplate Seismic Zone' },
        ],
      },
      {
        name: 'Dharashiv (Osmanabad) & Tuljapur',
        nameMr: 'धाराशिव व तुळजापूर',
        lat: 18.1856,
        lng: 76.0419,
        villages: [
          { name: 'Dharashiv City', nameMr: 'धाराशिव', lat: 18.1856, lng: 76.0419, hazardLevel: 'Green' },
          { name: 'Tuljapur Bhavani Temple Environs', nameMr: 'तुळजापूर', lat: 18.0112, lng: 76.0712, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Beed & Parli',
        nameMr: 'बीड व परळी',
        lat: 18.9891,
        lng: 75.7531,
        villages: [
          { name: 'Beed City Bendsura Basin', nameMr: 'बीड', lat: 18.9891, lng: 75.7531, hazardLevel: 'Yellow' },
          { name: 'Parli-Vaijnath Power Hub', nameMr: 'परळी वैजनाथ', lat: 18.8512, lng: 76.5312, hazardLevel: 'Green' },
          { name: 'Ambajogai Heritage Base', nameMr: 'अंबाजोगाई', lat: 18.7312, lng: 76.3812, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Jalna & Parbhani',
        nameMr: 'जालना व परभणी',
        lat: 19.8410,
        lng: 75.8839,
        villages: [
          { name: 'Jalna Steel & Seed Hub', nameMr: 'जालना', lat: 19.8410, lng: 75.8839, hazardLevel: 'Green' },
          { name: 'Parbhani City', nameMr: 'परभणी', lat: 19.2608, lng: 76.7748, hazardLevel: 'Green' },
          { name: 'Aundha Nagnath (Hingoli)', nameMr: 'औंढा नागनाथ', lat: 19.5312, lng: 77.0412, hazardLevel: 'Green' },
        ],
      },
    ],
  },

  // ==========================================
  // 18. VIDARBHA REGION (Nagpur, Amravati, Chandrapur, Gadchiroli, Akola, Buldhana, Yavatmal, Wardha, Bhandara, Gondia)
  // ==========================================
  {
    id: 'dist-nagpur-vidarbha',
    name: 'Nagpur & Vidarbha',
    nameMr: 'नागपूर व विदर्भ',
    division: 'Nagpur',
    hq: 'Nagpur City',
    lat: 21.1458,
    lng: 79.0882,
    zoom: 11.0,
    talukas: [
      {
        name: 'Nagpur Metropolitan',
        nameMr: 'नागपूर शहर',
        lat: 21.1458,
        lng: 79.0882,
        villages: [
          { name: 'Nagpur Zero Mile / Sitabuldi', nameMr: 'नागपूर झिरो माईल', lat: 21.1458, lng: 79.0882, hazardLevel: 'Green', hazardType: 'Geographical Center of India' },
          { name: 'Nag River Corridor', nameMr: 'नाग नदी', lat: 21.1212, lng: 79.1112, hazardLevel: 'Orange', hazardType: 'Urban Cloudburst Flash Flooding' },
          { name: 'Ramtek Historical Hill', nameMr: 'रामटेक', lat: 21.3912, lng: 79.3312, hazardLevel: 'Yellow' },
        ],
      },
      {
        name: 'Amravati & Melghat',
        nameMr: 'अमरावती व मेळघाट',
        lat: 20.9374,
        lng: 77.7523,
        villages: [
          { name: 'Amravati City', nameMr: 'अमरावती', lat: 20.9374, lng: 77.7523, hazardLevel: 'Green' },
          { name: 'Chikhaldara Satpura Plateau', nameMr: 'चिखलदरा', lat: 21.4012, lng: 77.3312, hazardLevel: 'Yellow', hazardType: 'Ghat Landslide & Mist' },
          { name: 'Dharni Melghat Tiger Corridor', nameMr: 'धारणी', lat: 21.4612, lng: 76.9912, hazardLevel: 'Red', hazardType: 'Severe Monsoon Inundation & Isolation' },
        ],
      },
      {
        name: 'Chandrapur & Tadoba',
        nameMr: 'चंद्रपूर',
        lat: 19.9615,
        lng: 79.2961,
        villages: [
          { name: 'Chandrapur City Erai River', nameMr: 'चंद्रपूर', lat: 19.9615, lng: 79.2961, hazardLevel: 'Orange', hazardType: 'Erai Flood & Extreme Heat' },
          { name: 'Ballarpur Industrial Zone', nameMr: 'बल्लारपूर', lat: 19.8512, lng: 79.3412, hazardLevel: 'Green' },
          { name: 'Warora City', nameMr: 'वरोरा', lat: 20.2312, lng: 79.0012, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Gadchiroli Tribal Escarpment',
        nameMr: 'गडचिरोली',
        lat: 20.1809,
        lng: 79.9948,
        villages: [
          { name: 'Gadchiroli District HQ', nameMr: 'गडचिरोली', lat: 20.1809, lng: 79.9948, hazardLevel: 'Yellow' },
          { name: 'Bhamragad (Indravati-Parlkota)', nameMr: 'भामरागड', lat: 19.4612, lng: 80.3512, hazardLevel: 'Red', hazardType: 'Triple River Submersion & Islanding' },
          { name: 'Sironcha (Pranhita-Godavari)', nameMr: 'सिरोंचा', lat: 18.8412, lng: 79.9612, hazardLevel: 'Red', hazardType: 'Backwater Submersion' },
        ],
      },
      {
        name: 'Akola, Buldhana & Washim',
        nameMr: 'अकोला, बुलढाणा व वाशिम',
        lat: 20.7002,
        lng: 77.0082,
        villages: [
          { name: 'Akola City Morna River', nameMr: 'अकोला', lat: 20.7002, lng: 77.0082, hazardLevel: 'Yellow' },
          { name: 'Lonar Crater Rim', nameMr: 'लोणार', lat: 19.9762, lng: 76.5052, hazardLevel: 'Green', hazardType: 'Geo-Heritage Crater' },
          { name: 'Shegaon Holy Center', nameMr: 'शेगाव', lat: 20.7912, lng: 76.6912, hazardLevel: 'Green' },
        ],
      },
      {
        name: 'Wardha, Bhandara & Gondia',
        nameMr: 'वर्धा, भंडारा व गोंदिया',
        lat: 20.7453,
        lng: 78.6022,
        villages: [
          { name: 'Wardha Sevagram Ashram', nameMr: 'वर्धा सेवाग्राम', lat: 20.7453, lng: 78.6022, hazardLevel: 'Green' },
          { name: 'Bhandara Wainganga River Basin', nameMr: 'भंडारा', lat: 21.1714, lng: 79.6547, hazardLevel: 'Orange', hazardType: 'Gosekhurd Dam Backwater' },
          { name: 'Gondia Railway Interchange', nameMr: 'गोंदिया', lat: 21.4598, lng: 80.1961, hazardLevel: 'Green' },
        ],
      },
    ],
  },
];

export interface FlatMaharashtraPlace {
  id: string;
  name: string;
  nameMr: string;
  category: 'District HQ' | 'Taluka / City' | 'Village / Gaon';
  district: string;
  taluka?: string;
  lat: number;
  lng: number;
  zoom: number;
  hazardLevel?: 'Red' | 'Yellow' | 'Orange' | 'Green';
  hazardType?: string;
}

/**
 * Flattens all districts, talukas, and villages/gaons into a quick-searchable directory
 */
export const ALL_MAHARASHTRA_PLACES: FlatMaharashtraPlace[] = (() => {
  const list: FlatMaharashtraPlace[] = [];

  MAHARASHTRA_DISTRICTS_DATA.forEach((d) => {
    // 1. Add District HQ
    list.push({
      id: d.id,
      name: `${d.name} (District HQ)`,
      nameMr: `${d.nameMr} (जिल्हा मुख्यालय)`,
      category: 'District HQ',
      district: d.name,
      lat: d.lat,
      lng: d.lng,
      zoom: d.zoom,
    });

    // 2. Add Talukas
    d.talukas.forEach((t, tIdx) => {
      list.push({
        id: `${d.id}-t-${tIdx}`,
        name: `${t.name} (Taluka)`,
        nameMr: `${t.nameMr} (तालुका)`,
        category: 'Taluka / City',
        district: d.name,
        taluka: t.name,
        lat: t.lat,
        lng: t.lng,
        zoom: t.zoom || 13.5,
      });

      // 3. Add Villages / Gaons
      t.villages.forEach((v, vIdx) => {
        list.push({
          id: `${d.id}-t-${tIdx}-v-${vIdx}`,
          name: `${v.name} (Village)`,
          nameMr: `${v.nameMr} (गाव / पाडा)`,
          category: 'Village / Gaon',
          district: d.name,
          taluka: t.name,
          lat: v.lat,
          lng: v.lng,
          zoom: 15.2,
          hazardLevel: v.hazardLevel,
          hazardType: v.hazardType,
        });
      });
    });
  });

  return list;
})();

