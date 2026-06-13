export const COUNTRY_LIST = [
  "จีน", "ญี่ปุ่น", "เกาหลี", "ไต้หวัน", "เวียดนาม",
  "สิงคโปร์", "มาเลเซีย", "ฮ่องกง", "พม่า", "กัมพูชา",
  "อินโดนีเซีย", "ฟิลิปปินส์", "อินเดีย", "ยุโรป", "อังกฤษ",
  "ฝรั่งเศส", "อิตาลี", "สวิตเซอร์แลนด์", "ตุรกี", "ออสเตรเลีย",
]

export function extractCountry(title: string): string | null {
  for (const c of COUNTRY_LIST) {
    if (title.includes(c)) return c
  }
  return null
}
