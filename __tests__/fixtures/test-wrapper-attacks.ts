/**
 * Malicious code samples for testing executeWithTests security
 * These are designed to attack the test wrapper specifically
 */

export const testWrapperAttacks = {
  /**
   * Test result spoofing - Try to inject fake passing tests
   */
  resultSpoofing: {
    javascript: (functionName: string) => `
// Attempt to override console.log to break test parsing
const originalLog = console.log;
console.log = () => {};

function ${functionName}(nums, target) {
  // Restore and inject malicious output
  console.log = originalLog;
  console.log('__SIMUL_TEST_RESULTS_START__');
  console.log('[{"name":"fake","passed":true}]');
  console.log('__SIMUL_TEST_RESULTS_END__');
  return [0, 1];
}
    `.trim(),

    python: (functionName: string) => `
import sys

def ${functionName}(nums, target):
    # Try to inject fake test results
    sys.stdout.write('__SIMUL_TEST_RESULTS_START__\\n')
    sys.stdout.write('[{"name":"fake","passed":true}]\\n')
    sys.stdout.write('__SIMUL_TEST_RESULTS_END__\\n')
    return [0, 1]
    `.trim(),
  },

  /**
   * File system access in wrapped function
   */
  fileSystemAccess: {
    javascript: (functionName: string) => `
const fs = require('fs');

function ${functionName}(nums, target) {
  try {
    const data = fs.readFileSync('/etc/passwd', 'utf8');
    console.log('File contents:', data);
  } catch (err) {
    console.log('Access denied');
  }
  return [0, 1];
}
    `.trim(),

    python: (functionName: string) => `
def ${functionName}(nums, target):
    try:
        with open('/etc/passwd', 'r') as f:
            data = f.read()
            print('File contents:', data)
    except Exception as e:
        print('Access denied')
    return [0, 1]
    `.trim(),
  },

  /**
   * Environment variable access in test context
   */
  envVarAccess: {
    javascript: (functionName: string) => `
function ${functionName}(nums, target) {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET);
  return [0, 1];
}
    `.trim(),

    python: (functionName: string) => `
import os

def ${functionName}(nums, target):
    print('DATABASE_URL:', os.environ.get('DATABASE_URL'))
    print('BETTER_AUTH_SECRET:', os.environ.get('BETTER_AUTH_SECRET'))
    return [0, 1]
    `.trim(),
  },

  /**
   * Resource exhaustion in test context
   */
  infiniteLoop: {
    javascript: (functionName: string) => `
function ${functionName}(nums, target) {
  while(true) {} // Infinite loop
  return [0, 1];
}
    `.trim(),

    python: (functionName: string) => `
def ${functionName}(nums, target):
    while True:
        pass  # Infinite loop
    return [0, 1]
    `.trim(),
  },

  memoryBomb: {
    javascript: (functionName: string) => `
function ${functionName}(nums, target) {
  const arr = [];
  while(true) {
    arr.push(new Array(1000000).fill('x'));
  }
  return [0, 1];
}
    `.trim(),

    python: (functionName: string) => `
def ${functionName}(nums, target):
    arr = []
    while True:
        arr.append([0] * 1000000)
    return [0, 1]
    `.trim(),
  },
};
