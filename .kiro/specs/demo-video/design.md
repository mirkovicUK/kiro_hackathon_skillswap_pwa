# Design Document: Demo Video

## Overview

This design specifies the implementation of a demo video asset generation system for the Dynamous Kiro Hackathon submission. The system creates a voice script optimized for Amazon Polly and a Python generator to produce professional audio narration.

The unique innovation: Kiro gives itself a voice by generating the Polly script, creating a meta-demonstration of AI-assisted development.

## Architecture

```
video/
├── demo_script.txt      # SSML-formatted voice script
├── generate_audio.py    # Python script using boto3 + Polly
└── demo_audio.mp3       # Generated audio output
```

**Workflow:**
1. Create `video/` directory
2. Write voice script with SSML markup and section markers
3. Create Python generator that uses AWS Polly
4. Run generator to produce MP3 audio
5. Use audio with screen recording for final video

## Components and Interfaces

### Component 1: Voice Script (`demo_script.txt`)

**Purpose:** SSML-formatted text optimized for Amazon Polly Matthew voice.

**Structure:**
```
[SECTION: INTRO]
<speak>
  <prosody rate="medium">
    Welcome to SkillSwap...
    <break time="500ms"/>
  </prosody>
</speak>

[SECTION: KIRO_USAGE]
...

[SECTION: SETUP]
...

[SECTION: DEMO_FLOW]
...
```

**Section Markers:**
- `[SECTION: INTRO]` - Value proposition and triple-solve
- `[SECTION: KIRO_USAGE]` - IDE features, specs, steering, prompts, properties
- `[SECTION: SETUP]` - Installation and port instructions
- `[SECTION: FRONT_PAGE]` - Landing page walkthrough
- `[SECTION: AUTH]` - Login/Register flow
- `[SECTION: APP_FLOW]` - Profile → Discover → Match → Meet → Confirm
- `[SECTION: OUTRO]` - Incognito mention and closing

**SSML Tags Used:**
- `<speak>` - Root element
- `<prosody rate="medium">` - Speaking rate control
- `<break time="Xms"/>` - Pauses for transitions
- `<emphasis level="moderate">` - Key phrases

**Timing Target:** ~450 words (3 minutes at 150 wpm)

### Component 2: Audio Generator (`generate_audio.py`)

**Purpose:** Python script that converts the voice script to MP3 using AWS Polly.

**Interface:**
```python
def main():
    """Generate audio from demo_script.txt using AWS Polly."""
    
def read_script(path: str) -> str:
    """Read and validate the voice script."""
    
def split_for_polly(text: str, max_chars: int = 3000) -> list[str]:
    """Split text into chunks that fit Polly's character limit."""
    
def synthesize_speech(polly_client, text: str, is_ssml: bool) -> bytes:
    """Call Polly API to generate audio bytes."""
    
def concatenate_audio(segments: list[bytes]) -> bytes:
    """Combine multiple audio segments into one."""
    
def save_audio(audio_bytes: bytes, output_path: str):
    """Write audio bytes to MP3 file."""
```

**AWS Polly Configuration:**
- Voice: `Matthew` (neural, en-US)
- Engine: `neural`
- Output Format: `mp3`
- Text Type: `ssml` (when SSML detected)

**Character Limit Handling:**
- Polly limit: 3000 characters per request
- Strategy: Split at section markers, synthesize separately, concatenate

## Data Models

### Script Content Structure

```
INTRO (~60 words, ~25 seconds)
├── Hook: "The skill swap is the excuse. Human connection is the product."
├── Problem: Urban loneliness, strangers with skills
└── Triple-solve: Verification + Safety + Loneliness

KIRO_USAGE (~80 words, ~32 seconds)
├── 5 feature specs with requirements, design, tasks
├── 7 steering documents (product, tech, structure, testing, etc.)
├── 13 custom prompts available through chat interface
├── 45 correctness properties tested with fast-check
└── Property-based testing for formal verification

SETUP (~40 words, ~16 seconds)
├── npm install && npm run dev
├── Client: localhost:5173
└── Server: localhost:3001

FRONT_PAGE (~50 words, ~20 seconds)
├── Hero section with value proposition
├── How it works steps
└── Call to action

AUTH (~30 words, ~12 seconds)
├── Register with email
└── Login flow

APP_FLOW (~150 words, ~60 seconds)
├── Profile: Add skills you offer and need
├── Discover: See matches within 2 miles
├── Match: Express interest, wait for mutual
├── Meet: Schedule coffee meeting
└── Confirm: Both verify meeting happened

OUTRO (~40 words, ~16 seconds)
├── Incognito mode for two-user testing
├── Demo users auto-respond for single-user testing
└── Thank you / closing
```

**Total: ~450 words, ~3 minutes**

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Script Timing Within Range

*For any* valid voice script, the word count SHALL be between 400 and 500 words to ensure approximately 3-minute narration at natural speaking pace.

**Validates: Requirements 2.8**

---

**Note:** Most acceptance criteria for this spec are testable as specific examples rather than universal properties. The demo video assets are one-time artifacts, not a system with variable inputs. The following are verified through example-based tests:

- File existence checks (1.1-1.4)
- Content presence checks (2.2-2.7, 2.9)
- Code structure checks (3.1-3.6)
- Section ordering checks (4.1-4.3)

## Error Handling

### Audio Generator Errors

| Error | Handling |
|-------|----------|
| Missing AWS credentials | Print clear error message with setup instructions |
| Script file not found | Exit with error pointing to expected path |
| Polly API error | Retry once, then exit with error details |
| Character limit exceeded | Auto-split at section markers |
| Invalid SSML | Fall back to plain text synthesis |

### Script Validation

| Issue | Handling |
|-------|----------|
| Missing section markers | Warning, continue with best-effort splitting |
| Word count too low (<350) | Warning about short duration |
| Word count too high (>550) | Warning about exceeding 3 minutes |

## Testing Strategy

**Dual Testing Approach:**
- Property tests: Script timing validation
- Example tests: Content and structure verification

**Property-Based Testing:**
- Library: fast-check (consistent with project)
- Property 1 validates word count range

**Example Tests:**
- Verify `video/` folder structure
- Verify script contains required content (value prop, triple-solve, Kiro stats)
- Verify generator uses correct Polly configuration
- Verify section markers present and ordered

**Test Configuration:**
- Minimum 100 iterations for property tests
- Tag format: **Feature: demo-video, Property 1: Script Timing Within Range**
