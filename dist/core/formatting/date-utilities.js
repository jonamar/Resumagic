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
export function getRegionAbbreviation(region) {
    const canadianProvinces = {
        'Alberta': 'AB',
        'British Columbia': 'BC',
        'Manitoba': 'MB',
        'New Brunswick': 'NB',
        'Newfoundland and Labrador': 'NL',
        'Northwest Territories': 'NT',
        'Nova Scotia': 'NS',
        'Nunavut': 'NU',
        'Ontario': 'ON',
        'Prince Edward Island': 'PE',
        'Quebec': 'QC',
        'Québec': 'QC',
        'Saskatchewan': 'SK',
        'Yukon': 'YT',
    };
    const usStates = {
        'California': 'CA',
        'New York': 'NY',
        'Texas': 'TX',
        'Florida': 'FL',
        'Illinois': 'IL',
        'Pennsylvania': 'PA',
        'Ohio': 'OH',
        'Georgia': 'GA',
        'North Carolina': 'NC',
        'Michigan': 'MI',
        'New Jersey': 'NJ',
        'Virginia': 'VA',
        'Washington': 'WA',
        'Arizona': 'AZ',
        'Massachusetts': 'MA',
        'Indiana': 'IN',
        'Tennessee': 'TN',
        'Missouri': 'MO',
        'Maryland': 'MD',
        'Wisconsin': 'WI',
        'Colorado': 'CO',
        'Minnesota': 'MN',
        'South Carolina': 'SC',
        'Alabama': 'AL',
        'Louisiana': 'LA',
        'Kentucky': 'KY',
        'Oregon': 'OR',
        'Oklahoma': 'OK',
        'Connecticut': 'CT',
        'Utah': 'UT',
        'Iowa': 'IA',
        'Nevada': 'NV',
        'Arkansas': 'AR',
        'Mississippi': 'MS',
        'Kansas': 'KS',
        'New Mexico': 'NM',
        'Nebraska': 'NE',
        'West Virginia': 'WV',
        'Idaho': 'ID',
        'Hawaii': 'HI',
        'New Hampshire': 'NH',
        'Maine': 'ME',
        'Montana': 'MT',
        'Rhode Island': 'RI',
        'Delaware': 'DE',
        'South Dakota': 'SD',
        'North Dakota': 'ND',
        'Alaska': 'AK',
        'District of Columbia': 'DC',
        'Vermont': 'VT',
        'Wyoming': 'WY',
    };
    return canadianProvinces[region] || usStates[region] || region;
}
//# sourceMappingURL=date-utilities.js.map