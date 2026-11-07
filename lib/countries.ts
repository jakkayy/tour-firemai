export const COUNTRY_LIST = [
  "จีน", "ญี่ปุ่น", "เกาหลี", "ไต้หวัน", "เวียดนาม",
  "สิงคโปร์", "มาเลเซีย", "ฮ่องกง", "พม่า", "กัมพูชา",
  "อินโดนีเซีย", "ฟิลิปปินส์", "อินเดีย", "ยุโรป", "อังกฤษ",
  "ฝรั่งเศส", "อิตาลี", "สวิตเซอร์แลนด์", "ตุรกี", "ออสเตรเลีย",
]

// Phrases that contain a country name without meaning that country, e.g. a China tour
// admiring "European architecture". Only used when working out which countries a tour is in.
const IGNORED_PHRASES = ["สถาปัตยกรรมยุโรป", "ฟิลยุโรป"]

// Every country named in a title, in the order the title mentions them, so a
// "ทัวร์สวิตเซอร์แลนด์ – ฝรั่งเศส – อิตาลี" tour starts with Switzerland.
export function extractCountries(title: string): string[] {
  let text = title
  for (const phrase of IGNORED_PHRASES) text = text.split(phrase).join(" ")
  return COUNTRY_LIST.map((country) => ({ country, at: text.indexOf(country) }))
    .filter((hit) => hit.at !== -1)
    .sort((a, b) => a.at - b.at)
    .map((hit) => hit.country)
}

const EUROPEAN_COUNTRIES = ["อังกฤษ", "ฝรั่งเศส", "อิตาลี", "สวิตเซอร์แลนด์"]

// What to print on a card: the same countries, minus the "ยุโรป" region when a tour already names
// specific European countries (it adds nothing and uses up a slot). The filter keeps "ยุโรป" as an
// option, so this is for display only.
export function countriesToShow(title: string): string[] {
  const all = extractCountries(title)
  return all.some((c) => EUROPEAN_COUNTRIES.includes(c)) ? all.filter((c) => c !== "ยุโรป") : all
}
