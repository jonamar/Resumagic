import { Paragraph, TextRun, AlignmentType, ExternalHyperlink, UnderlineType } from 'docx';
import theme from '../../../theme.js';
import { getRegionAbbreviation } from '../../formatting/date-utilities.js';
export function createHeader(basics) {
    const paragraphs = [];
    paragraphs.push(new Paragraph({
        text: basics.name,
        style: 'applicantName',
        alignment: AlignmentType.LEFT,
        spacing: {
            after: theme.spacing.twips.afterHeader,
        },
        thematicBreak: false,
    }));
    const contactParts = [];
    if (basics.location) {
        let locationText = basics.location.city || '';
        if (basics.location.region) {
            const regionAbbrev = getRegionAbbreviation(basics.location.region);
            locationText += `, ${regionAbbrev}`;
        }
        if (basics.location.country) {
            locationText += `, ${basics.location.country}`;
        }
        if (locationText) {
            contactParts.push(`Address: ${locationText}`);
        }
    }
    if (basics.phone) {
        contactParts.push(basics.phone);
    }
    if (basics.email) {
        contactParts.push(basics.email);
    }
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({
                text: contactParts.join(' • '),
                size: theme.typography.fontSize.meta * 2,
                color: theme.colors.dimText,
                font: theme.typography.fonts.primary,
            }),
        ],
        spacing: {
            after: theme.spacing.twips.afterContact,
        },
    }));
    if (basics.profiles && basics.profiles.length > 0) {
        const profileChildren = [];
        basics.profiles.forEach((profile, index) => {
            const displayText = profile.url
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '');
            profileChildren.push(new ExternalHyperlink({
                children: [
                    new TextRun({
                        text: displayText,
                        size: theme.typography.fontSize.meta * 2,
                        color: theme.colors.dimText,
                        font: theme.typography.fonts.primary,
                        underline: {
                            type: UnderlineType.SINGLE,
                            color: theme.colors.dimText,
                        },
                    }),
                ],
                link: profile.url,
            }));
            if (index < basics.profiles.length - 1) {
                profileChildren.push(new TextRun({
                    text: ' • ',
                    size: theme.typography.fontSize.meta * 2,
                    color: theme.colors.dimText,
                    font: theme.typography.fonts.primary,
                }));
            }
        });
        paragraphs.push(new Paragraph({
            children: profileChildren,
            spacing: {
                after: theme.spacing.twips.afterHeader,
            },
        }));
    }
    return paragraphs;
}
//# sourceMappingURL=header-section.js.map