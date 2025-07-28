const colors = {
    headings: '#000000',
    text: '#222222',
    dimText: '#555555',
    background: '#FFFFFF',
};
const typography = {
    fonts: {
        primary: 'Arial',
        fallback: ['sans-serif'],
    },
    fontSize: {
        name: 22,
        sectionHeading: 16,
        body: 10,
        meta: 10,
    },
    lineSpacing: {
        body: 1.25,
        heading: 1.15,
    },
    fontStyles: {
        name: {
            bold: true,
            caps: true,
        },
        sectionHeading: {
            bold: true,
            letterSpacing: 0.5,
        },
    },
};
const spacing = {
    legacy: {
        sectionBefore: 20,
        sectionAfter: 10,
        paragraphAfter: 10,
        bulletAfter: 5,
    },
    twips: {
        minimal: 20,
        small: 60,
        medium: 80,
        large: 120,
        xlarge: 180,
        section: 240,
        page: 480,
        bulletIndent: 360,
        bulletHanging: 360,
        singleLine: 240,
        resumeLine: 264,
        oneAndHalfLine: 408,
        afterHeader: 240,
        afterContact: 100,
        afterJobTitle: 40,
        afterCompanyName: 60,
        afterDate: 80,
        afterSummary: 120,
        afterBullet: 60,
        afterJobEntry: 80,
        afterProjectEntry: 180,
        afterSectionEntry: 240,
        beforeDate: 240,
        afterDateCoverLetter: 480,
        coverLetterParagraph: 240,
        beforeContact: 240,
    },
};
const layout = {
    margins: {
        document: {
            top: 720,
            bottom: 720,
            left: 720,
            right: 720,
        },
    },
    constraints: {
        maxWidth: 750,
    },
};
const fileNaming = {
    resumePattern: 'Jon-Amar-Resume-{company}.docx',
    coverLetterPattern: 'Jon-Amar-Cover-Letter-{company}.docx',
    combinedPattern: 'Jon-Amar-Cover-Letter-and-Resume-{company}.docx',
    dataDir: '../data',
    applicationsDir: 'applications',
    inputsDir: 'inputs',
    outputsDir: 'outputs',
    canonicalDir: 'canonical',
    testDir: 'test',
    testApplicationName: 'test-application',
    resumeFile: 'resume.json',
    coverLetterFile: 'cover-letter.md',
    markdownSuffix: '-cover-letter.md',
};
const cli = {
    flags: {
        preview: '--preview',
        coverLetter: '--cover-letter',
        both: '--both',
        auto: '--auto',
        combined: '--cover-letter-and-resume',
        evaluate: '--evaluate',
        all: '--all',
        fast: '--fast',
        newApp: '--new-app',
    },
    defaults: {
        autoPreview: true,
        maxModificationsPerSection: 2,
        highPriorityThreshold: 7,
    },
};
const messages = {
    emojis: {
        error: '❌',
        success: '✅',
        warning: '⚠️',
        processing: '📄',
        document: '📑',
        company: '🏢',
        folder: '📁',
    },
    errors: {
        noApplicationName: 'Error: Please specify an application folder name.',
        applicationNotFound: 'Error: Application folder not found at {path}',
        resumeNotFound: 'Error: Resume file not found at {path}',
        coverLetterNotFound: 'Error: Cover letter generation requested but no markdown file found.',
        resumeRequired: 'Make sure you have a resume.json file in the inputs folder.',
        coverLetterRequired: 'Expected: {path}',
    },
    success: {
        resumeGenerated: 'Resume DOCX generated and saved to: {path}',
        coverLetterGenerated: 'Cover letter DOCX generated and saved to: {path}',
        combinedGenerated: 'Cover letter + resume DOCX generated and saved to: {path}',
        filesOpened: 'Files opened with system default app for preview',
        testsPass: 'All markdown parser tests passed!',
    },
    processing: {
        processingResume: 'Processing resume: {path}',
        processingCoverLetter: 'Processing cover letter: {path}',
        processingCombined: 'Processing cover letter + resume document: {resumePath} + {coverPath}',
        willGenerateResume: 'Will generate resume DOCX: {path}',
        willGenerateCoverLetter: 'Will generate cover letter DOCX: {path}',
        willGenerateCombined: 'Will generate cover letter + resume DOCX: {path}',
        generatingResume: 'Generating resume DOCX document...',
        generatingCoverLetter: 'Generating cover letter DOCX document...',
        savingResume: 'Saving resume DOCX file...',
        savingCoverLetter: 'Saving cover letter DOCX file...',
        optimizing: 'Optimizing resume DOCX for ATS compatibility...',
        optimizingCoverLetter: 'Optimizing cover letter DOCX for ATS compatibility...',
        parsingMarkdown: 'Parsing markdown cover letter...',
        usingFolder: 'Using application folder: {path}',
        companyName: 'Company name: {company}',
    },
    usage: {
        command: 'Usage: node generate-resume.js <application-folder-name> [flags]',
        example: 'Example: node generate-resume.js relay-director-of-product',
        flags: 'Available flags: --resume --cover-letter --both --combined --auto --evaluate --all --preview',
        flagDescriptions: '  --evaluate: Generate documents + run hiring evaluation\n  --all: Complete workflow (documents + keyword analysis + hiring evaluation)',
        createApplication: 'To create a new application:',
        createCommand: 'cp -r data/applications/template data/applications/{name}',
        availableApplications: 'Available applications:',
        noApplications: '  (No applications found)',
        generatedFiles: 'Generated files:',
        defaultBehavior: 'Default behavior: Both resume and cover letter content available - generating all three formats',
        defaultResumeOnly: 'Default behavior: Only resume content available - generating resume only',
    },
};
const ats = {
    sectionTitles: {
        experience: 'EXPERIENCE',
        education: 'EDUCATION',
        skills: 'SKILLS',
        projects: 'PROJECTS',
        speakingEngagements: 'SPEAKING ENGAGEMENTS',
        languages: 'LANGUAGES',
    },
    dateFormat: 'MMM-YYYY',
};
const theme = {
    colors,
    typography,
    spacing,
    layout,
    fileNaming,
    cli,
    messages,
    ats,
};
export default theme;
//# sourceMappingURL=theme.js.map