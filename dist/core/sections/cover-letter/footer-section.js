import { Paragraph, TextRun, ExternalHyperlink, UnderlineType } from 'docx';
import theme from '../../../theme.js';
import { getRegionAbbreviation } from '../../formatting/date-utilities.js';
export function createCoverLetterFooter(basics, isComboMode = false) {
    const paragraphs = [];
    if (isComboMode) {
        return paragraphs;
    }
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
            before: theme.spacing.twips.beforeContact,
            after: theme.spacing.twips.afterContact,
        },
    }));
    if (basics.profiles && basics.profiles.length > 0) {
        const profileChildren = [];
        basics.profiles.forEach((profile, index) => {
            if (index > 0) {
                profileChildren.push(new TextRun({
                    text: ' • ',
                    size: theme.typography.fontSize.meta * 2,
                    color: theme.colors.dimText,
                    font: theme.typography.fonts.primary,
                }));
            }
            profileChildren.push(new ExternalHyperlink({
                children: [
                    new TextRun({
                        text: profile.url.replace(/^https?:\/\//, ''),
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
        });
        paragraphs.push(new Paragraph({
            children: profileChildren,
            spacing: {
                after: theme.spacing.twips.afterContact,
            },
        }));
    }
    return paragraphs;
}
//# sourceMappingURL=footer-section.js.map