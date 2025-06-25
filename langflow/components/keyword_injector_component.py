import json
import re
from typing import Any, Dict, List
from pathlib import Path

from langflow.custom import Component
from langflow.inputs import MessageTextInput, IntInput, BoolInput
from langflow.io import Output
from langflow.schema.message import Message


class KeywordInjector(Component):
    display_name = "Resume Keyword Injector"
    description = "Intelligently inject job-relevant keywords into resume JSON using line-by-line processing for high-priority terms and skills section enhancement for low-priority terms"
    icon = "FileText"
    name = "KeywordInjector"

    inputs = [
        MessageTextInput(
            name="resume_json",
            display_name="Resume JSON",
            info="JSON resume data to be enhanced with keywords",
            required=True,
        ),
        MessageTextInput(
            name="keywords_data",
            display_name="Keywords Data",
            info="JSON object with keywords and their priority/usage data",
            required=True,
        ),
        IntInput(
            name="high_priority_threshold",
            display_name="High Priority Threshold",
            info="Priority score threshold for line-by-line injection (default: 7)",
            value=7,
        ),
        IntInput(
            name="max_modifications_per_section",
            display_name="Max Modifications Per Section",
            info="Maximum number of lines to modify per work/education section",
            value=2,
        ),
        BoolInput(
            name="preserve_formatting",
            display_name="Preserve Markdown Formatting",
            info="Keep existing **bold** and *italic* formatting in text",
            value=True,
        ),
        BoolInput(
            name="create_additional_skills_section",
            display_name="Create Additional Skills Section",
            info="Add low-priority keywords to a new 'Core Competencies' skills section",
            value=True,
        ),
    ]

    outputs = [
        Output(
            display_name="Enhanced Resume",
            name="enhanced_resume",
            method="inject_keywords",
        ),
    ]

    def inject_keywords(self) -> Message:
        """Main method to inject keywords into resume JSON"""
        
        try:
            # Parse inputs
            resume_data = json.loads(self.resume_json)
            keywords_data = json.loads(self.keywords_data)
            
            # Separate high and low priority keywords
            high_priority_keywords = []
            low_priority_keywords = []
            
            for keyword, data in keywords_data.items():
                if isinstance(data, list) and len(data) > 0:
                    keyword_info = data[0]  # Take first entry
                    priority = keyword_info.get('priority', 0)
                    
                    if priority >= self.high_priority_threshold:
                        high_priority_keywords.append({
                            'term': keyword,
                            'priority': priority,
                            'used_exact': keyword_info.get('used exact match', 0),
                            'used_adjusted': keyword_info.get('used adjusted', 0)
                        })
                    else:
                        low_priority_keywords.append({
                            'term': keyword,
                            'priority': priority
                        })
            
            # Sort high priority by priority score (descending)
            high_priority_keywords.sort(key=lambda x: x['priority'], reverse=True)
            
            # Track modifications
            modification_log = {
                'high_priority_processed': 0,
                'low_priority_added': 0,
                'lines_modified': 0,
                'sections_affected': []
            }
            
            # Process high-priority keywords with line-by-line injection
            resume_data = self._inject_high_priority_keywords(
                resume_data, high_priority_keywords, modification_log
            )
            
            # Add low-priority keywords to skills section
            if self.create_additional_skills_section and low_priority_keywords:
                resume_data = self._add_low_priority_to_skills(
                    resume_data, low_priority_keywords, modification_log
                )
            
            # Create response
            result = {
                'resume': resume_data,
                'modification_log': modification_log,
                'high_priority_keywords': len(high_priority_keywords),
                'low_priority_keywords': len(low_priority_keywords)
            }
            
            return Message(
                text=json.dumps(result, indent=2)
            )
            
        except Exception as e:
            return Message(
                text=f"Error processing keywords: {str(e)}"
            )
    
    def _inject_high_priority_keywords(self, resume_data: Dict, keywords: List[Dict], log: Dict) -> Dict:
        """Inject high-priority keywords using line-by-line processing"""
        
        # Target sections for high-priority injection
        target_sections = ['work', 'education', 'projects']
        
        for section_name in target_sections:
            if section_name in resume_data:
                section_data = resume_data[section_name]
                modifications_in_section = 0
                
                for item_idx, item in enumerate(section_data):
                    if modifications_in_section >= self.max_modifications_per_section:
                        break
                        
                    # Process highlights if they exist
                    if 'highlights' in item and item['highlights']:
                        for highlight_idx, highlight in enumerate(item['highlights']):
                            if modifications_in_section >= self.max_modifications_per_section:
                                break
                                
                            # Try to inject unused high-priority keywords
                            for keyword in keywords:
                                if keyword['used_exact'] > 0:  # Skip if already used
                                    continue
                                    
                                # Check if keyword can be naturally integrated
                                modified_highlight = self._attempt_keyword_injection(
                                    highlight, keyword['term']
                                )
                                
                                if modified_highlight != highlight:
                                    resume_data[section_name][item_idx]['highlights'][highlight_idx] = modified_highlight
                                    keyword['used_exact'] += 1
                                    modifications_in_section += 1
                                    log['lines_modified'] += 1
                                    log['high_priority_processed'] += 1
                                    
                                    if section_name not in log['sections_affected']:
                                        log['sections_affected'].append(section_name)
                                    break
        
        return resume_data
    
    def _attempt_keyword_injection(self, text: str, keyword: str) -> str:
        """Attempt to inject keyword into text using pattern-based rules"""
        
        # Simple pattern-based injection rules
        patterns = [
            # "Built X by" -> "Built [keyword] X by"
            {
                'pattern': r'Built\s+(.*?)\s+by',
                'replacement': f'Built {keyword}-driven \\1 by',
                'condition': lambda t: 'built' in t.lower() and keyword.lower() not in t.lower()
            },
            # "Led X team" -> "Led X team leveraging [keyword]"
            {
                'pattern': r'Led\s+(.*?)\s+team',
                'replacement': f'Led \\1 team leveraging {keyword}',
                'condition': lambda t: 'led' in t.lower() and 'team' in t.lower() and keyword.lower() not in t.lower()
            },
            # "Drove X growth" -> "Drove X growth in [keyword]"
            {
                'pattern': r'Drove\s+(.*?)\s+growth',
                'replacement': f'Drove \\1 growth in {keyword}',
                'condition': lambda t: 'drove' in t.lower() and 'growth' in t.lower() and keyword.lower() not in t.lower()
            },
            # Generic append at end for platform/technology keywords
            {
                'pattern': r'(.+)(\.|$)',
                'replacement': f'\\1 using {keyword}\\2',
                'condition': lambda t: any(tech_word in keyword.lower() for tech_word in ['platform', 'technology', 'system', 'tool']) and keyword.lower() not in t.lower() and len(t) < 150
            }
        ]
        
        for pattern_rule in patterns:
            if pattern_rule['condition'](text):
                match = re.search(pattern_rule['pattern'], text, re.IGNORECASE)
                if match:
                    modified = re.sub(
                        pattern_rule['pattern'], 
                        pattern_rule['replacement'], 
                        text, 
                        count=1, 
                        flags=re.IGNORECASE
                    )
                    # Only return if the modification looks reasonable
                    if len(modified) - len(text) < 50:  # Don't make text too long
                        return modified
        
        return text  # Return original if no good injection found
    
    def _add_low_priority_to_skills(self, resume_data: Dict, keywords: List[Dict], log: Dict) -> Dict:
        """Add low-priority keywords to skills section"""
        
        if 'skills' not in resume_data:
            resume_data['skills'] = []
        
        # Create or find "Core Competencies" section
        core_competencies_section = None
        for skill_section in resume_data['skills']:
            if skill_section.get('name', '').lower() in ['core competencies', 'additional skills', 'technologies']:
                core_competencies_section = skill_section
                break
        
        if not core_competencies_section:
            core_competencies_section = {
                'name': 'Core Competencies',
                'keywords': []
            }
            resume_data['skills'].append(core_competencies_section)
        
        # Add low-priority keywords (avoiding duplicates)
        existing_keywords = set(k.lower() for k in core_competencies_section.get('keywords', []))
        
        for keyword in keywords:
            if keyword['term'].lower() not in existing_keywords:
                core_competencies_section['keywords'].append(keyword['term'])
                log['low_priority_added'] += 1
        
        return resume_data 