/**
 * Resume theme configuration for DOCX generation
 * Based on visual-design-spec.md v0.3
 */

// Theme configuration with styling variables for DOCX generation
const theme = {
  // Colors
  colors: {
    headings: '#000000',  // Heading text color
    text: '#222222',      // Primary text color
    dimText: '#555555',   // Secondary text color
    background: '#FFFFFF',// Background color
  },
  
  // Typography
  fonts: {
    // ATS-friendly fonts with universal availability
    primary: 'Arial',
    fallback: ['sans-serif'],
  },
  
  // Font sizes (in points for DOCX - converted from pixel values in spec)
  fontSize: {
    name: 22,             // Resume name (22px)
    sectionHeading: 16,   // Section headings (16px)
    body: 10,             // Body text & bullets (reduced to 10pt)
    meta: 10,             // Meta text (dates, locations, etc.) (10px)
  },
  
  // Line spacing
  lineSpacing: {
    body: 1.25,           // Line height for body text
    heading: 1.15,        // Line height for headings
  },
  
  // Font styles
  fontStyles: {
    name: {
      bold: true,
      caps: true,
    },
    sectionHeading: {
      bold: true,
      letterSpacing: 0.5, // 0.5px letter-spacing
    },
  },
  
  // Spacing (in points - legacy values for backward compatibility)
  spacing: {
    sectionBefore: 20,    // Space before sections
    sectionAfter: 10,     // Space after sections
    paragraphAfter: 10,   // Space after paragraphs
    bulletAfter: 5,       // Space after bullet points
  },

  // Detailed spacing values (in twips - 1/20th of a point)
  // These replace the hardcoded values scattered throughout docx-template.js
  spacingTwips: {
    // Basic spacing units
    minimal: 20,          // 1pt - minimal gaps for tight connections
    small: 60,            // 3pt - small gaps
    medium: 80,           // 4pt - medium gaps
    large: 120,           // 6pt - large gaps
    xlarge: 180,          // 9pt - extra large gaps
    section: 240,         // 12pt - section spacing
    page: 480,            // 24pt - page-level spacing
    
    // Indentation
    bulletIndent: 360,    // 0.25 inch - bullet indentation
    bulletHanging: 360,   // 0.25 inch - bullet hanging indent
    
    // Line spacing multipliers (240 = 1.0x, 264 = 1.1x, 408 = 1.7x)
    singleLine: 240,      // 1.0 line spacing
    resumeLine: 264,      // 1.1 line spacing for resume sections
    oneAndHalfLine: 408,  // 1.7 line spacing for cover letter
    
    // Specific use cases
    afterHeader: 240,     // 12pt after header elements
    afterContact: 100,    // 5pt after contact info
    afterJobTitle: 40,    // 2pt after job titles (reduced from 3pt)
    afterCompanyName: 60, // 3pt after company names
    afterDate: 80,        // 4pt after date lines
    afterSummary: 120,    // 6pt after summary paragraphs (increased for better spacing)
    afterBullet: 60,      // 3pt after bullet points
    afterJobEntry: 80,    // 4pt after job entries
    afterProjectEntry: 180, // 9pt after project entries
    afterSectionEntry: 240, // 12pt after section entries
    beforeDate: 240,      // 12pt before date in cover letter
    afterDateCoverLetter: 480,       // 24pt after date in cover letter
    coverLetterParagraph: 240, // 12pt between cover letter paragraphs
    beforeContact: 240,   // 12pt before contact info in cover letter
  },
  
  // Margins (in twips - 1/20th of a point)
  margins: {
    document: {
      top: 720,           // 0.5 inch (36 points)
      bottom: 720,        // 0.5 inch
      left: 720,          // 0.5 inch
      right: 720,         // 0.5 inch
    },
  },
  
  // Layout
  layout: {
    maxWidth: 750,        // Max content width per spec (750px)
  },
  
  // File naming patterns
  fileNaming: {
    resumePattern: 'Jon-Amar-Resume-{company}.docx',
    coverLetterPattern: 'Jon-Amar-Cover-Letter-{company}.docx',
    combinedPattern: 'Jon-Amar-Cover-Letter-and-Resume-{company}.docx',
    
    // Directory structure
    dataDir: '../data',
    applicationsDir: 'applications',
    templateDir: 'template',
    inputsDir: 'inputs',
    outputsDir: 'outputs',
    
    // File names
    resumeFile: 'resume.json',
    coverLetterFile: 'cover-letter.md',
    markdownSuffix: '-cover-letter.md',
  },
  
  // CLI configuration
  cli: {
    flags: {
      preview: '--preview',
      coverLetter: '--cover-letter',
      both: '--both',
      auto: '--auto',
      combined: '--cover-letter-and-resume',
      evaluate: '--evaluate',
      all: '--all',
      fast: '--fast',
    },
    
    defaults: {
      autoPreview: true,
      maxModificationsPerSection: 2,
      highPriorityThreshold: 7,
    },
  },
  
  // User-facing messages
  messages: {
    // Emojis
    emojis: {
      error: '❌',
      success: '✅',
      warning: '⚠️',
      processing: '📄',
      document: '📑',
      company: '🏢',
      folder: '📁',
    },
    
    // Error messages
    errors: {
      noApplicationName: 'Error: Please specify an application folder name.',
      applicationNotFound: 'Error: Application folder not found at {path}',
      resumeNotFound: 'Error: Resume file not found at {path}',
      coverLetterNotFound: 'Error: Cover letter generation requested but no markdown file found.',
      resumeRequired: 'Make sure you have a resume.json file in the inputs folder.',
      coverLetterRequired: 'Expected: {path}',
    },
    
    // Success messages
    success: {
      resumeGenerated: 'Resume DOCX generated and saved to: {path}',
      coverLetterGenerated: 'Cover letter DOCX generated and saved to: {path}',
      combinedGenerated: 'Cover letter + resume DOCX generated and saved to: {path}',
      filesOpened: 'Files opened with system default app for preview',
      testsPass: 'All markdown parser tests passed!',
    },
    
    // Processing messages
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
    
    // Usage messages
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
  },
  
  // ATS best practices
  ats: {
    sectionTitles: {
      experience: "EXPERIENCE",
      education: "EDUCATION",
      skills: "SKILLS",
      projects: "PROJECTS",
      speakingEngagements: "SPEAKING ENGAGEMENTS",
      languages: "LANGUAGES",
    },
    dateFormat: "MMM-YYYY", // ATS-friendly date format
  }
};

export default theme;
