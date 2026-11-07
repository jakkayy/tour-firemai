"""Work out which countries a tour visits from its title.

A title can name several countries, or only cities ("Qingdao", "โอซาก้า"), or be a supplier code
plus a city. Each country below lists the words that point to it: its own names, its well known
cities and sights, and the English spellings. The first key is the name shown on the website.

Precision matters more than recall: a word is only listed if it cannot mean something else, so
"เว้" (Hue, but also "เว้นวรรค") and "โรม" (Rome, but also "โรแมนติก") are left out, and a few
tours stay without a country rather than get a wrong one. The order of the keys is the order of the
filter on the site; lib/countries.ts must list exactly the same names (a test checks that).

Left out on purpose, after checking real titles: "ไคโร" (matched "โมมิจิไคโร", a Japanese maple
walk, in Japan tours) and "เวนิส" (matched "เวนิสต้าเหลียน", Dalian's Venice, in China tours).
"""
import re

from thai_text import normalize_thai

# country shown on the site -> words that mean it. Latin words match whole words, ignoring case.
COUNTRY_KEYWORDS: dict[str, list[str]] = {
    "จีน": [
        "จีน", "China", "ปักกิ่ง", "Beijing", "เซี่ยงไฮ้", "Shanghai", "ฉงชิ่ง", "Chongqing",
        "เฉิงตู", "Chengdu", "คุนหมิง", "Kunming", "ต้าหลี่", "ลี่เจียง", "แชงกรีล่า", "ชิงเต่า",
        "Qingdao", "เยียนไถ", "Yantai", "เว่ยไห่", "Weihai", "หางโจว", "หังโจว", "Hangzhou",
        "จางเจียเจี้ย", "Zhangjiajie", "อี๋ชาง", "หยีชาง", "Yichang", "เอินซือ", "เอินฉือ", "Enshi",
        "กุ้ยหลิน", "Guilin", "กุ้ยหยาง", "Guiyang", "หนานหนิง", "Nanning", "ซีอาน", "Xian", "Xi'an",
        "ฮาร์บิน", "Harbin", "ต้าเหลียน", "Dalian", "เทียนจิน", "Tianjin", "Jiangnan", "Yuncheng",
        "เสฉวน", "ยูนนาน", "หยางซั่ว", "ภูเขาสี่ดรุณี", "หุบเขาสี่ดรุณี", "ปี้เผิงโกว", "อู่หลง", "ต้าจู๋",
    ],
    "ญี่ปุ่น": [
        "ญี่ปุ่น", "Japan", "โตเกียว", "Tokyo", "โอซาก้า", "Osaka", "เกียวโต", "Kyoto", "ฟูจิ", "Fuji",
        "ฮอกไกโด", "Hokkaido", "ซัปโปโร", "Sapporo", "โอตารุ", "Otaru", "ฟุกุโอกะ", "Fukuoka",
        "คุมาโมโตะ", "Kumamoto", "คิตะคิวชู", "Kitakyushu", "เบปปุ", "Beppu", "โออิตะ", "Oita",
        "คิวชู", "Kyushu", "โอกินาว่า", "Okinawa", "นิกโก", "Nikko", "อิบารากิ", "Ibaraki", "เซนได",
        "ทาคายาม่า", "Takayama", "โทยาม่า", "ฮาโกดาเตะ", "อาซาฮิกาว่า", "คาวากุจิโกะ", "Kawaguchiko",
        "คามาคุระ", "โกเบ", "Kobe", "ฮิเมจิ", "Himeji", "นาโกย่า", "Nagoya", "ฮิโรชิม่า", "Hiroshima",
        "Takachiho", "ยามานาชิ",
    ],
    "เกาหลี": ["เกาหลี", "Korea", "Seoul", "ปูซาน", "Busan", "เชจู", "Jeju", "คังวอน", "Gangwon"],
    "ไต้หวัน": ["ไต้หวัน", "Taiwan", "ไทเป", "Taipei"],
    "เวียดนาม": [
        "เวียดนาม", "Vietnam", "เวียดกลาง", "ดานัง", "Danang", "Da Nang", "ฮอยอัน", "บานาฮิลล์",
        "บาน่าฮิลล์", "ฮานอย", "Hanoi", "ซาปา", "Sapa", "ฟูก๊วก", "Phu Quoc", "ดาลัด", "Dalat",
        "นาตรัง", "โฮจิมินห์", "ฮาลอง", "Halong",
    ],
    "สิงคโปร์": ["สิงคโปร์", "Singapore"],
    "มาเลเซีย": ["มาเลเซีย", "Malaysia", "ปีนัง", "กัวลาลัมเปอร์", "คาเมรอน", "เก็นติ้ง", "Genting"],
    "ฮ่องกง": ["ฮ่องกง", "Hong Kong", "HongKong"],
    "พม่า": ["พม่า", "เมียนมาร์", "เมียนมา", "Myanmar", "ย่างกุ้ง", "พุกาม"],
    "กัมพูชา": ["กัมพูชา", "Cambodia", "เสียมเรียบ", "นครวัด"],
    "อินโดนีเซีย": ["อินโดนีเซีย", "Indonesia", "บาหลี", "Bali"],
    "ฟิลิปปินส์": ["ฟิลิปปินส์", "Philippines", "โบราคาย", "Boracay"],
    "อินเดีย": ["อินเดีย", "India", "แคชเมียร์", "Kashmir", "ศรีนาการ์", "ชัยปุระ"],
    "ยุโรป": ["ยุโรป", "Europe", "สแกนดิเนเวีย", "Scandinavia"],  # a region, also implied by the countries below
    "อังกฤษ": ["อังกฤษ", "England", "สหราชอาณาจักร", "ลอนดอน", "London", "สกอตแลนด์"],
    "ฝรั่งเศส": ["ฝรั่งเศส", "France", "ปารีส", "Paris"],
    "อิตาลี": ["อิตาลี", "Italy", "มิลาน", "ฟลอเรนซ์"],
    "สวิตเซอร์แลนด์": ["สวิตเซอร์แลนด์", "Switzerland", "สวิตฯ", "สวิส", "ลูเซิร์น"],
    "ตุรกี": ["ตุรกี", "ตุรเคีย", "Turkey", "Türkiye", "อิสตันบูล", "คัปปาโดเกีย"],
    "ออสเตรเลีย": ["ออสเตรเลีย", "Australia", "ซิดนีย์", "เมลเบิร์น"],
    "นิวซีแลนด์": ["นิวซีแลนด์", "New Zealand"],
    "รัสเซีย": [
        "รัสเซีย", "Russia", "มอสโก", "มอสโคว", "Moscow", "มูร์มันสค์", "Murmansk", "เซนต์ปีเตอร์สเบิร์ก",
    ],
    "อียิปต์": ["อียิปต์", "Egypt", "Cairo"],
    "จอร์เจีย": ["จอร์เจีย", "ทบิลิซี", "Tbilisi", "บาทูมี"],
    "คาซัคสถาน": ["คาซัคสถาน", "Kazakhstan", "Kazakh", "คาซัค", "อัลมาตี", "Almaty", "ชารินแคนยอน"],
    "คีร์กีซสถาน": ["คีร์กีซสถาน", "Kyrgyz", "Kyrgyzstan", "บิชเคก"],
    "มองโกเลีย": ["มองโกเลีย", "Mongolia", "อูลานบาตอร์", "Ulaanbaatar"],
    "จอร์แดน": ["จอร์แดน", "อัมมาน", "เพตรา"],
    "โมร็อกโก": ["โมร็อกโก", "โมรอคโค", "Morocco", "มาร์ราเกช"],
    "เนเธอร์แลนด์": ["เนเธอร์แลนด์", "Netherlands", "ฮอลแลนด์", "แอมสเตอร์ดัม", "ฮาเล็ม", "ฮาร์เล็ม"],
    "เบลเยียม": ["เบลเยียม", "Belgium", "บรัสเซลส์"],
    "เยอรมนี": ["เยอรมนี", "เยอรมัน", "Germany", "มิวนิค"],
    "ออสเตรีย": ["ออสเตรีย", "Austria", "เวียนนา"],
    "สเปน": ["สเปน", "Spain", "มาดริด", "บาร์เซโลนา"],
    "โปแลนด์": ["โปแลนด์", "Poland", "วอร์ซอ"],
    "ไอซ์แลนด์": ["ไอซ์แลนด์", "Iceland"],
    "เดนมาร์ก": ["เดนมาร์ก", "เดนมาร์ค", "Denmark"],
    "นอร์เวย์": ["นอร์เวย์", "นอร์เวย", "Norway"],
    "สวีเดน": ["สวีเดน", "Sweden"],
    "ฟินแลนด์": ["ฟินแลนด์", "Finland"],
    "กรีซ": ["กรีซ", "Greece"],
    "โปรตุเกส": ["โปรตุเกส", "Portugal"],
    "ฮังการี": ["ฮังการี", "Hungary"],
    "เนปาล": ["เนปาล", "Nepal"],
    "ภูฏาน": ["ภูฏาน", "Bhutan"],
    "ศรีลังกา": ["ศรีลังกา", "Sri Lanka"],
    "มัลดีฟส์": ["มัลดีฟส์", "Maldives"],
}

REGION = "ยุโรป"

# Countries that make a tour a Europe tour even when the word "ยุโรป" is not in the title,
# so filtering by Europe finds them. (Turkey, Russia and Georgia straddle the border and are left out.)
EUROPEAN_COUNTRIES = {
    "อังกฤษ", "ฝรั่งเศส", "อิตาลี", "สวิตเซอร์แลนด์", "เนเธอร์แลนด์", "เบลเยียม", "เยอรมนี", "ออสเตรีย",
    "สเปน", "โปแลนด์", "ไอซ์แลนด์", "เดนมาร์ก", "นอร์เวย์", "สวีเดน", "ฟินแลนด์", "กรีซ", "โปรตุเกส", "ฮังการี",
}

# Phrases that contain a country word without meaning that country, e.g. a China tour admiring
# "European architecture". They are blanked out before looking for countries.
IGNORED_PHRASES = ["สถาปัตยกรรมยุโรป", "ฟิลยุโรป"]


def _compile(words: list[str]) -> re.Pattern[str]:
    parts = []
    for word in words:
        if word.isascii():
            # whole words only, so "Nara" cannot match inside "Narita"; spaces may be any run of spaces
            body = r"\s+".join(re.escape(piece) for piece in word.split())
            parts.append(rf"(?<![A-Za-z]){body}(?![A-Za-z])")
        else:
            parts.append(re.escape(normalize_thai(word)))
    return re.compile("|".join(parts), re.IGNORECASE)


_PATTERNS = {country: _compile(words) for country, words in COUNTRY_KEYWORDS.items()}
COUNTRIES: list[str] = list(COUNTRY_KEYWORDS)


def detect_countries(title: str) -> list[str]:
    """Countries a tour visits, in the order the title first mentions them.

    The "ยุโรป" region is added at the end when the tour names a European country but not the
    region itself, so a filter on Europe also finds tours listed by country.
    """
    text = normalize_thai(title)
    for phrase in IGNORED_PHRASES:
        text = text.replace(normalize_thai(phrase), " ")

    hits: list[tuple[int, str]] = []
    for country, pattern in _PATTERNS.items():
        match = pattern.search(text)
        if match:
            hits.append((match.start(), country))
    found = [country for _, country in sorted(hits)]
    if REGION not in found and any(country in EUROPEAN_COUNTRIES for country in found):
        found.append(REGION)
    return found
