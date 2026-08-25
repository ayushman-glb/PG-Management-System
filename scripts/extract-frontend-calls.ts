import * as fs from 'fs';
import * as path from 'path';

const frontendServicesDir = path.join(__dirname, '..', 'frontend', 'src', 'services');

interface FrontendCall {
  file: string;
  functionName: string;
  method: string;
  endpointTemplate: string;
  line: number;
  rawCall: string;
}

const frontendCalls: FrontendCall[] = [];

const files = fs.readdirSync(frontendServicesDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(frontendServicesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let currentFunction = 'anonymous';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track current method or function
    const fnMatch = line.match(/(?:async\s+)?([a-zA-Z0-9_$]+)\s*(?:=\s*(?:async\s*)?\([^)]*\)\s*=>|\([^)]*\)\s*(?::\s*[^{]+)?\s*\{)/);
    if (fnMatch && !line.includes('if ') && !line.includes('switch ') && !line.includes('for ') && !line.includes('catch ')) {
      currentFunction = fnMatch[1];
    }

    // Match api.get, api.post, api.put, api.patch, api.delete, api.request
    const apiMatch = line.match(/api\.(get|post|put|patch|delete|request)\s*(?:<[^>]*>)?\s*\(\s*([`'"][^`'"]+[`'"])/);
    if (apiMatch) {
      let method = apiMatch[1].toUpperCase();
      let rawEndpoint = apiMatch[2].slice(1, -1); // remove quotes

      if (method === 'REQUEST') {
        // check if method is specified later on the line or nearby
        const methodMatch = line.match(/method:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/i);
        method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
      }

      frontendCalls.push({
        file,
        functionName: currentFunction,
        method,
        endpointTemplate: rawEndpoint,
        line: i + 1,
        rawCall: line.trim()
      });
    }
  }
}

console.log(`Extracted ${frontendCalls.length} frontend API calls.`);
fs.writeFileSync(path.join(__dirname, 'frontend-calls.json'), JSON.stringify(frontendCalls, null, 2));
