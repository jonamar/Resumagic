#!/usr/bin/env python3
"""
Test runner for keyword analysis service

Usage:
    python run_tests.py              # Run all tests
    python run_tests.py --unit       # Run only unit tests
    python run_tests.py --integration # Run only integration tests
    python run_tests.py --coverage   # Run with coverage report
"""
import subprocess
import sys
import argparse
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout.strip():
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        if e.stdout:
            print("STDOUT:", e.stdout)
        if e.stderr:
            print("STDERR:", e.stderr)
        return False


def install_test_dependencies():
    """Install test dependencies"""
    return run_command(
        "pip install -r test_requirements.txt",
        "Installing test dependencies"
    )


def run_tests(test_type="all", with_coverage=False):
    """Run tests with specified options"""
    base_cmd = "python -m pytest"
    
    if test_type == "unit":
        cmd = f"{base_cmd} tests/unit/ -m unit"
    elif test_type == "integration":
        cmd = f"{base_cmd} tests/integration/ -m integration"
    else:
        cmd = f"{base_cmd} tests/"
    
    if with_coverage:
        cmd += " --cov=kw_rank --cov-report=term-missing --cov-report=html"
    
    return run_command(cmd, f"Running {test_type} tests")


def run_linting():
    """Run code linting"""
    commands = [
        ("python -m flake8 kw_rank/ --max-line-length=88 --extend-ignore=E203,W503", "Flake8 linting"),
        ("python -m black --check kw_rank/", "Black formatting check"),
        ("python -m isort --check-only kw_rank/", "Import sorting check")
    ]
    
    all_passed = True
    for cmd, description in commands:
        if not run_command(cmd, description):
            all_passed = False
    
    return all_passed


def main():
    parser = argparse.ArgumentParser(description="Run keyword analysis tests")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--coverage", action="store_true", help="Run with coverage report")
    parser.add_argument("--lint", action="store_true", help="Run linting checks")
    parser.add_argument("--install-deps", action="store_true", help="Install test dependencies")
    
    args = parser.parse_args()
    
    # Change to script directory
    script_dir = Path(__file__).parent
    import os
    os.chdir(script_dir)
    
    success = True
    
    # Install dependencies if requested
    if args.install_deps:
        if not install_test_dependencies():
            success = False
    
    # Run linting if requested
    if args.lint:
        if not run_linting():
            success = False
    
    # Determine test type
    test_type = "all"
    if args.unit:
        test_type = "unit"
    elif args.integration:
        test_type = "integration"
    
    # Run tests
    if not run_tests(test_type, args.coverage):
        success = False
    
    # Summary
    if success:
        print("\n🎉 All checks passed!")
        return 0
    else:
        print("\n💥 Some checks failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())