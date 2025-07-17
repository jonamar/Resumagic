"""
Sample test data for keyword analysis tests
"""

SAMPLE_RESUME_DATA = {
    'personal': {
        'name': 'John Doe',
        'email': 'john.doe@example.com',
        'phone': '+1-555-0123',
        'location': 'San Francisco, CA'
    },
    'experiences': [
        {
            'title': 'Senior Product Manager',
            'company': 'TechCorp Inc.',
            'duration': '2020-2023',
            'description': 'Led product management initiatives for enterprise SaaS platform serving 10,000+ users. Collaborated with cross-functional teams including engineering, design, and sales to deliver features that increased user engagement by 40%. Managed product roadmap and prioritized feature development using agile methodology. Successfully launched 3 major product releases.'
        },
        {
            'title': 'Product Manager',
            'company': 'StartupCo',
            'duration': '2018-2020',
            'description': 'Developed product strategy for mobile application with 50,000+ downloads. Conducted user research and market analysis to identify growth opportunities. Worked closely with engineering team to implement user-requested features. Led go-to-market strategy for product launches.'
        },
        {
            'title': 'Associate Product Manager',
            'company': 'BigTech Corp',
            'duration': '2016-2018',
            'description': 'Supported senior product managers in feature development and market research. Analyzed user behavior data to identify improvement opportunities. Participated in sprint planning and stakeholder communication.'
        }
    ],
    'skills': [
        'Product Management',
        'Agile Methodology',
        'Scrum Framework',
        'User Research',
        'Market Analysis',
        'Cross-functional Team Leadership',
        'Product Strategy',
        'Roadmap Planning',
        'Stakeholder Management',
        'Data Analysis',
        'A/B Testing',
        'Go-to-Market Strategy'
    ],
    'education': [
        {
            'degree': 'Master of Business Administration (MBA)',
            'school': 'Stanford Graduate School of Business',
            'year': '2016',
            'gpa': '3.8'
        },
        {
            'degree': 'Bachelor of Science in Computer Science',
            'school': 'University of California, Berkeley',
            'year': '2014',
            'gpa': '3.6'
        }
    ],
    'projects': [
        {
            'name': 'E-commerce Platform Redesign',
            'description': 'Led complete redesign of e-commerce platform resulting in 25% increase in conversion rate. Coordinated with UX team and engineering to implement new checkout flow.'
        }
    ]
}

SAMPLE_KEYWORDS_SIMPLE = [
    'product management',
    'senior product manager',
    'agile methodology',
    'team leadership',
    'user research',
    'market analysis',
    'strategic planning'
]

SAMPLE_KEYWORDS_WITH_KNOCKOUTS = [
    'product management',
    'senior product manager',
    '5+ years of product management experience',
    '3+ years in a senior role',
    'MBA degree',
    'Bachelor\'s degree in Business or related field',
    'agile methodology',
    'scrum master certification',
    'team leadership',
    'cross-functional collaboration',
    'user research',
    'market analysis',
    'strategic planning',
    'data-driven decision making',
    'go-to-market strategy'
]

SAMPLE_KEYWORDS_LEGACY_FORMAT = [
    {'kw': 'product management'},
    {'kw': 'team leadership'},
    {'text': 'agile methodology'},
    {'kw': '5+ years experience'},
    {'text': 'MBA required'}
]

SAMPLE_KEYWORDS_MIXED_FORMAT = [
    'product management',  # String format
    {'kw': 'team leadership'},  # Dict with 'kw'
    {'text': 'agile methodology'},  # Dict with 'text'
    '3+ years of experience',  # String format
    {'kw': 'MBA degree'}  # Dict with 'kw'
]

EXPECTED_KNOCKOUTS = [
    '5+ years of product management experience',
    '3+ years in a senior role',
    'MBA degree',
    'Bachelor\'s degree in Business or related field',
    'scrum master certification'
]

EXPECTED_SKILLS = [
    'product management',
    'senior product manager',
    'agile methodology',
    'team leadership',
    'cross-functional collaboration',
    'user research',
    'market analysis',
    'strategic planning',
    'data-driven decision making',
    'go-to-market strategy'
]

SAMPLE_CATEGORIZED_RESULTS = {
    'knockouts': [
        {
            'keyword': 'MBA degree',
            'score': 0.85,
            'aliases': []
        },
        {
            'keyword': '5+ years of product management experience',
            'score': 0.78,
            'aliases': ['5+ years in product', 'product management experience']
        }
    ],
    'skills': [
        {
            'keyword': 'product management',
            'score': 0.95,
            'aliases': ['product strategy', 'product planning']
        },
        {
            'keyword': 'team leadership',
            'score': 0.87,
            'aliases': ['leadership skills', 'team management']
        },
        {
            'keyword': 'agile methodology',
            'score': 0.82,
            'aliases': ['agile development', 'scrum methodology']
        }
    ]
}

SAMPLE_INJECTION_ANALYSIS = {
    'injection_analysis': [
        {
            'keyword': 'product management',
            'injection_score': 0.92,
            'matches': [
                {
                    'sentence': 'Led product management initiatives for enterprise SaaS platform',
                    'similarity': 0.89,
                    'section': 'experiences'
                },
                {
                    'sentence': 'Product Management',
                    'similarity': 0.95,
                    'section': 'skills'
                }
            ]
        },
        {
            'keyword': 'team leadership',
            'injection_score': 0.75,
            'matches': [
                {
                    'sentence': 'Collaborated with cross-functional teams',
                    'similarity': 0.76,
                    'section': 'experiences'
                }
            ]
        },
        {
            'keyword': 'blockchain technology',
            'injection_score': 0.0,
            'matches': []
        }
    ]
}

def get_sample_resume_minimal():
    """Get minimal resume data for testing edge cases"""
    return {
        'personal': {'name': 'Jane Doe'},
        'experiences': []
    }

def get_sample_resume_no_skills():
    """Get resume data without skills section"""
    data = SAMPLE_RESUME_DATA.copy()
    del data['skills']
    return data

def get_sample_resume_no_education():
    """Get resume data without education section"""
    data = SAMPLE_RESUME_DATA.copy()
    del data['education']
    return data

def get_sample_keywords_no_knockouts():
    """Get keywords with no knockout patterns"""
    return [
        'product management',
        'team leadership',
        'agile methodology',
        'user research',
        'strategic planning'
    ]

def get_sample_keywords_all_knockouts():
    """Get keywords that are all knockouts"""
    return [
        '5+ years of experience',
        'MBA required',
        'Bachelor\'s degree',
        'PMP certification',
        '3+ years in senior role'
    ]