const TR_WEEKDAYS = [
    "Pazar",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
];

export function formatDate(date?: string | null): string {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";

    const dd = `${parsed.getDate()}`.padStart(2, "0");
    const mm = `${parsed.getMonth() + 1}`.padStart(2, "0");
    const yyyy = parsed.getFullYear();
    const weekday = TR_WEEKDAYS[parsed.getDay()];
    return `${dd}.${mm}.${yyyy} ${weekday}`;
}
