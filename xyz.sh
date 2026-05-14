#!/bin/bash
git remote set-url origin https://github.com/Subhra1432/Smart-Dine.git
git remote set-url huggingface https://huggingface.co/spaces/Subhra1432/Smart-DIne.git
git add .
git commit -m "chore: update remotes for render deployment"
git push origin main --force
git push huggingface main --force
