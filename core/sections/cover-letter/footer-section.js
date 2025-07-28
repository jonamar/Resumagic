/**
 * Cover letter footer section builder
 */

import { Paragraph, TextRun, ExternalHyperlink, UnderlineType } from 'docx';
import theme from '../../../theme.js';
import { getRegionAbbreviation } from '../../formatting/date-utilities.js';

/**
 * Creates the footer section with contact information for cover letter
 * @param {Object} basics - Basic contact information
 * @param {boolean} isComboMode - Whether this is part of a combined document
 * @returns {Array} Array of paragraphs for the footer section
 */
export function createCoverLetterFooter(basics, isComboMode = false) {
  const paragraphs = [];
  
  // Skip contact info in combo mode since resume already has it
  if (isComboMode) {
    return paragraphs;
  }

  // Create contact information with ATS-friendly format
  const contactParts = [];
  
  // Add address first with ATS-friendly label (city, province abbreviation, country)
  if (basics.location) {
    let locationText = basics.location.city || '';
    
    // Add abbreviated region/province
    if (basics.location.region) {
      const regionAbbrev = getRegionAbbreviation(basics.location.region);
      locationText += `, ${regionAbbrev}`;
    }
    
    // Add country
    if (basics.location.country) {
      locationText += `, ${basics.location.country}`;
    }
    
    // Add "Address:" label for ATS recognition
    if (locationText) {
      contactParts.push(`Address: ${locationText}`);
    }
  }
  
  // Add phone and email
  if (basics.phone) {
    contactParts.push(basics.phone);
  }
  if (basics.email) {
    contactParts.push(basics.email);
  }

  // Add contact info line with bullet separators
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(' • '),
          size: theme.typography.fontSize.meta * 2, // Convert to half-points
          color: theme.colors.dimText,
          font: theme.typography.fonts.primary,
        }),
      ],
      spacing: {
        before: theme.spacing.twips.beforeContact, // 12pt before contact info
        after: theme.spacing.twips.afterContact,   // 5pt
      },
    }),
  );

  // Add profiles if any
  if (basics.profiles && basics.profiles.length > 0) {
    const profileChildren = [];
    
    basics.profiles.forEach((profile, index) => {
      // Add bullet separator between profiles (not before first)
      if (index > 0) {
        profileChildren.push(new TextRun({
          text: ' • ',
          size: theme.typography.fontSize.meta * 2, // Convert to half-points
          color: theme.colors.dimText,
          font: theme.typography.fonts.primary,
        }));
      }
      
      // Add profile as hyperlink
      profileChildren.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: profile.url.replace(/^https?:\/\//, ''), // Remove protocol for cleaner display
              size: theme.typography.fontSize.meta * 2, // Convert to half-points
              color: theme.colors.dimText,
              font: theme.typography.fonts.primary,
              underline: {
                type: UnderlineType.SINGLE,
                color: theme.colors.dimText,
              },
            }),
          ],
          link: profile.url,
        }),
      );
    });

    paragraphs.push(
      new Paragraph({
        children: profileChildren,
        spacing: {
          after: theme.spacing.twips.afterContact, // 5pt
        },
      }),
    );
  }
  
  return paragraphs;
}