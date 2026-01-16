# Requirements Document

## Introduction

This spec defines the requirements for creating a demo video submission for the Dynamous Kiro Hackathon. The video will showcase SkillSwap PWA and demonstrate innovative Kiro IDE usage. A unique innovation: Kiro gives itself a voice through Amazon Polly, narrating the demo.

## Glossary

- **Demo_Video**: The final video submission for the hackathon (max 3 minutes)
- **Voice_Script**: Text file optimized for Amazon Polly Matthew voice
- **Polly_Generator**: Python script that converts text to speech using AWS Polly
- **Video_Folder**: Directory containing all demo video assets (`video/`)

## Requirements

### Requirement 1: Video Asset Organization

**User Story:** As a hackathon submitter, I want all video assets organized in a dedicated folder, so that the demo creation process is streamlined.

#### Acceptance Criteria

1. THE Demo_Video system SHALL create a `video/` folder in the project root
2. THE Demo_Video system SHALL store the voice script as `video/demo_script.txt`
3. THE Demo_Video system SHALL store the generated audio as `video/demo_audio.mp3`
4. THE Demo_Video system SHALL store the Python generator as `video/generate_audio.py`

### Requirement 2: Voice Script Content

**User Story:** As a hackathon judge, I want to understand the project's value proposition and Kiro usage within 3 minutes, so that I can evaluate the submission effectively.

#### Acceptance Criteria

1. THE Voice_Script SHALL be optimized for Amazon Polly Matthew voice (natural pauses, clear pronunciation)
2. THE Voice_Script SHALL cover the unique value proposition ("The skill swap is the excuse. Human connection is the product.")
3. THE Voice_Script SHALL explain the triple-solve innovation (verification, safety, loneliness)
4. THE Voice_Script SHALL demonstrate Kiro IDE usage (5 specs, 7 steering docs, 13 prompts available through chat interface, 45 correctness properties tested with fast-check)
5. THE Voice_Script SHALL include setup instructions (ports 5173 and 3001)
6. THE Voice_Script SHALL walk through the Single User + Demo Users flow (front page → register → profile → discover → match → meet → confirm)
7. THE Voice_Script SHALL mention that judges can use incognito mode for full two-user testing
7. THE Voice_Script SHALL be timed for approximately 3 minutes when read at natural pace
8. THE Voice_Script SHALL use SSML tags for pauses and emphasis where appropriate

### Requirement 3: Audio Generation

**User Story:** As a demo creator, I want to generate professional audio from the script, so that I can combine it with screen recording.

#### Acceptance Criteria

1. THE Polly_Generator SHALL use boto3 to connect to AWS Polly
2. THE Polly_Generator SHALL use the Matthew voice (neural, en-US)
3. THE Polly_Generator SHALL output MP3 format audio
4. THE Polly_Generator SHALL handle SSML markup in the script
5. THE Polly_Generator SHALL save output to `video/demo_audio.mp3`
6. WHEN the script exceeds Polly's character limit, THEN the Polly_Generator SHALL split and concatenate audio segments

### Requirement 4: Script Pacing for Video Recording

**User Story:** As a video recorder, I want the script paced for easy follow-along, so that I can record matching visuals.

#### Acceptance Criteria

1. THE Voice_Script SHALL include section markers for video synchronization
2. THE Voice_Script SHALL have natural pauses between sections for screen transitions
3. THE Voice_Script SHALL match the chronological flow: IDE/specs → setup → front page → login → app workflow
4. THE Voice_Script SHALL be slow enough for the recorder to follow along with mouse/keyboard actions
