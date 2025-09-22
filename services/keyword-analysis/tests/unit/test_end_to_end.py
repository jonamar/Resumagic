import os
import json
import tempfile
from kw_rank.main import main as kw_main


def write_tmp(file_path, content):
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)


def test_degree_guardrail_demotes_unmentioned_degree(tmp_path):
    # Prepare minimal job posting WITHOUT degree mention
    job_post = """
    Mila seeks an Entrepreneur in Residence. STEM or deep tech background is a plus.
    """.strip()

    # Seed keywords include a CS degree as core (simulating extractor leakage)
    keywords = {
        "keywords": [
            {"kw": "5+ years startup experience", "role": "core"},
            {"kw": "Bachelor's degree in Computer Science", "role": "core"}
        ]
    }

    keywords_file = tmp_path / "keywords.json"
    job_file = tmp_path / "job.md"

    write_tmp(str(keywords_file), json.dumps(keywords))
    write_tmp(str(job_file), job_post)

    # Run analyzer end-to-end
    cwd = os.getcwd()
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    try:
        # kw_rank_modular.py expects CLI; here we call main() via argparse emulation
        import sys
        saved_argv = sys.argv[:]
        sys.argv = [
            "kw_rank_modular.py",
            str(keywords_file),
            str(job_file),
            "--top", "5"
        ]
        kw_main()
    finally:
        os.chdir(cwd)
        try:
            sys.argv = saved_argv
        except Exception:
            pass

    # Read outputs
    # Outputs are written to tmp_root/working per service convention
    working_dir = tmp_path.parent / "working"
    analysis_path = working_dir / "keyword_analysis.json"
    assert analysis_path.exists(), "keyword_analysis.json not created"

    with open(analysis_path, 'r', encoding='utf-8') as f:
        analysis = json.load(f)

    knockouts = analysis.get("knockout_requirements", [])
    knockout_texts = [k["kw"].lower() for k in knockouts]

    # Degree should NOT be in knockouts because tfidf=0 (not in posting)
    assert all("computer science" not in txt for txt in knockout_texts), (
        f"Degree leaked into knockouts: {knockout_texts}"
    )




