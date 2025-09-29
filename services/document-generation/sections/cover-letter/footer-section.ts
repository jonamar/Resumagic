/**
 * Cover letter footer section builder
 */

import { Paragraph, TextRun, ExternalHyperlink, UnderlineType, AlignmentType } from 'docx';
import theme from '../../../../theme.js';
import { getRegionAbbreviation } from '../../formatting/date-utilities.js';

interface Location {
  city?: string;
  region?: string;
  country?: string;
}

interface Profile {
  url: string;
}

interface Basics {
  location?: Location;
  phone?: string;
  email?: string;
  profiles?: Profile[];
}

/**
 * Creates the footer section with contact information for cover letter
 * @param basics - Basic contact information
 * @param isComboMode - Whether this is part of a combined document
 * @returns Array of paragraphs for the footer section
 */
export function createCoverLetterFooter(basics: Basics, isComboMode: boolean = false, footerNote?: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Skip contact info in combo mode since resume already has it
  if (isComboMode) {
    return paragraphs;
  }

  // Create contact information with ATS-friendly format
  const contactParts: string[] = [];
  
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
    const profileChildren: (TextRun | ExternalHyperlink)[] = [];
    
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
  
  // Append footer note if present (italic body copy, left-aligned)
  // Skip entirely in combo mode per requirement
  if (!isComboMode && footerNote && footerNote.trim().length > 0) {
    const noteText = footerNote.trim().startsWith('Note:') ? footerNote.trim() : `Note: ${footerNote.trim()}`;
    // Insert a blank spacer line to guarantee a visible gap above the note
    paragraphs.push(new Paragraph({ text: '', spacing: { after: theme.spacing.twips.medium } }));
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: noteText,
            size: theme.typography.fontSize.body * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.text,
            italics: true,
          }),
        ],
        spacing: {
          before: theme.spacing.twips.minimal,
          after: theme.spacing.twips.large,
        },
        alignment: AlignmentType.LEFT,
      }),
    );
  }
  
  return paragraphs;
}
