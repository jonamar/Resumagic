/**
 * Resume theme configuration for DOCX generation
 * Based on visual-design-spec.md v0.3
 */

// Theme configuration with styling variables for DOCX generation
const theme = {
  // Colors
  colors: {
    text: '#222222',      // Primary text color
    dimText: '#555555',   // Secondary text color
    background: '#FFFFFF',// Background color
  },
  
  // Typography
  fonts: {
    // ATS-friendly fonts with universal availability
    primary: 'Arial',
    fallback: ['sans-serif'],
  },
  
  // Font sizes (in points for DOCX - converted from pixel values in spec)
  fontSize: {
    name: 22,             // Resume name (22px)
    sectionHeading: 16,   // Section headings (16px)
    body: 11,             // Body text & bullets (11px)
    meta: 10,             // Meta text (dates, locations, etc.) (10px)
  },
  
  // Line spacing
  lineSpacing: {
    body: 1.25,           // Line height for body text
    heading: 1.15,        // Line height for headings
  },
  
  // Font styles
  fontStyles: {
    name: {
      bold: true,
      caps: true,
    },
    sectionHeading: {
      bold: true,
      letterSpacing: 0.5, // 0.5px letter-spacing
    },
  },
  
  // Spacing (in points)
  spacing: {
    sectionBefore: 20,    // Space before sections
    sectionAfter: 10,     // Space after sections
    paragraphAfter: 10,   // Space after paragraphs
    bulletAfter: 5,       // Space after bullet points
  },
  
  // Margins (in twips - 1/20th of a point)
  margins: {
    document: {
      top: 1440,          // 1 inch (72 points)
      bottom: 1440,       // 1 inch
      left: 1440,         // 1 inch
      right: 1440,        // 1 inch
    },
  },
  
  // Layout
  layout: {
    maxWidth: 750,        // Max content width per spec (750px)
  },
  
  // ATS best practices
  ats: {
    sectionTitles: {
      experience: "EXPERIENCE",
      education: "EDUCATION",
      skills: "SKILLS",
      projects: "PROJECTS",
    },
    dateFormat: "MMM-YYYY", // ATS-friendly date format
  }
};

module.exports = theme;
