import test from "node:test";
import assert from "node:assert/strict";
import {
  parseWorkflowAgent,
  extractWorkflowAgent,
} from "../src/workflow-extraction.mjs";
const fields = {
  name: "researcher",
  summary: "整理资料",
  role: "研究与证据核对",
  executionPrompt: "先读取资料，标注不确定性",
};
test("Agent extraction validates TeamFlow fields and uses the host default model without a session", async () => {
  let request;
  const llm = {
    async *stream(options) {
      request = options;
      yield { type: "text-delta", text: JSON.stringify(fields) };
    },
  };
  const services = {
    llm,
    agentDefaultModel: {
      currentSelection: () => ({ provider: "host-provider", model: "host-model", reasoningEffort: "high" }),
    },
  };
  const result = await extractWorkflowAgent(
    { get: (name) => services[name] },
    {
      type: "agent",
      name: "研究助手",
      description: "研究",
      files: [{ path: "AGENT.md", encoding: "utf8", content: "# 研究职责" }],
    },
  );
  assert.deepEqual(result, fields);
  assert.equal(
    Object.hasOwn(
      parseWorkflowAgent(
        JSON.stringify({ ...fields, specificPrompt: "临时指令" }),
      ),
      "specificPrompt",
    ),
    false,
  );
  assert.equal(request.provider, "host-provider");
  assert.equal(request.model, "host-model");
  assert.equal(request.reasoningEffort, "high");
  assert.equal(request.tools, undefined);
  assert.equal(request.messages.length, 1);
  assert.throws(
    () => parseWorkflowAgent(JSON.stringify({ ...fields, name: "bad name" })),
    /名称/,
  );
  await assert.rejects(
    () => extractWorkflowAgent({ get: () => undefined }, {}),
    /默认模型/,
  );
});
