/**
 * Joins one PDF page's positioned text items (from pdf.js page.getTextContent()) into lines, top to bottom
 * @param {Array<object>} items Text items with str, width and transform
 * @returns {Array<string>}
 */
export function itemsToLines(items){
    const rows = [];
    items.filter(item => item.str.trim() !== "").forEach(item => {
        const x = item.transform[4];
        const y = item.transform[5];
        let row = rows.find(r => Math.abs(r.y - y) < 2);
        if (!row){
            row = { y, items: [] };
            rows.push(row);
        }
        row.items.push({ x, width: item.width, str: item.str });
    });

    rows.sort((a, b) => b.y - a.y);
    return rows.map(row => {
        row.items.sort((a, b) => a.x - b.x);
        let line = "";
        let prevEnd = null;
        row.items.forEach(item => {
            if (prevEnd !== null && item.x - prevEnd > 1) line += " ";
            line += item.str;
            prevEnd = item.x + item.width;
        });
        return line;
    });
}
