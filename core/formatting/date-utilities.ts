/**
 * Date and region formatting utilities for DOCX document generation
 */

/**
 * Formats a date string into a consistent format
 * @param dateStr - Date string in various formats
 * @returns Formatted date as "Month YYYY" or original if parsing fails
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) {
    return '';
  }
  
  try {
    // Handle different input formats
    let parsedDate: Date;
    
    // Format: "Sep 2022", "Jan 2021", etc.
    if (/^[A-Za-z]{3}\s\d{4}$/.test(dateStr)) {
      parsedDate = new Date(dateStr + ' 01'); // Add day for parsing
    } else if (/^\d{4}-\d{2}$/.test(dateStr)) {
      // Format: "2007-01", "2015-11", etc.
      parsedDate = new Date(dateStr + '-01'); // Add day for parsing
    } else if (/^\d{4}$/.test(dateStr)) {
      // Format: "2020", "2021", etc. (year only)
      return dateStr; // Return as-is for year-only dates
    } else {
      // Standard ISO format: "2020-01-15", etc.
      parsedDate = new Date(dateStr);
    }
    
    // Check if date parsing was successful
    if (isNaN(parsedDate.getTime())) {
      return dateStr;
    }
    
    // Format as Month YYYY (e.g., March 2019)
    const month: string = parsedDate.toLocaleString('en', { month: 'long' });
    const year: number = parsedDate.getFullYear();
    
    return `${month} ${year}`;
    
  } catch {
    return dateStr;
  }
}

/**
 * Get standard abbreviation for region/province/state names
 * @param region - Full region name
 * @returns Abbreviated region code
 */
export function getRegionAbbreviation(region: string): string {
  // Canadian provinces and territories
  const canadianProvinces: Record<string, string> = {
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
  
  // US states (common ones)
  const usStates: Record<string, string> = {
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
  
  // Check Canadian provinces first, then US states
  return canadianProvinces[region] || usStates[region] || region;
}
