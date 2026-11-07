# Thai text from some sites stores a tone mark before the vowel sign it sits on ("ป" + "่" + "ุ"
# instead of "ป" + "ุ" + "่"). It looks identical on screen but never matches a search for
# "ญี่ปุ่น", so titles are put in the usual order before they are stored or inspected.

_VOWEL_SIGNS = {0x0E31, *range(0x0E34, 0x0E3B), 0x0E47}  # ั ิ ี ึ ื ุ ู ฺ ็
_TONE_MARKS = set(range(0x0E48, 0x0E4C))  # ่ ้ ๊ ๋
_OTHER_MARKS = set(range(0x0E4C, 0x0E4F))  # ์ ํ ๎


def _rank(char: str) -> int:
    code = ord(char)
    if code in _VOWEL_SIGNS:
        return 0
    if code in _TONE_MARKS:
        return 1
    return 2


def normalize_thai(text: str) -> str:
    """Order the combining marks after each Thai letter as vowel sign, tone mark, then the rest.

    Spacing vowels (such as sara am) and everything that is not Thai are left alone.
    """
    out: list[str] = []
    run: list[str] = []
    for char in text:
        if ord(char) in _VOWEL_SIGNS or ord(char) in _TONE_MARKS or ord(char) in _OTHER_MARKS:
            run.append(char)
            continue
        if run:
            out.extend(sorted(run, key=_rank))
            run = []
        out.append(char)
    out.extend(sorted(run, key=_rank))
    return "".join(out)
