import { randomUUID } from 'node:crypto';
import { agentDocument } from './client/agent-format.mjs';
import { installReferenceSkill } from './builtin-skill.mjs';
import { validateMcpConfig } from './mcp-config.mjs';
import { digest, normalizeResource } from './model.mjs';
import { validateWorkflowTemplate } from './workflow-template.mjs';

const author = 'ZelongWANG';
const file = (path, content) => ({ path, encoding: 'utf8', content });
const jsonFile = (path, value) => file(path, JSON.stringify(value, null, 2) + '\n');

const member = {
  name: 'note-reviewer',
  summary: '核对会议摘要与原文，标记遗漏及待确认项。',
  role: '负责会议纪要的事实核对和交付前审阅。',
  executionPrompt: '逐项比对原文、关键事实和待办。保留原有负责人和截止时间，缺失时注明。输出修订稿及待确认清单。',
};

function referenceAgent() {
  const agent = {
    slug: member.name,
    description: member.summary,
    goal: member.role,
    boundaries: '只处理用户提供的原文与草稿。缺少原文时先询问，禁止补写未经证实的事实。',
    instructions: `## 工作方式与回报时机
1. 列出原文中的结论、待办和待确认项。
2. 核对摘要，检查负责人、截止时间及遗漏。
3. 交付前对照 references/review-checklist.md 复核。

## 输出要求
按「修订稿」「改动说明」「待确认项」三部分输出。

## 示例
原文：小黄周五前提交初稿，评审时间待定。
输出：待办为小黄周五前提交初稿；待确认评审时间。`,
    model: '',
    config: {},
  };
  return {
    type: 'agent', name: '会议纪要审阅员 · Agent 示例', description: member.summary,
    tags: ['参考模板', '会议纪要', '审阅'], metadata: { cover: 'writing', agent },
    files: [
      file('AGENT.md', agentDocument(agent, { metadata: { author } })),
      file('references/review-checklist.md', '# 审阅清单\n\n- [ ] 摘要事实可在原文中定位。\n- [ ] 待办保留负责人和时间。\n- [ ] 未确认的信息单独列出。\n'),
    ],
  };
}

// The stdio sample uses only Node built-ins and can run from any workspace.
const pingServer = `const rl=require('node:readline').createInterface({input:process.stdin});
rl.on('line',line=>{
  let request;
  try{request=JSON.parse(line)}catch{return}
  const {id,method,params}=request;
  if(id===undefined)return;
  const tool={name:'ping',description:'Return pong',inputSchema:{type:'object',properties:{}}};
  let result;
  if(method==='initialize')result={protocolVersion:params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'gallery-reference-ping',version:'1.0.0'}};
  if(method==='ping')result={};
  if(method==='tools/list')result={tools:[tool]};
  if(method==='tools/call'&&params?.name===tool.name)result={content:[{type:'text',text:'pong'}]};
  const response=result?{result}:{error:{code:-32601,message:'Method not found'}};
  console.log(JSON.stringify({jsonrpc:'2.0',id,...response}));
});`;

export function referenceMcp() {
  const mcp = validateMcpConfig({
    serverName: 'gallery-reference-ping', transport: 'stdio',
    command: 'node', args: ['-e', pingServer], cwd: '', envRefs: {},
  });
  return {
    type: 'mcp', name: '本地 Ping · MCP 示例',
    description: '完整的 stdio 示例。测试连接会列出 ping 工具，调用后返回 pong。只需 Node.js。',
    tags: ['参考模板', 'stdio', '连接测试'], metadata: { mcp, mcpVerification: null },
    files: [
      jsonFile('mcp.json', mcp),
      file('README.md', '# 本地 Ping\n\n在连接配置中点击「测试连接」，应发现 ping 工具。该工具无需参数，返回 pong，不访问网络或读写文件。\n'),
    ],
  };
}

function referenceWorkflow(rows) {
  const find = (key) => rows.find((row) => row.metadata?.builtin === key);
  const agent = find('gallery-agent-reference-v1');
  const skill = find('gallery-skill-reference-v1');
  const mcp = find('gallery-mcp-reference-v1');
  const reference = (row) => row ? [{ id: row.id, name: row.name, digest: row.digest }] : [];
  const taskPositions = { t1: { x: 360, y: 100 }, t2: { x: 650, y: 100 } };
  const template = validateWorkflowTemplate({
    name: '会议纪要整理与人工验收 · Workflow 示例',
    description: '演示 Agent 整理纪要、人工检查，以及节点依赖和 Gallery 资源绑定。',
    tags: ['参考模板', '会议纪要', '人工验收'],
    inputs: '提供会议原文，可选提供输出语言、读者与篇幅。',
    members: [member],
    tasks: [
      { id: 't1', subject: '整理并核对纪要', assignee: member.name, dependencies: [], checkpoint: false,
        general: { requirements: '整理原文并逐项核对关键事实和待办。', deliverables: '纪要草稿与待确认清单。', acceptance: '待办保留原文中的负责人和截止时间。' } },
      { id: 't2', subject: '人工验收纪要', assignee: '', dependencies: ['t1'], checkpoint: true,
        general: { requirements: '对照会议原文检查纪要草稿，确认后方可交付。', deliverables: '验收意见或需修改的问题清单。', acceptance: '关键结论可追溯，待确认信息已标注。' } },
    ],
    positions: {},
  });
  return {
    type: 'workflow', name: template.name, description: template.description, tags: template.tags,
    metadata: {
      format: 'dsh-teamflow-template-v1',
      workflowCanvas: { version: 1, taskPositions, agents: [{
        id: 'agent-reference', label: agent?.name ?? member.name, memberName: member.name,
        resourceId: agent?.id ?? '', position: { x: 60, y: 100 },
        skills: reference(skill), mcps: reference(mcp),
      }] },
    },
    files: [jsonFile('workflow.json', template)],
  };
}

const examples = [
  ['gallery-agent-reference-v1', referenceAgent],
  ['gallery-mcp-reference-v1', referenceMcp],
  ['gallery-workflow-reference-v1', referenceWorkflow],
];

export function installReferenceExamples(adapter) {
  installReferenceSkill(adapter);
  const seeds = adapter.read().builtinSeeds;
  if (examples.every(([key]) => seeds?.includes(key))) return;
  adapter.write((rows, data) => {
    data.builtinSeeds ??= [];
    for (const [key, build] of examples) {
      if (data.builtinSeeds.includes(key)) continue;
      if (!rows.some(row => row.metadata?.builtin === key)) {
        const input = build(rows);
        const resource = normalizeResource({ ...input, metadata: { ...input.metadata, builtin: key } });
        const now = new Date().toISOString();
        rows.push({
          ...resource, id: randomUUID(), creator: { username: author },
          digest: digest(JSON.stringify(resource)), revision: 1, createdAt: now, updatedAt: now,
        });
      }
      data.builtinSeeds.push(key);
    }
    return rows.at(-1);
  });
}
