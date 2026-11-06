import test from 'node:test';import assert from 'node:assert/strict';
import {validateMcpConfig,resolveMcpConfig} from '../src/mcp-config.mjs';
import {checkMcpConnection} from '../src/mcp-check.mjs';
test('MCP config accepts DSH transports and resolves only named host variables',()=>{
 const local={serverName:'files',transport:'stdio',command:'node',args:['server.mjs'],envRefs:{API_KEY:'HOST_API_KEY'}};
 assert.deepEqual(resolveMcpConfig(local,{HOST_API_KEY:'secret'}).env,{API_KEY:'secret'});
 assert.equal(JSON.stringify(validateMcpConfig(local)).includes('secret'),false);
 assert.equal(resolveMcpConfig({serverName:'remote',transport:'streamable-http',url:'https://example.com/mcp',envRefs:{Authorization:'HOST_AUTH'}},{HOST_AUTH:'Bearer abc'}).headers.Authorization,'Bearer abc');
 for(const input of [{...local,serverName:'bad name'},{...local,transport:'sse'},{...local,envRefs:{API_KEY:'raw-token-value!'}},{...local,command:''}])assert.throws(()=>validateMcpConfig(input));
 assert.throws(()=>resolveMcpConfig(local,{}),e=>e.code==='MISSING_ENV');
});
test('owner-initiated stdio connection test discovers tools and closes probe',async()=>{
 const result=await checkMcpConnection({serverName:'test',transport:'stdio',command:process.execPath,args:['test/mcp-fixture.mjs'],cwd:process.cwd()});
 assert.equal(result.connected,true);assert.ok(result.tools.some(tool=>tool.name==='ping'));
});

test('HTTP MCP accepts hyphenated header names while stdio env names stay strict',()=>{
 const c={serverName:'remote',transport:'streamable-http',url:'https://example.com/mcp',envRefs:{'X-API-Key':'HOST_KEY'}};
 assert.equal(resolveMcpConfig(c,{HOST_KEY:'value'}).headers['X-API-Key'],'value');
 assert.throws(()=>validateMcpConfig({...c,envRefs:{'Bad Header':'HOST_KEY'}}));
});
