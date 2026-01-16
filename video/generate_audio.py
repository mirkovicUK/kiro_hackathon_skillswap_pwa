#!/usr/bin/env python3
"""
Audio Generator for SkillSwap Demo Video
Uses AWS Polly to convert demo_script.txt to demo_audio.mp3
"""

import boto3
import os
import sys



# ============================================
# CONFIGURATION: Change voice here
# ============================================
VOICE_ID = 'Kendra'  # Change this to your preferred voice

# Available voices:
# Standard + Neural: Matthew, Joanna, Joey, Kendra, Kimberly, Salli
# Neural only: Ruth, Stephen (may have SSML issues)
# Standard only: Ivy, Justin
# ============================================


def read_script(path):
    """
    Read and validate the voice script.
    
    Args:
        path: Path to the script file
        
    Returns:
        str: Script content
        
    Raises:
        FileNotFoundError: If script file doesn't exist
        IOError: If script file cannot be read
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Script file not found: {path}")
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if not content.strip():
            raise ValueError("Script file is empty")
        
        return content
    except IOError as e:
        raise IOError(f"Failed to read script file: {e}")


def split_for_polly(text, max_chars=3000):
    """
    Split text into chunks that fit Polly's character limit.
    Splits at section markers to maintain coherent segments.
    Removes section markers and ensures single <speak> root per segment.
    
    Args:
        text: Full script text
        max_chars: Maximum characters per chunk (default: 3000)
        
    Returns:
        list[str]: List of text segments (each with single <speak> root)
    """
    import re
    
    # Remove section markers - they're for organization, not for Polly
    section_pattern = r'\[SECTION: [^\]]+\]\n?'
    text_without_markers = re.sub(section_pattern, '', text)
    
    # Extract all content between <speak> tags
    speak_pattern = r'<speak>(.*?)</speak>'
    speak_contents = re.findall(speak_pattern, text_without_markers, re.DOTALL)
    
    # Combine all content
    combined_content = '\n'.join(speak_contents)
    
    # If combined content fits in one segment, return it
    full_ssml = f'<speak>{combined_content}</speak>'
    if len(full_ssml) <= max_chars:
        return [full_ssml]
    
    # Need to split - do it at prosody boundaries
    prosody_blocks = re.split(r'(</prosody>)', combined_content)
    
    segments = []
    current_content = ""
    
    for i in range(0, len(prosody_blocks), 2):
        if i >= len(prosody_blocks):
            break
            
        block = prosody_blocks[i]
        closing_tag = prosody_blocks[i + 1] if i + 1 < len(prosody_blocks) else ""
        full_block = block + closing_tag
        
        if not full_block.strip():
            continue
        
        # Check if adding this block would exceed limit (accounting for <speak> wrapper)
        test_segment = f'<speak>{current_content}{full_block}</speak>'
        if current_content and len(test_segment) > max_chars:
            # Save current segment
            segments.append(f'<speak>{current_content}</speak>')
            current_content = full_block
        else:
            current_content += full_block
    
    # Add final segment
    if current_content.strip():
        segments.append(f'<speak>{current_content}</speak>')
    
    return segments if segments else [full_ssml]


def synthesize_speech(polly_client, text, is_ssml):
    """
    Call Polly API to generate audio bytes.
    
    Args:
        polly_client: boto3 Polly client instance
        text: Text or SSML to synthesize
        is_ssml: True if text contains SSML markup, False for plain text
        
    Returns:
        bytes: MP3 audio data
        
    Raises:
        Exception: If Polly API call fails
    """
    try:
        # Determine text type based on SSML flag
        text_type = 'ssml' if is_ssml else 'text'
        
        # Try neural engine first (better quality but limited SSML support)
        try:
            response = polly_client.synthesize_speech(
                Engine='neural',
                LanguageCode='en-US',
                OutputFormat='mp3',
                Text=text,
                TextType=text_type,
                VoiceId=VOICE_ID
            )
        except Exception as neural_error:
            # If neural fails, try standard engine
            error_msg = str(neural_error)
            if 'Unsupported' in error_msg or 'Neural' in error_msg or 'does not support' in error_msg:
                response = polly_client.synthesize_speech(
                    Engine='standard',
                    LanguageCode='en-US',
                    OutputFormat='mp3',
                    Text=text,
                    TextType=text_type,
                    VoiceId=VOICE_ID
                )
            else:
                raise neural_error
        
        # Extract audio stream from response
        if 'AudioStream' in response:
            audio_bytes = response['AudioStream'].read()
            return audio_bytes
        else:
            raise Exception("No audio stream in Polly response")
            
    except Exception as e:
        raise Exception(f"Polly synthesis failed: {e}")


def concatenate_audio(segments):
    """
    Combine multiple MP3 segments into one.
    
    Args:
        segments: list[bytes] - List of MP3 audio byte segments
        
    Returns:
        bytes: Combined MP3 audio data
    """
    # For MP3 files, simple concatenation works because MP3 is a stream format
    # Each frame is independent, so we can just join the byte streams
    return b''.join(segments)


def main():
    """Generate audio from demo_script.txt using AWS Polly."""
    print("SkillSwap Demo Audio Generator")
    print("=" * 50)
    
    # Define paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(script_dir, 'demo_script.txt')
    output_path = os.path.join(script_dir, 'demo_audio.mp3')
    
    try:
        # Step 1: Read script
        print(f"\n1. Reading script from {script_path}...")
        script_content = read_script(script_path)
        print(f"   ✓ Script loaded ({len(script_content)} characters)")
        
        # Step 2: Check if script contains SSML
        is_ssml = '<speak>' in script_content
        print(f"   ✓ SSML detected: {is_ssml}")
        
        # Step 3: Split script if needed
        print("\n2. Splitting script for Polly...")
        segments = split_for_polly(script_content, max_chars=3000)
        print(f"   ✓ Split into {len(segments)} segment(s)")
        
        
        # Step 4: Initialize Polly client
        print("\n3. Connecting to AWS Polly...")
        try:
            polly_client = boto3.client('polly')
            print("   ✓ Connected to AWS Polly")
        except Exception as e:
            print(f"   ✗ Failed to connect to AWS Polly")
            print(f"\nError: {e}")
            print("\nPlease ensure:")
            print("  1. AWS CLI is installed")
            print("  2. AWS credentials are configured (aws configure)")
            print("  3. Your AWS account has Polly access")
            sys.exit(1)
        
        # Step 5: Synthesize each segment
        print("\n4. Synthesizing speech...")
        audio_segments = []
        for i, segment in enumerate(segments, 1):
            print(f"   Segment {i}/{len(segments)}...", end=' ')
            try:
                audio_bytes = synthesize_speech(polly_client, segment, is_ssml)
                audio_segments.append(audio_bytes)
                print(f"✓ ({len(audio_bytes)} bytes)")
            except Exception as e:
                print(f"✗ Failed")
                print(f"\nError synthesizing segment {i}: {e}")
                sys.exit(1)
        
        # Step 6: Concatenate segments
        print("\n5. Concatenating audio segments...")
        final_audio = concatenate_audio(audio_segments)
        print(f"   ✓ Combined audio ({len(final_audio)} bytes)")
        
        # Step 7: Save to file
        print(f"\n6. Saving to {output_path}...")
        with open(output_path, 'wb') as f:
            f.write(final_audio)
        print(f"   ✓ Audio saved successfully")
        
        print("\n" + "=" * 50)
        print("✓ Demo audio generation complete!")
        print(f"Output: {output_path}")
        
    except FileNotFoundError as e:
        print(f"\n✗ Error: {e}")
        print("\nPlease ensure demo_script.txt exists in the video/ directory")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
