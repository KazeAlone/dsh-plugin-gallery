import test from 'node:test';
import assert from 'node:assert/strict';
import {agentDocument,readAgent,agentIssues,AGENT_TEMPLATE} from '../src/client/agent-format.mjs';
import {normalizeResource} from '../src/model.mjs';
test('Agent bundle keeps identity, instructions, config and attachments through editing',()=>{
 const values={slug:'research-agent',description:'Research',goal:'Find sources',boundaries:'Ask before editing',instructions:'## Steps\nSearch and cite.'};
 const content=agentDocument(values,{license:'MIT'});
 const resource=normalizeResource({type:'agent',name:'研究助手',description:values.description,metadata:{agent:{...values,model:'default'}},files:[{path:'AGENT.md',content},{path:'config.json',content:'{"model":"default"}'},{path:'references/source.md',content:'Source'}]});
 const draft=readAgent(resource);
 assert.equal(draft.slug,values.slug);assert.equal(draft.goal,values.goal);assert.equal(draft.instructions,values.instructions);assert.equal(draft.extra.license,'MIT');
 assert.deepEqual(agentIssues({...values,name:'研究助手',files:[resource.files[2]],config:{model:'default'},tags:[]}),[]);
 const updated=agentDocument({...values,description:'Updated'},draft.extra);
 assert.match(updated,/license: MIT/);
 assert.match(updated,/description: Updated/);
});
test('Agent validation rejects blank duties, invalid filenames and malformed frontmatter',()=>{
 const values={slug:'Bad Name',name:'',description:'',goal:'',instructions:AGENT_TEMPLATE,files:[{path:'assets/../bad',content:'',encoding:'utf8'}],config:{},tags:[]};
 assert.ok(agentIssues(values).length>=5);
 const old={name:'old',description:'old',files:[{path:'AGENT.md',content:'---\nname: [\n---\nBody'}]};
 assert.ok(readAgent(old).error);
});
