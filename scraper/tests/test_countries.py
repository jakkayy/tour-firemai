import re
from pathlib import Path

import pytest

import countries as C
from countries import COUNTRIES, COUNTRY_KEYWORDS, EUROPEAN_COUNTRIES, REGION, detect_countries
from thai_text import normalize_thai

# "ญี่ปุ่น" with the tone mark before the vowel, as TravelZeed and Navarich send it
SCRAPED_JAPAN = "".join(chr(int(c, 16)) for c in "0E0D 0E35 0E48 0E1B 0E48 0E38 0E19".split())


@pytest.mark.parametrize(
    "title, expected",
    [
        # several countries, in the order the title mentions them; Europe is implied
        ("ทัวร์สวิตเซอร์แลนด์ – ฝรั่งเศส - อิตาลี มงบล็องตระการตา", ["สวิตเซอร์แลนด์", "ฝรั่งเศส", "อิตาลี", "ยุโรป"]),
        ("ทัวร์ยุโรป ฝรั่งเศส อิตาลี สวิตเซอร์แลนด์ 10 วัน", ["ยุโรป", "ฝรั่งเศส", "อิตาลี", "สวิตเซอร์แลนด์"]),
        # the scraped spelling that used to be missed
        (f"ทัวร์{SCRAPED_JAPAN} โอซาก้า เกียวโต โทฟุคุจิ", ["ญี่ปุ่น"]),
        # supplier codes plus a city, in English or Thai
        ("TAOVZ0126 : Qingdao ซุปตาร์...ปลายคลื่นสามเมืองซานตงชิงเต่า BY VZ", ["จีน"]),
        ("PJPFUK74-VZ : Pro Fukuoka Kumamoto Kitakyushu Beppu Oita Full Day BY VZ", ["ญี่ปุ่น"]),
        ("DADVN0526 : ซุปตาร์...เช็กอินเหนือเมฆ ดานัง บานาฮิลล์", ["เวียดนาม"]),
        ("SPHZ-M9 : Cameron Genting Odyssey Malaysia BY MH", ["มาเลเซีย"]),
        ("tokyo autumn", ["ญี่ปุ่น"]),  # case does not matter for English words
        # alternative spellings
        ("ทัวร์ตุรเคีย อิสตันบูล คัปปาโดเกีย", ["ตุรกี"]),
        ("ทัวร์เมียนมาร์ ย่างกุ้ง", ["พม่า"]),
        ("ทัวร์แกรนด์แคชเมียร์ ศรีนาการ์", ["อินเดีย"]),
        # a country mentioned only through its name, several of them
        ("ทัวร์เยอรมนี ออสเตรีย เนเธอร์แลนด์ เบลเยียม 6 วัน", ["เยอรมนี", "ออสเตรีย", "เนเธอร์แลนด์", "เบลเยียม", "ยุโรป"]),
        # a region word alone, and Scandinavia
        ("ทัวร์ยุโรป ฮังการี", ["ยุโรป", "ฮังการี"]),
        ("ทัวร์สแกนดิเนเวีย เดนมาร์ค - นอร์เวย์ –สวีเดน", ["ยุโรป", "เดนมาร์ก", "นอร์เวย์", "สวีเดน"]),
    ],
)
def test_detects_the_countries_of_real_titles(title, expected):
    assert detect_countries(title) == expected


@pytest.mark.parametrize(
    "title, expected",
    [
        # found in real titles: these words look like a country but are not
        ("ทัวร์จีน ชิงเต่า สัมผัสเสน่ห์แดนมังกร ชมสถาปัตยกรรมยุโรป (ไม่ลงร้าน)", ["จีน"]),
        ("WSTHT-CX : ฮ่องกง-ชิงเต่า-เที่ยวจีนฟิลยุโรป *ทัวร์ไม่ลงร้าน* BY CX", ["ฮ่องกง", "จีน"]),
        ("ทัวร์ญี่ปุ่น โตเกียว ใบไม้เปลี่ยนสี อุโมงค์ใบเมเปิ้ลโมมิจิไคโร", ["ญี่ปุ่น"]),  # "ไคโร" is not Egypt
        ("ทัวร์จีน เยียนไถ เว่ยไห่ ชิงเต่า เวนิสต้าเหลียน พิพิธภัณฑ์เบียร์", ["จีน"]),  # "เวนิส" is not Italy
        # short words that appear inside ordinary Thai words are not listed at all
        ("เช็กอินเมืองดัง ครบจบทั้งภูเขา ทะเลสาบ และแฟชั่น", []),
        ("ทัวร์โรแมนติก เว้นวรรค", []),
        # English words only count as whole words
        ("Chinatown food tour", []),
        ("Parisian cafes", []),
        # a title that names no place
        ("สวยของจริงไม่อิงฟิลเตอร์ เที่ยวคุ้มจนงง BY G9", []),
        ("", []),
    ],
)
def test_does_not_label_a_tour_with_the_wrong_country(title, expected):
    assert detect_countries(title) == expected


def test_turkey_russia_and_georgia_do_not_make_a_tour_a_europe_tour():
    for title in ("ทัวร์ตุรกี อิสตันบูล", "ทัวร์รัสเซีย มอสโก", "ทัวร์จอร์เจีย ทบิลิซี"):
        assert REGION not in detect_countries(title)


def test_europe_is_not_added_twice():
    found = detect_countries("ทัวร์ยุโรป ฝรั่งเศส")
    assert found.count(REGION) == 1


def test_no_word_belongs_to_two_countries():
    seen: dict[str, str] = {}
    for country, words in COUNTRY_KEYWORDS.items():
        for word in words:
            key = normalize_thai(word).lower()
            assert key not in seen, f"{word!r} is listed under both {seen[key]} and {country}"
            seen[key] = country


def test_the_european_set_only_names_listed_countries():
    assert EUROPEAN_COUNTRIES <= set(COUNTRIES)
    assert REGION in COUNTRIES and REGION not in EUROPEAN_COUNTRIES


# --- the website filters on these same names -------------------------------------------------

def _ts_array(source: str, name: str) -> list[str]:
    block = re.search(rf"{name}\s*=\s*\[(.*?)\]", source, re.S)
    assert block, f"{name} not found in lib/countries.ts"
    return re.findall(r'"([^"]+)"', block.group(1))


def test_website_lists_match_the_scraper_lists():
    source = (Path(__file__).resolve().parents[2] / "lib" / "countries.ts").read_text(encoding="utf-8")
    assert _ts_array(source, "COUNTRY_LIST") == COUNTRIES
    assert set(_ts_array(source, "EUROPEAN_COUNTRIES")) == EUROPEAN_COUNTRIES
    assert _ts_array(source, "IGNORED_PHRASES") == C.IGNORED_PHRASES


# --- flags ---------------------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parents[2]


def _country_codes() -> dict[str, str]:
    source = (ROOT / "lib" / "countries.ts").read_text(encoding="utf-8")
    block = re.search(r"COUNTRY_CODES[^=]*=\s*\{(.*?)\}", source, re.S)
    assert block, "COUNTRY_CODES not found in lib/countries.ts"
    return dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', block.group(1)))


def test_every_country_has_a_flag_code_and_nothing_else_does():
    assert list(_country_codes()) == COUNTRIES


def test_flag_codes_look_like_iso_codes_and_are_not_reused():
    codes = list(_country_codes().values())
    assert all(re.fullmatch(r"[a-z]{2}", code) for code in codes)
    assert len(codes) == len(set(codes))


def test_every_flag_code_has_a_file_and_every_file_is_used():
    codes = set(_country_codes().values())
    files = {p.stem for p in (ROOT / "public" / "flags").glob("*.svg")}
    assert codes - files == set(), "flag files missing"
    assert files - codes == set(), "flag files nobody uses"
    for code in codes:
        text = (ROOT / "public" / "flags" / f"{code}.svg").read_text(encoding="utf-8")
        assert text.lstrip().startswith("<svg") and "viewBox" in text
