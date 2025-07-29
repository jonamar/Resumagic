import { Document, LevelFormat, AlignmentType } from 'docx';
import theme from '../../theme.js';
import { createCoverLetterDate } from '../sections/cover-letter/date-section.js';
import { createCoverLetterContent } from '../sections/cover-letter/content-section.js';
import { createCoverLetterClosing } from '../sections/cover-letter/closing-section.js';
import { createCoverLetterFooter } from '../sections/cover-letter/footer-section.js';
export function createCoverLetterDocx(coverLetterData, _options = {}) {
    const children = [
        ...createCoverLetterDate(coverLetterData.coverLetter.metadata),
        ...createCoverLetterContent(coverLetterData.coverLetter.content),
        ...createCoverLetterClosing(coverLetterData.coverLetter.metadata),
        ...createCoverLetterFooter(coverLetterData.basics),
    ];
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
                                    size: 16,
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
                        size: theme.typography.fontSize.name * 2,
                        font: 'Arial',
                        bold: true,
                        color: theme.colors.headings,
                    },
                    paragraph: {
                        spacing: {
                            after: theme.spacing.twips.afterHeader,
                        },
                        indent: {
                            left: 0,
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
//# sourceMappingURL=cover-letter-builder.js.map