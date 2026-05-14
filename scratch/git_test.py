import subprocess
import os

def run_git():
    try:
        result = subprocess.run(['git', 'remote', '-v'], capture_output=True, text=True)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("Return Code:", result.returncode)
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    run_git()
