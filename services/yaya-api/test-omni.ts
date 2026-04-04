#!/usr/bin/env tsx

/**
 * Test script for vLLM-Omni integration
 * 
 * This script tests the basic functionality of the omni.ts module
 * to ensure the integration works correctly.
 * 
 * Usage: tsx test-omni.ts
 */

import { chatOmni, isOmniEnabled, convertOggToWav, convertWavToOpus } from './omni.js';

async function testOmniIntegration() {
  console.log('🚀 Testing vLLM-Omni Integration\n');

  // Test 1: Check if omni is enabled
  console.log('1. Checking if Omni is enabled...');
  const enabled = isOmniEnabled();
  console.log(`   Omni enabled: ${enabled}`);
  
  if (!enabled) {
    console.log('   ℹ️  To enable Omni, set OMNI_ENABLED=true in your environment');
    console.log('   ℹ️  Make sure vLLM-Omni server is running on OMNI_API_URL');
    return;
  }

  // Test 2: Test basic text-only chat
  console.log('\n2. Testing text-only chat...');
  try {
    const response = await chatOmni('test-user-123', 'Hola, ¿cómo estás?');
    console.log(`   ✅ Text response: ${response.text.substring(0, 100)}...`);
    console.log(`   Audio response: ${response.audioBase64 ? 'Yes' : 'No'}`);
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Test audio conversion functions (without actual audio)
  console.log('\n3. Testing audio conversion utilities...');
  console.log('   Note: This test requires ffmpeg to be installed');
  
  try {
    // Create a small test OGG buffer (header-like data)
    const testOggBuffer = Buffer.from([0x4F, 0x67, 0x67, 0x53, 0x00, 0x02]); // OggS header
    console.log('   Testing convertOggToWav...');
    // This will likely fail without actual OGG data, but tests the function structure
    await convertOggToWav(testOggBuffer);
    console.log('   ✅ convertOggToWav function works');
  } catch (error: any) {
    if (error.message.includes('FFmpeg')) {
      console.log('   ❌ FFmpeg not available or conversion failed (expected with test data)');
    } else {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }

  try {
    // Test WAV to Opus conversion with base64
    const testWavBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEA'; // Basic WAV header
    console.log('   Testing convertWavToOpus...');
    await convertWavToOpus(testWavBase64);
    console.log('   ✅ convertWavToOpus function works');
  } catch (error: any) {
    if (error.message.includes('FFmpeg')) {
      console.log('   ❌ FFmpeg not available or conversion failed (expected with test data)');
    } else {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }

  console.log('\n🎉 Omni integration test completed!');
  console.log('\nNext steps:');
  console.log('- Start vLLM-Omni server with Qwen3-Omni model');
  console.log('- Set OMNI_ENABLED=true in your environment');
  console.log('- Test with actual WhatsApp voice messages');
}

async function main() {
  try {
    await testOmniIntegration();
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}