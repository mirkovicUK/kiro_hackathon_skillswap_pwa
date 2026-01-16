# Implementation Plan: Demo Video

## Overview

This plan implements the demo video asset generation system for the Dynamous Kiro Hackathon. Tasks create the voice script, Python audio generator, and supporting infrastructure in a `video/` folder.

## Tasks

- [x] 1. Set up video folder structure
  - Create `video/` directory in project root
  - _Requirements: 1.1_

- [x] 2. Create voice script with SSML markup
  - [x] 2.1 Write INTRO section (~60 words)
    - Hook: "The skill swap is the excuse. Human connection is the product."
    - Problem statement: urban loneliness, strangers with skills
    - Triple-solve: verification + safety + loneliness
    - Include SSML `<speak>`, `<prosody>`, `<break>` tags
    - _Requirements: 2.2, 2.3_

  - [x] 2.2 Write KIRO_USAGE section (~80 words)
    - 5 feature specs with requirements, design, tasks
    - 7 steering documents
    - 13 custom prompts available through chat interface
    - 45 correctness properties tested with fast-check
    - _Requirements: 2.4_

  - [x] 2.3 Write SETUP section (~40 words)
    - npm install && npm run dev
    - Client: localhost:5173, Server: localhost:3001
    - _Requirements: 2.5_

  - [x] 2.4 Write FRONT_PAGE section (~50 words)
    - Hero section walkthrough
    - How it works steps
    - Call to action
    - _Requirements: 2.6_

  - [x] 2.5 Write AUTH section (~30 words)
    - Register with email
    - Login flow
    - _Requirements: 2.6_

  - [x] 2.6 Write APP_FLOW section (~150 words)
    - Profile: Add skills you offer and need
    - Discover: See matches within 2 miles
    - Match: Express interest, wait for mutual
    - Meet: Schedule coffee meeting
    - Confirm: Both verify meeting happened
    - _Requirements: 2.6_

  - [x] 2.7 Write OUTRO section (~40 words)
    - Incognito mode for two-user testing
    - Demo users auto-respond for single-user testing
    - Thank you / closing
    - _Requirements: 2.7_

  - [x] 2.8 Assemble complete script file
    - Combine all sections into `video/demo_script.txt`
    - Verify section markers present
    - Verify SSML tags properly nested
    - _Requirements: 1.2, 2.1, 2.8, 2.9, 4.1, 4.2, 4.3_

- [x] 3. Create Python audio generator
  - [x] 3.1 Create generator script skeleton
    - Create `video/generate_audio.py`
    - Import boto3, os, sys
    - Define main() entry point
    - _Requirements: 1.4, 3.1_

  - [x] 3.2 Implement script reading function
    - read_script(path) → str
    - Validate file exists
    - Return script content
    - _Requirements: 3.4_

  - [x] 3.3 Implement text splitting function
    - split_for_polly(text, max_chars=3000) → list[str]
    - Split at section markers
    - Respect Polly's 3000 character limit
    - _Requirements: 3.6_

  - [x] 3.4 Implement speech synthesis function
    - synthesize_speech(polly_client, text, is_ssml) → bytes
    - Use Matthew voice (neural, en-US)
    - Handle SSML vs plain text
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 3.5 Implement audio concatenation function
    - concatenate_audio(segments) → bytes
    - Combine multiple MP3 segments
    - _Requirements: 3.6_

  - [x] 3.6 Implement main workflow
    - Read script from video/demo_script.txt
    - Split if needed
    - Synthesize each segment
    - Concatenate and save to video/demo_audio.mp3
    - _Requirements: 1.3, 3.5_

- [x] 4. Checkpoint - Verify assets
  - Ensure video/ folder exists with all files
  - Ensure script word count is 400-500 words
  - Ensure generator script is syntactically valid
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The audio generator requires AWS credentials configured locally
- Final video recording is done manually using the generated audio

