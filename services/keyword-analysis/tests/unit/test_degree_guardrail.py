import json
import subprocess
import sys
from pathlib import Path


def test_degree_guardrail_demotes_unmentioned_degree(tmp_path):
    # Create temp structure: inputs/ with files so working/ resolves correctly
    inputs_dir = tmp_path / "inputs"
    inputs_dir.mkdir(parents=True, exist_ok=True)

    job_post = (
        "Mila seeks an Entrepreneur in Residence. STEM or deep tech background is a plus."
    )
    (inputs_dir / "job.md").write_text(job_post, encoding="utf-8")

    keywords = {
        "keywords": [
            {"kw": "5+ years startup experience", "role": "core"},
            {"kw": "Bachelor's degree in Computer Science", "role": "core"},
        ]
    }
    (inputs_dir / "keywords.json").write_text(
        json.dumps(keywords), encoding="utf-8"
    )

    # Run analyzer via CLI in service directory
    service_dir = Path(__file__).resolve().parents[2]
    script = service_dir / "kw_rank_modular.py"

    result = subprocess.run(
        [
            sys.executable,
            str(script),
            str(inputs_dir / "keywords.json"),
            str(inputs_dir / "job.md"),
            "--top",
            "5",
        ],
        cwd=str(service_dir),
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"Analyzer failed: {result.stderr}\n{result.stdout}"

    # Read analysis output
    working_dir = tmp_path / "working"
    analysis_path = working_dir / "keyword_analysis.json"
    assert analysis_path.exists(), "keyword_analysis.json not created"

    analysis = json.loads(analysis_path.read_text(encoding="utf-8"))
    knockouts = analysis.get("knockout_requirements", [])
    knockout_texts = [k.get("kw", "").lower() for k in knockouts]

    # Degree should NOT be in knockouts (tfidf==0)
    assert all("computer science" not in txt for txt in knockout_texts), (
        f"Degree leaked into knockouts: {knockout_texts}\nstdout: {result.stdout}\nstderr: {result.stderr}"
    )




