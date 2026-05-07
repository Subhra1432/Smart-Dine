#!/bin/bash
git init
git remote add origin https://github.com/Subhra1432/Dine_Smart.git
git remote add huggingface https://huggingface.co/spaces/Subhra1432/Dine_Smart.git
git add .
git commit -m "docs: update entire README and remove all emojis"
git push origin main --force
git push huggingface main --force
