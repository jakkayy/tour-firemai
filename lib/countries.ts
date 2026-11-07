// Keep COUNTRY_LIST and EUROPEAN_COUNTRIES identical to scraper/countries.py: the scraper stores each
// tour's countries using those names, and a test fails if the two lists drift apart.
export const COUNTRY_LIST = [
  "จีน", "ญี่ปุ่น", "เกาหลี", "ไต้หวัน", "เวียดนาม",
  "สิงคโปร์", "มาเลเซีย", "ฮ่องกง", "พม่า", "กัมพูชา",
  "อินโดนีเซีย", "ฟิลิปปินส์", "อินเดีย", "ยุโรป", "อังกฤษ",
  "ฝรั่งเศส", "อิตาลี", "สวิตเซอร์แลนด์", "ตุรกี", "ออสเตรเลีย",
  "นิวซีแลนด์", "รัสเซีย", "อียิปต์", "จอร์เจีย", "คาซัคสถาน",
  "คีร์กีซสถาน", "มองโกเลีย", "จอร์แดน", "โมร็อกโก", "เนเธอร์แลนด์",
  "เบลเยียม", "เยอรมนี", "ออสเตรีย", "สเปน", "โปแลนด์",
  "ไอซ์แลนด์", "เดนมาร์ก", "นอร์เวย์", "สวีเดน", "ฟินแลนด์",
  "กรีซ", "โปรตุเกส", "ฮังการี", "เนปาล", "ภูฏาน",
  "ศรีลังกา", "มัลดีฟส์",
]

const EUROPEAN_COUNTRIES = [
  "อังกฤษ", "ฝรั่งเศส", "อิตาลี", "สวิตเซอร์แลนด์", "เนเธอร์แลนด์",
  "เบลเยียม", "เยอรมนี", "ออสเตรีย", "สเปน", "โปแลนด์",
  "ไอซ์แลนด์", "เดนมาร์ก", "นอร์เวย์", "สวีเดน", "ฟินแลนด์",
  "กรีซ", "โปรตุเกส", "ฮังการี",
]

// What to print on a card: the tour's countries minus the "ยุโรป" region when it already names
// specific European countries (it adds nothing and uses up a slot). The filter keeps "ยุโรป" as an
// option, so this is for display only.
export function countriesToShow(countries: string[]): string[] {
  return countries.some((c) => EUROPEAN_COUNTRIES.includes(c)) ? countries.filter((c) => c !== "ยุโรป") : countries
}

// Phrases that contain a country name without meaning that country, e.g. a China tour admiring
// "European architecture".
const IGNORED_PHRASES = ["สถาปัตยกรรมยุโรป", "ฟิลยุโรป"]

// Countries named in a title, in the order the title mentions them. Only a fallback for a database that
// has no `countries` column yet (before migration 008): the scraper's richer detection normally decides.
export function extractCountries(title: string): string[] {
  let text = title
  for (const phrase of IGNORED_PHRASES) text = text.split(phrase).join(" ")
  return COUNTRY_LIST.map((country) => ({ country, at: text.indexOf(country) }))
    .filter((hit) => hit.at !== -1)
    .sort((a, b) => a.at - b.at)
    .map((hit) => hit.country)
}
