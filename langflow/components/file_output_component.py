import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from langflow.custom import Component
from langflow.inputs import MessageTextInput, BoolInput
from langflow.io import Output
from langflow.schema.message import Message


class ExperimentLogger(Component):
    display_name = "Experiment Logger"
    description = "Save cover letter generation experiments to organized files"
    icon = "FileText"
    name = "ExperimentLogger"

    inputs = [
        MessageTextInput(
            name="job_name",
            display_name="Job Name",
            info="Name of the job/company for file organization",
            required=True,
        ),
        MessageTextInput(
            name="keywords",
            display_name="Keywords",
            info="Extracted keywords from job posting",
            required=False,
        ),
        MessageTextInput(
            name="draft_v1",
            display_name="First Draft",
            info="Initial cover letter draft",
            required=False,
        ),
        MessageTextInput(
            name="review_feedback",
            display_name="Review Board Feedback",
            info="JSON feedback from virtual review board",
            required=False,
        ),
        MessageTextInput(
            name="final_draft",
            display_name="Final Draft",
            info="Refined cover letter after review board feedback",
            required=True,
        ),
        MessageTextInput(
            name="job_posting",
            display_name="Job Posting",
            info="Original job posting text",
            required=False,
        ),
        BoolInput(
            name="save_individual_files",
            display_name="Save Individual Files",
            info="Save each component as separate files",
            value=True,
        ),
    ]

    outputs = [
        Output(
            display_name="Experiment Path",
            name="experiment_path",
            method="save_experiment",
        ),
    ]

    def save_experiment(self) -> Message:
        """Save experiment data to organized file structure"""
        
        # Create timestamp and sanitize job name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        job_name_clean = "".join(c for c in self.job_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        job_name_clean = job_name_clean.replace(' ', '_')
        
        # Create experiment directory (now points to data/langflow/experiments)
        experiment_dir = Path("data/langflow/experiments") / f"{job_name_clean}_{timestamp}"
        experiment_dir.mkdir(parents=True, exist_ok=True)
        
        # Prepare experiment log
        experiment_log = {
            "timestamp": datetime.now().isoformat(),
            "job_name": self.job_name,
            "experiment_id": f"{job_name_clean}_{timestamp}",
            "files_created": []
        }
        
        # Save individual files if requested
        if self.save_individual_files:
            
            # Save job posting
            if self.job_posting:
                job_file = experiment_dir / "job_posting.txt"
                with open(job_file, 'w', encoding='utf-8') as f:
                    f.write(self.job_posting)
                experiment_log["files_created"].append(str(job_file))
            
            # Save keywords
            if self.keywords:
                keywords_file = experiment_dir / "keywords.txt"
                with open(keywords_file, 'w', encoding='utf-8') as f:
                    f.write(self.keywords)
                experiment_log["files_created"].append(str(keywords_file))
            
            # Save first draft
            if self.draft_v1:
                draft_file = experiment_dir / "draft_v1.md"
                with open(draft_file, 'w', encoding='utf-8') as f:
                    f.write(self.draft_v1)
                experiment_log["files_created"].append(str(draft_file))
            
            # Save review feedback
            if self.review_feedback:
                review_file = experiment_dir / "review_feedback.json"
                try:
                    # Try to parse and pretty-print JSON
                    feedback_data = json.loads(self.review_feedback)
                    with open(review_file, 'w', encoding='utf-8') as f:
                        json.dump(feedback_data, f, indent=2)
                except json.JSONDecodeError:
                    # If not valid JSON, save as text
                    with open(review_file, 'w', encoding='utf-8') as f:
                        f.write(self.review_feedback)
                experiment_log["files_created"].append(str(review_file))
            
            # Save final draft
            final_file = experiment_dir / "final_draft.md"
            with open(final_file, 'w', encoding='utf-8') as f:
                f.write(self.final_draft)
            experiment_log["files_created"].append(str(final_file))
        
        # Save experiment log
        log_file = experiment_dir / "experiment_log.json"
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(experiment_log, f, indent=2)
        
        # Create summary for easy comparison
        summary = {
            "job_name": self.job_name,
            "timestamp": timestamp,
            "final_draft_preview": self.final_draft[:200] + "..." if len(self.final_draft) > 200 else self.final_draft,
            "experiment_path": str(experiment_dir)
        }
        
        return Message(
            text=f"Experiment saved to: {experiment_dir}\n\nFiles created: {len(experiment_log['files_created'])}\n\nSummary: {json.dumps(summary, indent=2)}"
        ) 