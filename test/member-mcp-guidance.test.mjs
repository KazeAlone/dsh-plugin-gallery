import test from 'node:test';
import assert from 'node:assert/strict';
import { memberMcpGuidance, registerMemberMcpGuidance } from '../src/member-mcp-guidance.mjs';

test('MCP guidance follows the member switch and only lists effective Gallery tools',()=>{
 let definition, disposed=false;
 const agent={ctx:{get:name=>name==='tools'?{schemas:scope=>{assert.equal(scope,agent);return [{name:'mcp__papers__search',description:'检索论文'},{name:'other_tool'}];}}:name==='systemPrompt'?{section:d=>{definition=d;return ()=>{disposed=true;};}}:undefined}};
 const store={adapter:()=>({read:()=>({resources:[{id:'papers',type:'mcp',name:'论文知识库',description:'研究资料',metadata:{mcp:{envRefs:{Authorization:'SECRET_NAME'}}}},{id:'hidden',type:'mcp',name:'隐藏服务',description:'不可见'}]})})};
 const runtime={resourceForTool:name=>name==='mcp__papers__search'?'papers':undefined};
 assert.equal(memberMcpGuidance(agent,store,runtime,false),'');
 let allowed=true;
 const off=registerMemberMcpGuidance(agent,store,()=>runtime,()=>allowed);
 assert.equal(definition.interpolate,false);
 assert.match(definition.text(),/优先检索/);
 assert.match(definition.text(),/论文知识库/);
 assert.doesNotMatch(definition.text(),/隐藏服务|SECRET_NAME|other_tool/);
 allowed=false;assert.equal(definition.text(),'');off();assert.equal(disposed,true);
});
