/**
 * Unified regions list for Uzbekistan (Toshkent viloyati focus).
 * Used across profile settings, questionnaire, requests, etc.
 */

export interface Region {
  value: string;
  label: string;
  isCapital?: boolean;
  districts?: string[];
}

export const TOSHKENT_DISTRICTS = [
  "Bektemir",
  "Chilonzor",
  "Mirobod",
  "Mirzo Ulug'bek",
  "Olmazor",
  "Sergeli",
  "Shayxontohur",
  "Uchtepa",
  "Yakkasaroy",
  "Yangihayot",
  "Yashnobod",
  "Yunusobod",
];

export const regionsList: Region[] = [
  {
    value: "Toshkent shahri",
    label: "Toshkent shahri",
    isCapital: true,
    districts: TOSHKENT_DISTRICTS,
  },
  { value: "Angren", label: "Angren" },
  { value: "Bekobod", label: "Bekobod" },
  { value: "Bo'ka", label: "Bo'ka" },
  { value: "Bo'stonliq", label: "Bo'stonliq" },
  { value: "Chinoz", label: "Chinoz" },
  { value: "Chirchiq", label: "Chirchiq" },
  { value: "Chorvoq", label: "Chorvoq" },
  { value: "Do'stobod", label: "Do'stobod" },
  { value: "G'azalkent", label: "G'azalkent" },
  { value: "Keles", label: "Keles" },
  { value: "Ohangaron", label: "Ohangaron" },
  { value: "Olmaliq", label: "Olmaliq" },
  { value: "Oqqo'rg'on", label: "Oqqo'rg'on" },
  { value: "O'rta Chirchiq", label: "O'rta Chirchiq" },
  { value: "Parkent", label: "Parkent" },
  { value: "Piskent", label: "Piskent" },
  { value: "Qibray", label: "Qibray" },
  { value: "Quyi Chirchiq", label: "Quyi Chirchiq" },
  { value: "To'ytepa", label: "To'ytepa" },
  { value: "Yangiobod", label: "Yangiobod" },
  { value: "Yangiyо'l", label: "Yangiyо'l" },
  { value: "Yuqori Chirchiq", label: "Yuqori Chirchiq" },
  { value: "Zangiota", label: "Zangiota" },
];
