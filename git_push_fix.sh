#!/bin/bash
git init
git remote add origin https://github.com/Subhra1432/Smart-Dine.git 2>/dev/null || git remote set-url origin https://github.com/Subhra1432/Smart-Dine.git
git remote add huggingface https://huggingface.co/spaces/Subhra1432/Smart-DIne.git 2>/dev/null || git remote set-url huggingface https://huggingface.co/spaces/Subhra1432/Smart-DIne.git
git add .
git commit -m "docs: update entire README and remove all emojis"
git push origin main --force
git push huggingface main --force
