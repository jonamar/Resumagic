import { Document, LevelFormat, AlignmentType, SectionType } from 'docx';
import theme from '../../theme.js';
import { createCoverLetterDate } from '../sections/cover-letter/date-section.js';
import { createCoverLetterContent } from '../sections/cover-letter/content-section.js';
import { createCoverLetterClosing } from '../sections/cover-letter/closing-section.js';
import { createCoverLetterFooter } from '../sections/cover-letter/footer-section.js';
import { createHeader } from '../sections/resume/header-section.js';
import { createSummary } from '../sections/resume/summary-section.js';
import { createExperience } from '../sections/resume/experience-section.js';
import { createSkills } from '../sections/resume/skills-section.js';
import { createEducation } from '../sections/resume/education-section.js';
import { createProjects } from '../sections/resume/projects-section.js';
import { createSpeakingEngagements } from '../sections/resume/speaking-section.js';
import { createLanguages } from '../sections/resume/languages-section.js';
export function createCombinedDocx(coverLetterData, resumeData, _options = {}) {
    const coverLetterChildren = [
        ...createCoverLetterDate(coverLetterData.coverLetter.metadata),
        ...createCoverLetterContent(coverLetterData.coverLetter.content),
        ...createCoverLetterClosing(coverLetterData.coverLetter.metadata),
        ...createCoverLetterFooter(coverLetterData.basics, true),
    ];
    const resumeChildren = [
        ...createHeader(resumeData.basics),
        ...createSummary(resumeData.basics),
        ...createExperience(resumeData.work),
        ...createSkills(resumeData.skills),
        ...createEducation(resumeData.education),
    ];
    if (resumeData.projects && resumeData.projects.length > 0) {
        resumeChildren.push(...createProjects(resumeData.projects));
    }
    if (resumeData.publications && resumeData.publications.length > 0) {
        resumeChildren.push(...createSpeakingEngagements(resumeData.publications));
    }
    if (resumeData.languages && resumeData.languages.length > 0) {
        resumeChildren.push(...createLanguages(resumeData.languages));
    }
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
        sections: [
            {
                properties: {
                    page: {
                        margin: theme.layout.margins.document,
                    },
                },
                children: coverLetterChildren,
            },
            {
                properties: {
                    page: {
                        margin: theme.layout.margins.document,
                    },
                    type: SectionType.NEXT_PAGE,
                },
                children: resumeChildren,
            },
        ],
    });
    return doc;
}
//# sourceMappingURL=combined-builder.js.map