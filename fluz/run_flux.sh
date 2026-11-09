#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./run_flux.sh \"<your prompt>\" [output_filename.png]"
  exit 1
fi

PROMPT="$1"
OUTPUT="${2:-images/output.png}"

source venv/bin/activate
python generate.py "$PROMPT" --output "$OUTPUT"
