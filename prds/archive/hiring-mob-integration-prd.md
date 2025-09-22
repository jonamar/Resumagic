goal: simulate a hiring review board's feedback in order to gather constructive critiques in advance of submitting a job application. 

background: I developed a feature called hiring mob in a sandbox. the hiring mob feature was designed from the ground up to become part of the resumagic pipeline. the system was carefully calibrated to produce construtive critiques on a given resume. the prompts and persons are very intentionally crafted and MUST NOT be changed. 



inputs: 
    - in order to make it simple to integrate into the resumagic pipeline we built the system to work with json resumes and md job postings, formatted exactly as they are in resumagic. for example:
        - '/Users/jonamar/Documents/resumagic/data/applications/elovate-director-product-management/inputs/resume.json' 
        - '/Users/jonamar/Documents/resumagic/data/applications/elovate-director-product-management/inputs/job-posting.md' 
    - hiring mob also ingest ranked keywords in order to see the prompts that are given to each virtual review board member. these were also formatted exactly as they are in resumagic. for example:
        - '/Users/jonamar/Documents/resumagic/data/applications/elovate-director-product-management/working/keyword_analysis.json'
- 

existing features:
- a resume and job posting 
refining the prompts to integrate with  

hiring mob is focused on creating a simulated review board to evaluate a given resume in comparison to a given job posting. the resume and job posting we  we also built in a feature to bring additional context into the resume review prompts (for each persona) that would pull relevant keywords from '/Users/jonamar/Documents/resumagic/data/applications/


elovate-director-product-management/working/keyword_analysis.json'. the idea being that we could plug any job post, resume, and keyword analysis into the simulated review board and use its feedback as part of the refinement process. the system also produces a md report that summarizes all the feedback from the simulated review board. we carefully refined the feedback we were getting from the local llm (using ollama) to calibrate it to provide valuable feedback. the prompts and the personas and how they are sent to the llm are all carefully and intentionally calibrated to produce reliable and useful results. in terms of where this fits into the resumagic workflow, the simplest and initial use case should be: 1. extract keywords (existing resumagic functionality) 2. generate keyword categorization, ranking and report (existing resumagic functionality) 3.