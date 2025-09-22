/**
 * Main cover letter document builder
 */

import { Document, LevelFormat, AlignmentType, Paragraph } from 'docx';
import theme from '../../../theme.js';
import { createCoverLetterContent } from '../sections/cover-letter/content-section.js';
import { createCoverLetterClosing } from '../sections/cover-letter/closing-section.js';
import { createCoverLetterFooter } from '../sections/cover-letter/footer-section.js';

interface CoverLetterData {
  basics: any;
  coverLetter: {
    metadata: any;
    content: any[];
  };
}

type CoverLetterOptions = Record<string, unknown>;

/**
 * Creates a DOCX cover letter document from transformed markdown data
 * @param coverLetterData - Cover letter data with basics and coverLetter sections
 * @param options - Additional options for cover letter generation
 * @returns DOCX document
 */
export function createCoverLetterDocx(coverLetterData: CoverLetterData, _options: CoverLetterOptions = {}): Document {
  // Document sections (no header for cover letter)
  const children: Paragraph[] = [
    // Date intentionally omitted per cover letter simplification
    ...createCoverLetterContent(coverLetterData.coverLetter.content),
    ...createCoverLetterClosing(coverLetterData.coverLetter.metadata),
    ...createCoverLetterFooter(coverLetterData.basics, false, coverLetterData.coverLetter.metadata.footerNote),
  ];

  // Create the document with identical styling to resume
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'small-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                run: {
                  font: theme.typography.fonts.primary,
                  size: 16, // 8pt bullet (smaller than default 10pt text)
                  color: theme.colors.text,
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: 'applicantName',
          name: 'Applicant Name',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: theme.typography.fontSize.name * 2, // Convert to half-points
            font: 'Arial', // Set Arial as the default font for all runs
            bold: true,
            color: theme.colors.headings,
          },
          paragraph: {
            spacing: {
              after: theme.spacing.twips.afterHeader, // 12pt
            },
            indent: {
              left: 0, // No indentation
            },
          },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: theme.layout.margins.document,
        },
      },
      children: children,
    }],
  });

  return doc;
}
