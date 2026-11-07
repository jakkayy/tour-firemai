from thai_text import normalize_thai


def _scraped(*hex_codes: str) -> str:
    return "".join(chr(int(code, 16)) for code in hex_codes)


# "ญี่ปุ่น" exactly as some sites send it: tone mark (0E48) before the lower vowel (0E38)
SCRAPED_JAPAN = _scraped("0E0D", "0E35", "0E48", "0E1B", "0E48", "0E38", "0E19")
CORRECT_JAPAN = _scraped("0E0D", "0E35", "0E48", "0E1B", "0E38", "0E48", "0E19")


def test_the_scraped_spelling_does_not_match_a_search_for_it():
    # the bug this module exists for: identical on screen, different characters
    assert SCRAPED_JAPAN != CORRECT_JAPAN
    assert "ญี่ปุ่น" not in f"ทัวร์{SCRAPED_JAPAN} โตเกียว"


def test_puts_the_vowel_sign_before_the_tone_mark():
    assert normalize_thai(SCRAPED_JAPAN) == CORRECT_JAPAN
    assert "ญี่ปุ่น" in normalize_thai(f"ทัวร์{SCRAPED_JAPAN} โตเกียว")


def test_already_correct_text_is_unchanged_and_the_fix_is_idempotent():
    assert normalize_thai(CORRECT_JAPAN) == CORRECT_JAPAN
    once = normalize_thai(f"ทัวร์{SCRAPED_JAPAN}")
    assert normalize_thai(once) == once


def test_leaves_spacing_vowels_and_other_scripts_alone():
    assert normalize_thai("น้ำ") == "น้ำ"  # tone mark before sara am is the normal order
    assert normalize_thai("Tokyo 5D4N ทัวร์ BY VZ") == "Tokyo 5D4N ทัวร์ BY VZ"
    assert normalize_thai("") == ""


def test_handles_several_marks_in_a_row():
    # tone + upper vowel + thanthakhat on one letter -> vowel, tone, then the rest
    messy = _scraped("0E01", "0E4C", "0E48", "0E34")
    assert normalize_thai(messy) == _scraped("0E01", "0E34", "0E48", "0E4C")
