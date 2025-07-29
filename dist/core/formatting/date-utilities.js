export function formatDate(dateStr) {
    if (!dateStr) {
        return '';
    }
    try {
        let parsedDate;
        if (/^[A-Za-z]{3}\s\d{4}$/.test(dateStr)) {
            parsedDate = new Date(dateStr + ' 01');
        }
        else if (/^\d{4}-\d{2}$/.test(dateStr)) {
            parsedDate = new Date(dateStr + '-01');
        }
        else if (/^\d{4}$/.test(dateStr)) {
            return dateStr;
        }
        else {
            parsedDate = new Date(dateStr);
        }
        if (isNaN(parsedDate.getTime())) {
            console.warn(`⚠️  Date parsing warning: Could not parse date "${dateStr}". Using original value.`);
            return dateStr;
        }
        const month = parsedDate.toLocaleString('en', { month: 'long' });
        const year = parsedDate.getFullYear();
        return `${month} ${year}`;
    }
    catch (error) {
        console.warn(`⚠️  Date parsing error: Failed to format date "${dateStr}". Error: ${error.message}. Using original value.`);
        return dateStr;
    }
}
//# sourceMappingURL=date-utilities.js.map