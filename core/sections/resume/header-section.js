/**
 * Resume header section builder
 */

import { Paragraph, TextRun, AlignmentType, ExternalHyperlink, UnderlineType } from 'docx';
import theme from '../../../theme.js';
import { getRegionAbbreviation } from '../../formatting/date-utilities.js';

/**
 * Creates the header section for a resume
 * @param {Object} basics - Basic information containing name, location, contact details, and profiles
 * @returns {Array} Array of paragraphs for the header section
 */
export function createHeader(basics) {
  const paragraphs = [];

  // Add name
  paragraphs.push(
    new Paragraph({
      text: basics.name,
      style: 'applicantName',
      alignment: AlignmentType.LEFT,
      spacing: {
        after: theme.spacing.twips.afterHeader, // 12pt
      },
      thematicBreak: false,
    }),
  );

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
        after: theme.spacing.twips.afterContact, // 5pt
      },
    }),
  );

  // Add profiles if any
  if (basics.profiles && basics.profiles.length > 0) {
    const profileChildren = [];
    
    basics.profiles.forEach((profile, index) => {
      // Clean up the display text by removing protocol and www
      const displayText = profile.url
        .replace(/^https?:\/\//, '') // Remove http:// or https://
        .replace(/^www\./, '');       // Remove www.
      
      // Add the hyperlink
      profileChildren.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: displayText,
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
      
      // Add bullet separator if not the last item
      if (index < basics.profiles.length - 1) {
        profileChildren.push(
          new TextRun({
            text: ' • ',
            size: theme.typography.fontSize.meta * 2,
            color: theme.colors.dimText,
            font: theme.typography.fonts.primary,
          }),
        );
      }
    });
    
    paragraphs.push(
      new Paragraph({
        children: profileChildren,
        spacing: {
          after: theme.spacing.twips.afterHeader, // 12pt
        },
      }),
    );
  }

  return paragraphs;
}
