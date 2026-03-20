/**
 * Vietnamese Text Normalizer
 * Converts numbers, dates, times, currency, phone numbers, Roman numerals to spoken Vietnamese words
 * Based on nghists vietnamese-processor.js
 */

const DIGITS: Record<string, string> = {
  "0": "không",
  "1": "một",
  "2": "hai",
  "3": "ba",
  "4": "bốn",
  "5": "năm",
  "6": "sáu",
  "7": "bảy",
  "8": "tám",
  "9": "chín",
};

const TEENS: Record<string, string> = {
  "10": "mười",
  "11": "mười một",
  "12": "mười hai",
  "13": "mười ba",
  "14": "mười bốn",
  "15": "mười lăm",
  "16": "mười sáu",
  "17": "mười bảy",
  "18": "mười tám",
  "19": "mười chín",
};

const TENS: Record<string, string> = {
  "2": "hai mươi",
  "3": "ba mươi",
  "4": "bốn mươi",
  "5": "năm mươi",
  "6": "sáu mươi",
  "7": "bảy mươi",
  "8": "tám mươi",
  "9": "chín mươi",
};

export interface NormalizerConfig {
  UnlimitedRomanNumerals?: boolean;
}

function numberToWords(numStr: string): string {
  numStr = numStr.replace(/^0+/, "") || "0";

  if (numStr.startsWith("-")) {
    return "âm " + numberToWords(numStr.substring(1));
  }

  let num: number;
  try {
    num = parseInt(numStr, 10);
  } catch {
    return numStr;
  }

  if (num === 0) return "không";
  if (num < 10) return DIGITS[String(num)];
  if (num < 20) return TEENS[String(num)];

  if (num < 100) {
    const tens = Math.floor(num / 10);
    const units = num % 10;
    if (units === 0) return TENS[String(tens)];
    if (units === 1) return TENS[String(tens)] + " mốt";
    if (units === 4) return TENS[String(tens)] + " tư";
    if (units === 5) return TENS[String(tens)] + " lăm";
    return TENS[String(tens)] + " " + DIGITS[String(units)];
  }

  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    let result = DIGITS[String(hundreds)] + " trăm";
    if (remainder === 0) return result;
    if (remainder < 10) return result + " lè " + DIGITS[String(remainder)];
    return result + " " + numberToWords(String(remainder));
  }

  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = numberToWords(String(thousands)) + " nghìn";
    if (remainder === 0) return result;
    if (remainder < 100) {
      if (remainder < 10) {
        return result + " không trăm lẻ " + DIGITS[String(remainder)];
      }
      return result + " không trăm " + numberToWords(String(remainder));
    }
    return result + " " + numberToWords(String(remainder));
  }

  if (num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    let result = numberToWords(String(millions)) + " triệu";
    if (remainder === 0) return result;
    if (remainder < 100) {
      if (remainder < 10) {
        return result + " không trăm lẻ " + DIGITS[String(remainder)];
      }
      return result + " không trăm " + numberToWords(String(remainder));
    }
    return result + " " + numberToWords(String(remainder));
  }

  if (num < 1000000000000) {
    const billions = Math.floor(num / 1000000000);
    const remainder = num % 1000000000;
    let result = numberToWords(String(billions)) + " tỷ";
    if (remainder === 0) return result;
    if (remainder < 100) {
      if (remainder < 10) {
        return result + " không trăm lẻ " + DIGITS[String(remainder)];
      }
      return result + " không trăm " + numberToWords(String(remainder));
    }
    return result + " " + numberToWords(String(remainder));
  }

  return numStr
    .split("")
    .map((d) => DIGITS[d] || d)
    .join(" ");
}

function removeThousandSeparators(text: string): string {
  return text.replace(/(\d{1,3}(?:\.\d{3})+)(?=\s|$|[^\d.,])/g, (match) =>
    match.replace(/\./g, ""),
  );
}

function convertDecimal(text: string): string {
  return text.replace(
    /(\d+),(\d+)(?=\s|$|[^\d,])/g,
    (match, integerPart, decimalPart) => {
      const integerWords = numberToWords(integerPart);
      const decimalWords = numberToWords(decimalPart.replace(/^0+/, "") || "0");
      return `${integerWords} phẩy ${decimalWords}`;
    },
  );
}

function convertPercentage(text: string): string {
  text = text.replace(/(\d+)\s*[-–—]\s*(\d+)\s*%/g, (match, num1, num2) => {
    return `${numberToWords(num1)} đến ${numberToWords(num2)} phần trăm`;
  });

  text = text.replace(/(\d+),(\d+)\s*%/g, (match, integerPart, decimalPart) => {
    const integerWords = numberToWords(integerPart);
    const decimalWords = numberToWords(decimalPart.replace(/^0+/, "") || "0");
    return `${integerWords} phẩy ${decimalWords} phần trăm`;
  });

  text = text.replace(/(\d+)\s*%/g, (match, num) => {
    return numberToWords(num) + " phần trăm";
  });

  return text;
}

function convertCurrency(text: string): string {
  function replaceVND(_match: string, num: string): string {
    const cleanNum = num.replace(/,/g, "");
    return numberToWords(cleanNum) + " đồng";
  }

  text = text.replace(/(\d+(?:,\d+)?)\s*(?:đồng|VND|vnđ)\b/gi, replaceVND);
  text = text.replace(/(\d+(?:,\d+)?)đ(?![a-zà-ỹ])/gi, replaceVND);

  function replaceUSD(_match: string, num: string): string {
    const cleanNum = num.replace(/,/g, "");
    return numberToWords(cleanNum) + " đô la";
  }

  text = text.replace(/\$\s*(\d+(?:,\d+)?)/g, replaceUSD);
  text = text.replace(/(\d+(?:,\d+)?)\s*(?:USD|\$)/gi, replaceUSD);

  return text;
}

function convertRangesWithUnitsAndCurrency(text: string): string {
  if (!text || typeof text !== "string") {
    return text;
  }

  const measurementUnits = [
    "m",
    "cm",
    "mm",
    "km",
    "dm",
    "hm",
    "dam",
    "inch",
    "kg",
    "g",
    "mg",
    "t",
    "tấn",
    "yến",
    "lạng",
    "ml",
    "l",
    "lít",
    "m²",
    "m2",
    "km²",
    "km2",
    "ha",
    "cm²",
    "cm2",
    "m³",
    "m3",
    "cm³",
    "cm3",
    "km³",
    "km3",
    "s",
    "sec",
    "min",
    "h",
    "hr",
    "hrs",
    "km/h",
    "kmh",
    "m/s",
    "ms",
    "mm/h",
    "cm/s",
    "°C",
    "°F",
    "°K",
    "°R",
    "°Re",
    "°Ro",
    "°N",
    "°D",
  ];

  const currencyUnits = ["đồng", "VND", "vnđ", "đ", "USD", "$"];

  const allUnits = Array.from(new Set([...measurementUnits, ...currencyUnits]));
  if (allUnits.length === 0) return text;

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const unitPattern = allUnits
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|");

  if (!unitPattern) return text;

  const rangeRegex = new RegExp(
    `(\\d+)\\s*[-–—]\\s*(\\d+)\\s*(${unitPattern})\\b`,
    "gi",
  );
  text = text.replace(rangeRegex, (match, num1, num2, unit) => {
    const unitLower = unit.toLowerCase();
    const sep = unitLower === "đ" ? "" : " ";
    return `${num1} đến ${num2}${sep}${unit}`;
  });

  const fractionRegex = new RegExp(
    `(\\d+)\\s*[\\/:]\\s*(\\d+)\\s*(${unitPattern})\\b`,
    "gi",
  );
  text = text.replace(fractionRegex, (match, num1, num2, unit) => {
    const unitLower = unit.toLowerCase();
    const sep = unitLower === "đ" ? "" : " ";
    return `${num1} phần ${num2}${sep}${unit}`;
  });

  return text;
}

function convertTime(text: string): string {
  text = text.replace(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?/g,
    (match, hour, minute, second) => {
      let result = numberToWords(hour) + " giờ";
      if (minute) {
        result += " " + numberToWords(minute) + " phút";
      }
      if (second) {
        result += " " + numberToWords(second) + " giây";
      }
      return result;
    },
  );

  text = text.replace(
    /(\d{1,2})h(\d{2})(?![a-zà-ỹ])/gi,
    (match, hour, minute) => {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return numberToWords(hour) + " giờ " + numberToWords(minute);
      }
      return match;
    },
  );

  text = text.replace(/(\d{1,2})h(?![a-zà-ỹ\d])/gi, (match, hour) => {
    const h = parseInt(hour, 10);
    if (h >= 0 && h <= 23) {
      return numberToWords(hour) + " giờ";
    }
    return match;
  });

  text = text.replace(/(\d+)\s*giờ\s*(\d+)\s*phút/g, (match, hour, minute) => {
    return numberToWords(hour) + " giờ " + numberToWords(minute) + " phút";
  });

  text = text.replace(/(\d+)\s*giờ(?!\s*\d)/g, (match, hour) => {
    return numberToWords(hour) + " giờ";
  });

  return text;
}

function romanToArabic(roman: string): number | null {
  const upperRoman = roman.toUpperCase();
  const romanMap: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };

  for (const char of upperRoman) {
    if (!romanMap[char]) return null;
  }

  let result = 0;
  let i = 0;

  while (i < upperRoman.length) {
    const current = romanMap[upperRoman[i]];
    const next = i + 1 < upperRoman.length ? romanMap[upperRoman[i + 1]] : 0;

    if (current < next) {
      const validPairs: Record<string, string[]> = {
        I: ["V", "X"],
        X: ["L", "C"],
        C: ["D", "M"],
      };

      if (
        !validPairs[upperRoman[i]] ||
        !validPairs[upperRoman[i]].includes(upperRoman[i + 1])
      ) {
        return null;
      }

      result += next - current;
      i += 2;
    } else {
      result += current;
      i++;
    }
  }

  return result;
}

function isValidRomanNumeral(roman: string): boolean {
  const upperRoman = roman.toUpperCase();

  if (!upperRoman || upperRoman.length === 0) return false;
  if (!/^[IVXLCDM]+$/i.test(roman)) return false;
  if (/([IVXLCD])\1{3,}/.test(upperRoman)) return false;
  if (/VV|LL|DD/.test(upperRoman)) return false;

  const invalidSubtractive = /I[^VX]|X[^LC]|C[^DM]|[VLD][IVXLCDM]/;
  const romanMap: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  for (let i = 0; i < upperRoman.length - 1; i++) {
    const current = upperRoman[i];
    const next = upperRoman[i + 1];
    const currentVal = romanMap[current];
    const nextVal = romanMap[next];

    if (
      currentVal !== undefined &&
      nextVal !== undefined &&
      currentVal < nextVal
    ) {
      const validPairs: Record<string, string[]> = {
        I: ["V", "X"],
        X: ["L", "C"],
        C: ["D", "M"],
      };

      if (!validPairs[current] || !validPairs[current].includes(next)) {
        return false;
      }
    }
  }

  const arabic = romanToArabic(roman);
  return arabic !== null && arabic > 0;
}

function convertRomanNumerals(text: string, config?: NormalizerConfig): string {
  if (!text || typeof text !== "string") {
    return text;
  }
  const unlimitedRomanNumerals = config?.UnlimitedRomanNumerals === true;

  const romanNumeralRegex = /(^|[\s\W])([IVXLCDMivxlcdm]+)(?=[\s\W]|$)/g;

  return text.replace(
    romanNumeralRegex,
    (
      match: string,
      before: string,
      roman: string,
      offset: number,
      fullText: string,
    ) => {
      if (before && /[\wà-ỹ]/.test(before)) {
        return match;
      }

      const afterIndex = offset + match.length;
      const afterChar =
        afterIndex < fullText.length ? fullText[afterIndex] : "";

      if (afterChar && /[\wà-ỹ]/.test(afterChar)) {
        return match;
      }

      if (roman !== roman.toUpperCase()) {
        return match;
      }

      if (!isValidRomanNumeral(roman)) {
        return match;
      }

      const arabic = romanToArabic(roman);
      if (arabic === null) {
        return match;
      }
      if (!unlimitedRomanNumerals && (arabic < 1 || arabic > 30)) {
        return match;
      }

      return before + String(arabic);
    },
  );
}

function isValidDate(day: string, month: string, year?: string): boolean {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  if (year) {
    const y = parseInt(year, 10);
    return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1000 && y <= 9999;
  }
  return d >= 1 && d <= 31 && m >= 1 && m <= 12;
}

function isValidMonth(month: string): boolean {
  const m = parseInt(month, 10);
  return m >= 1 && m <= 12;
}

function convertDate(text: string): string {
  text = text.replace(
    /ngày\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{4}))?/g,
    (match, day1, day2, month, year) => {
      if (isValidDate(day1, month, year) && isValidDate(day2, month, year)) {
        let result = `ngày ${numberToWords(day1)} đến ${numberToWords(
          day2,
        )} tháng ${numberToWords(month)}`;
        if (year) {
          result += ` năm ${numberToWords(year)}`;
        }
        return result;
      }
      return match;
    },
  );

  text = text.replace(
    /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{4}))?/g,
    (match, day1, day2, month, year, offset) => {
      const beforeMatch = text.substring(Math.max(0, offset - 10), offset);
      if (beforeMatch.includes("ngày") || match.indexOf("đến") !== -1) {
        return match;
      }
      if (isValidDate(day1, month, year) && isValidDate(day2, month, year)) {
        let result = `${numberToWords(day1)} đến ${numberToWords(
          day2,
        )} tháng ${numberToWords(month)}`;
        if (year) {
          result += ` năm ${numberToWords(year)}`;
        }
        return result;
      }
      return match;
    },
  );

  text = text.replace(
    /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[/-]\s*(\d{4})/g,
    (match, month1, month2, year) => {
      if (
        isValidMonth(month1) &&
        isValidMonth(month2) &&
        parseInt(year, 10) >= 1000 &&
        parseInt(year, 10) <= 9999
      ) {
        return `tháng ${numberToWords(month1)} đến tháng ${numberToWords(
          month2,
        )} năm ${numberToWords(year)}`;
      }
      return match;
    },
  );

  text = text.replace(
    /(Sinh|sinh)\s+ngày\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g,
    (match, prefix, day, month, year) => {
      if (isValidDate(day, month, year)) {
        return `${prefix} ngày ${numberToWords(day)} tháng ${numberToWords(
          month,
        )} năm ${numberToWords(year)}`;
      }
      return match;
    },
  );

  text = text.replace(
    /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/g,
    (match, day, month, year) => {
      if (isValidDate(day, month, year)) {
        return `ngày ${numberToWords(day)} tháng ${numberToWords(
          month,
        )} năm ${numberToWords(year)}`;
      }
      return match;
    },
  );

  text = text.replace(
    /(?:tháng\s+)?(\d{1,2})\s*[/-]\s*(\d{4})(?![\/-]\d)/g,
    (match, month, year, offset, fullText) => {
      const after = fullText.slice(offset + match.length);
      const nextNonSpace = after.match(/\S/);
      if (nextNonSpace && /[0-9A-Za-zÀ-ỹà-ỹ]/.test(nextNonSpace[0])) {
        return match;
      }
      if (
        isValidMonth(month) &&
        parseInt(year, 10) >= 1000 &&
        parseInt(year, 10) <= 9999
      ) {
        return `tháng ${numberToWords(month)} năm ${numberToWords(year)}`;
      }
      return match;
    },
  );

  text = text.replace(
    /(\d{1,2})\s*[/-]\s*(\d{1,2})(?![\/-]\d)(?!\d+\s*%)/g,
    (match, day, month, offset, fullText) => {
      const afterMatch = fullText.slice(offset + match.length);
      if (/\s*%/.test(afterMatch) || /\d+\s*%/.test(afterMatch)) {
        return match;
      }
      if (isValidDate(day, month)) {
        return `${numberToWords(day)} tháng ${numberToWords(month)}`;
      }
      return match;
    },
  );

  text = text.replace(/(\d+)\s*tháng\s*(\d+)/g, (match, day, month) => {
    if (isValidDate(day, month)) {
      return `ngày ${numberToWords(day)} tháng ${numberToWords(month)}`;
    }
    return match;
  });

  text = text.replace(/tháng\s*(\d+)/g, (match, month) => {
    if (isValidMonth(month)) {
      return "tháng " + numberToWords(month);
    }
    return match;
  });

  text = text.replace(/ngày\s*(\d+)/g, (match, day) => {
    const d = parseInt(day, 10);
    if (d >= 1 && d <= 31) {
      return "ngày " + numberToWords(day);
    }
    return match;
  });

  return text;
}

function convertYearRange(text: string): string {
  return text.replace(/(\d{4})\s*[-–—]\s*(\d{4})/g, (match, year1, year2) => {
    return numberToWords(year1) + " đến " + numberToWords(year2);
  });
}

function convertOrdinal(text: string): string {
  const ordinalMap: Record<string, string> = {
    "1": "nhất",
    "2": "hai",
    "3": "ba",
    "4": "tư",
    "5": "năm",
    "6": "sáu",
    "7": "bảy",
    "8": "tám",
    "9": "chín",
    "10": "mười",
  };

  return text.replace(
    /(thứ|lần|bước|phần|chương|tập|số)\s*(\d+)/gi,
    (match, prefix, num) => {
      if (ordinalMap[num]) {
        return prefix + " " + ordinalMap[num];
      }
      return prefix + " " + numberToWords(num);
    },
  );
}

function convertStandaloneNumbers(text: string): string {
  return text.replace(/\b\d+\b/g, (match) => {
    return numberToWords(match);
  });
}

function convertPhoneNumber(text: string): string {
  function replacePhone(match: string): string {
    const digits = match.match(/\d/g);
    return digits!.map((d) => DIGITS[d] || d).join(" ");
  }

  text = text.replace(/0\d{9,10}/g, replacePhone);
  text = text.replace(/\+84\d{9,10}/g, replacePhone);

  return text;
}

function convertMeasurementUnits(text: string): string {
  const unitMap: Record<string, string> = {
    m: "mét",
    cm: "xăng-ti-mét",
    mm: "mi-li-mét",
    km: "ki-lô-mét",
    dm: "đề-xi-mét",
    hm: "héc-tô-mét",
    dam: "đề-ca-mét",
    inch: "in",
    kg: "ki-lô-gam",
    g: "gam",
    mg: "mi-li-gam",
    t: "tấn",
    tấn: "tấn",
    yến: "yến",
    lạng: "lạng",
    ml: "mi-li-lít",
    l: "lít",
    lít: "lít",
    "m²": "mét vuông",
    m2: "mét vuông",
    "km²": "ki-lô-mét vuông",
    km2: "ki-lô-mét vuông",
    ha: "héc-ta",
    "cm²": "xăng-ti-mét vuông",
    cm2: "xăng-ti-mét vuông",
    "m³": "mét khối",
    m3: "mét khối",
    "cm³": "xăng-ti-mét khối",
    cm3: "xăng-ti-mét khối",
    "km³": "ki-lô-mét khối",
    km3: "ki-lô-mét khối",
    s: "giây",
    sec: "giây",
    min: "phút",
    h: "giờ",
    hr: "giờ",
    hrs: "giờ",
    "km/h": "ki-lô-mét trên giờ",
    kmh: "ki-lô-mét trên giờ",
    "m/s": "mét trên giây",
    ms: "mét trên giây",
    "mm/h": "mi-li-mét trên giờ",
    "cm/s": "xăng-ti-mét trên giây",
    "°C": "độ C",
    "°F": "độ F",
    "°K": "độ K",
    "°R": "độ R",
    "°Re": "độ Re",
    "°Ro": "độ Ro",
    "°N": "độ N",
    "°D": "độ D",
  };

  const sortedUnits = Object.keys(unitMap).sort((a, b) => b.length - a.length);

  for (const unit of sortedUnits) {
    const escapedUnit = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let digitPattern: string;
    if (unit.length === 1) {
      digitPattern = `(\\d+)\\s*${escapedUnit}(?!\\s*[a-zA-Zà-ỹ])(?=\\s*[^a-zA-Zà-ỹ]|$)`;
    } else {
      digitPattern = `(\\d+)\\s*${escapedUnit}(?=\\s|[^\\w]|$)`;
    }
    const digitRegex = new RegExp(digitPattern, "gi");

    text = text.replace(digitRegex, (match, digits) => {
      return digits + " " + unitMap[unit];
    });
  }

  return text;
}

function normalizeUnicode(text: string): string {
  return text.normalize("NFC");
}

function removeSpecialChars(text: string): string {
  text = text.replace(/&/g, " và ");
  text = text.replace(/@/g, " a còng ");
  text = text.replace(/#/g, " thăng ");
  text = text.replace(/\*/g, "");
  text = text.replace(/_/g, " ");
  text = text.replace(/~/g, "");
  text = text.replace(/`/g, "");
  text = text.replace(/\^/g, "");

  text = text.replace(/https?:\/\/\S+/g, "");
  text = text.replace(/www\.\S+/g, "");
  text = text.replace(/\S+@\S+\.\S+/g, "");

  return text;
}

function normalizePunctuation(text: string): string {
  text = text.replace(/[""„‟]/g, '"');
  text = text.replace(/[''‚‛]/g, "'");

  text = text.replace(/[–—−]/g, "-");

  text = text.replace(/\.{3,}/g, "...");
  text = text.replace(/…/g, "...");

  text = text.replace(/([!?.]){2,}/g, "$1");

  return text;
}

function cleanWhitespace(text: string): string {
  text = text.replace(/\s+/g, " ");
  return text.trim();
}

/**
 * Main function to process Vietnamese text for TTS.
 * Applies all normalization steps in the correct order.
 */
export function normalizeVietnamese(
  text: string,
  config?: NormalizerConfig,
): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const originalText = text;

  text = normalizeUnicode(text);
  text = removeSpecialChars(text);
  text = normalizePunctuation(text);
  text = removeThousandSeparators(text);
  text = convertRangesWithUnitsAndCurrency(text);
  text = convertYearRange(text);
  text = convertDate(text);
  text = convertTime(text);
  text = convertRomanNumerals(text, config);
  text = convertOrdinal(text);
  text = convertCurrency(text);
  text = convertPercentage(text);
  text = convertPhoneNumber(text);
  text = convertDecimal(text);
  text = convertMeasurementUnits(text);
  text = convertStandaloneNumbers(text);
  text = cleanWhitespace(text);

  return text;
}

export {
  numberToWords,
  convertDecimal,
  convertPercentage,
  convertCurrency,
  convertTime,
  convertDate,
  convertYearRange,
  convertOrdinal,
  convertRomanNumerals,
  convertStandaloneNumbers,
  convertMeasurementUnits,
  convertPhoneNumber,
  normalizeUnicode,
  removeSpecialChars,
  normalizePunctuation,
  cleanWhitespace,
};
