export default theme;
declare namespace theme {
    namespace colors {
        let headings: string;
        let text: string;
        let dimText: string;
        let background: string;
    }
    namespace fonts {
        let primary: string;
        let fallback: string[];
    }
    namespace fontSize {
        let name: number;
        let sectionHeading: number;
        let body: number;
        let meta: number;
    }
    namespace lineSpacing {
        let body_1: number;
        export { body_1 as body };
        export let heading: number;
    }
    namespace fontStyles {
        export namespace name_1 {
            let bold: boolean;
            let caps: boolean;
        }
        export { name_1 as name };
        export namespace sectionHeading_1 {
            let bold_1: boolean;
            export { bold_1 as bold };
            export let letterSpacing: number;
        }
        export { sectionHeading_1 as sectionHeading };
    }
    namespace spacing {
        let sectionBefore: number;
        let sectionAfter: number;
        let paragraphAfter: number;
        let bulletAfter: number;
    }
    namespace spacingTwips {
        let minimal: number;
        let small: number;
        let medium: number;
        let large: number;
        let xlarge: number;
        let section: number;
        let page: number;
        let bulletIndent: number;
        let bulletHanging: number;
        let singleLine: number;
        let resumeLine: number;
        let oneAndHalfLine: number;
        let afterHeader: number;
        let afterContact: number;
        let afterJobTitle: number;
        let afterCompanyName: number;
        let afterDate: number;
        let afterSummary: number;
        let afterBullet: number;
        let afterJobEntry: number;
        let afterProjectEntry: number;
        let afterSectionEntry: number;
        let beforeDate: number;
        let afterDateCoverLetter: number;
        let coverLetterParagraph: number;
        let beforeContact: number;
    }
    namespace margins {
        namespace document {
            let top: number;
            let bottom: number;
            let left: number;
            let right: number;
        }
    }
    namespace layout {
        let maxWidth: number;
    }
    namespace fileNaming {
        let resumePattern: string;
        let coverLetterPattern: string;
        let combinedPattern: string;
        let dataDir: string;
        let applicationsDir: string;
        let inputsDir: string;
        let outputsDir: string;
        let canonicalDir: string;
        let testDir: string;
        let testApplicationName: string;
        let resumeFile: string;
        let coverLetterFile: string;
        let markdownSuffix: string;
    }
    namespace cli {
        namespace flags {
            let preview: string;
            let coverLetter: string;
            let both: string;
            let auto: string;
            let combined: string;
            let evaluate: string;
            let all: string;
            let fast: string;
            let newApp: string;
        }
        namespace defaults {
            let autoPreview: boolean;
            let maxModificationsPerSection: number;
            let highPriorityThreshold: number;
        }
    }
    namespace messages {
        export namespace emojis {
            export let error: string;
            export let success: string;
            export let warning: string;
            export let processing: string;
            let document_1: string;
            export { document_1 as document };
            export let company: string;
            export let folder: string;
        }
        export namespace errors {
            let noApplicationName: string;
            let applicationNotFound: string;
            let resumeNotFound: string;
            let coverLetterNotFound: string;
            let resumeRequired: string;
            let coverLetterRequired: string;
        }
        export namespace success_1 {
            let resumeGenerated: string;
            let coverLetterGenerated: string;
            let combinedGenerated: string;
            let filesOpened: string;
            let testsPass: string;
        }
        export { success_1 as success };
        export namespace processing_1 {
            let processingResume: string;
            let processingCoverLetter: string;
            let processingCombined: string;
            let willGenerateResume: string;
            let willGenerateCoverLetter: string;
            let willGenerateCombined: string;
            let generatingResume: string;
            let generatingCoverLetter: string;
            let savingResume: string;
            let savingCoverLetter: string;
            let optimizing: string;
            let optimizingCoverLetter: string;
            let parsingMarkdown: string;
            let usingFolder: string;
            let companyName: string;
        }
        export { processing_1 as processing };
        export namespace usage {
            export let command: string;
            export let example: string;
            let flags_1: string;
            export { flags_1 as flags };
            export let flagDescriptions: string;
            export let createApplication: string;
            export let createCommand: string;
            export let availableApplications: string;
            export let noApplications: string;
            export let generatedFiles: string;
            export let defaultBehavior: string;
            export let defaultResumeOnly: string;
        }
    }
    namespace ats {
        namespace sectionTitles {
            let experience: string;
            let education: string;
            let skills: string;
            let projects: string;
            let speakingEngagements: string;
            let languages: string;
        }
        let dateFormat: string;
    }
}
//# sourceMappingURL=theme.d.ts.map