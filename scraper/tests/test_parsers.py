from datetime import date

from scrapers.travelzeed import _parse_price as tz_price
from scrapers.travelzeed import _parse_departure as tz_departure
from scrapers.unithai import _parse_price as ut_price
from scrapers.unithai import _parse_departure as ut_departure
from scrapers.mushroom import _parse_price as mm_price
from scrapers.mushroom import _parse_departure as mm_departure
from scrapers.thaifly import _parse_price as tf_price
from scrapers.thaifly import _parse_thai_date as tf_date
from scrapers.qualityexpress import _parse_price as qe_price
from scrapers.qualityexpress import _parse_departure as qe_departure
from scrapers.navarich import _parse_price as nr_price
from scrapers.navarich import _parse_departure as nr_departure


# ---------------------------------------------------------------------------
# TravelZeed
# ---------------------------------------------------------------------------

class TestTravelzeedParsePrice:
    def test_basic(self):
        assert tz_price("5,990") == 5990.0

    def test_with_decimal(self):
        assert tz_price("5,990.50") == 5990.5

    def test_baht_symbol(self):
        assert tz_price("฿5,990") == 5990.0

    def test_empty(self):
        assert tz_price("") is None

    def test_non_numeric(self):
        assert tz_price("N/A") is None

    def test_whitespace(self):
        assert tz_price("  ") is None


class TestTravelzeedParseDeparture:
    def test_basic(self):
        assert tz_departure("ก.ค. 69", "15") == date(2026, 7, 15)

    def test_range_hyphen(self):
        assert tz_departure("ก.ค. 69", "15-17") == date(2026, 7, 15)

    def test_range_em_dash(self):
        assert tz_departure("ก.ค. 69", "5–10") == date(2026, 7, 5)

    def test_year_70(self):
        assert tz_departure("ม.ค. 70", "1") == date(2027, 1, 1)

    def test_invalid_month(self):
        assert tz_departure("zzz. 69", "15") is None

    def test_invalid_day(self):
        assert tz_departure("ก.ค. 69", "abc") is None

    def test_overflow_day(self):
        assert tz_departure("ก.ค. 69", "32") is None

    def test_empty_month_text(self):
        assert tz_departure("", "15") is None


# ---------------------------------------------------------------------------
# UniThai
# ---------------------------------------------------------------------------

class TestUniThaiParsePrice:
    def test_basic(self):
        assert ut_price("10,990") == 10990.0

    def test_with_thai_text(self):
        assert ut_price("10,990 บาท") == 10990.0

    def test_baht_symbol(self):
        assert ut_price("฿10,990") == 10990.0

    def test_empty(self):
        assert ut_price("") is None


class TestUniThaiParseDeparture:
    def _expected(self, month: int, day: int) -> date:
        today = date.today()
        d = date(today.year, month, day)
        if d < today:
            d = date(today.year + 1, month, day)
        return d

    def test_range_two_months(self):
        # "28 มิ.ย – 03 ก.ค" — takes first day and first month
        assert ut_departure("28 มิ.ย – 03 ก.ค") == self._expected(6, 28)

    def test_range_single_month(self):
        # "04 – 07 ก.ค" — month comes after last day only
        assert ut_departure("04 – 07 ก.ค") == self._expected(7, 4)

    def test_invalid(self):
        assert ut_departure("invalid text") is None

    def test_empty(self):
        assert ut_departure("") is None


# ---------------------------------------------------------------------------
# Mushroom
# ---------------------------------------------------------------------------

class TestMushroomParsePrice:
    def test_basic(self):
        assert mm_price("5,990") == 5990.0

    def test_with_thai_text(self):
        assert mm_price("5,990 บาท") == 5990.0

    def test_empty(self):
        assert mm_price("") is None


class TestMushroomParseDeparture:
    def test_basic(self):
        assert mm_departure("3 ก.ค. 69 - 24 ต.ค. 69") == date(2026, 7, 3)

    def test_january(self):
        assert mm_departure("1 ม.ค. 70 - 7 ม.ค. 70") == date(2027, 1, 1)

    def test_invalid(self):
        assert mm_departure("invalid") is None

    def test_overflow_day(self):
        assert mm_departure("32 ก.ค. 69 - ignored") is None

    def test_empty(self):
        assert mm_departure("") is None


# ---------------------------------------------------------------------------
# ThaiFlY
# ---------------------------------------------------------------------------

class TestThaiFlYParsePrice:
    def test_basic(self):
        assert tf_price("5,990") == 5990.0

    def test_with_decimal(self):
        assert tf_price("5,990.50") == 5990.5

    def test_empty(self):
        assert tf_price("") is None


class TestThaiFlYParseThaiDate:
    def test_two_digit_be_year(self):
        # 68 + 2500 - 543 = 2025
        assert tf_date("15 มิ.ย. 68") == date(2025, 6, 15)

    def test_four_digit_ce_year(self):
        assert tf_date("15 มิ.ย. 2025") == date(2025, 6, 15)

    def test_invalid_text(self):
        assert tf_date("invalid") is None

    def test_unknown_month(self):
        assert tf_date("15 บอก. 68") is None

    def test_overflow_day(self):
        # Feb 31 is not a real date
        assert tf_date("31 ก.พ. 69") is None


# ---------------------------------------------------------------------------
# QualityExpress
# ---------------------------------------------------------------------------

class TestQualityExpressParsePrice:
    def test_basic(self):
        assert qe_price("57,900") == 57900.0

    def test_with_symbol_and_dash(self):
        # "฿ 57,900.-" — all non-digits stripped
        assert qe_price("฿ 57,900.-") == 57900.0

    def test_empty(self):
        assert qe_price("") is None


class TestQualityExpressParseDeparture:
    def test_range_takes_first(self):
        # 2569 - 543 = 2026
        assert qe_departure("สิงหาคม 2569 - กันยายน 2569") == date(2026, 8, 1)

    def test_single_month(self):
        assert qe_departure("มีนาคม 2569") == date(2026, 3, 1)

    def test_july(self):
        assert qe_departure("กรกฎาคม 2569") == date(2026, 7, 1)

    def test_unknown_month(self):
        assert qe_departure("UnknownMonth 2569") is None

    def test_year_before_threshold(self):
        # year_be < 2560 → None
        assert qe_departure("มกราคม 2559") is None

    def test_empty(self):
        assert qe_departure("") is None


# ---------------------------------------------------------------------------
# Navarich
# ---------------------------------------------------------------------------

class TestNavarichParsePrice:
    def test_basic(self):
        assert nr_price("10,990") == 10990.0

    def test_with_thai_text(self):
        assert nr_price("5,990 บาท") == 5990.0

    def test_empty(self):
        assert nr_price("") is None


class TestNavarichParseDeparture:
    def test_basic(self):
        # "27 มิ.ย. 69 - 03 ก.ค. 69" — take first date
        assert nr_departure("27 มิ.ย. 69 - 03 ก.ค. 69") == date(2026, 6, 27)

    def test_january(self):
        assert nr_departure("01 ม.ค. 70 - 07 ม.ค. 70") == date(2027, 1, 1)

    def test_invalid(self):
        assert nr_departure("invalid text") is None

    def test_empty(self):
        assert nr_departure("") is None
