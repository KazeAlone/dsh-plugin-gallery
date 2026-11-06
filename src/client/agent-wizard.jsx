import { ResourceCoverPicker, withResourceCover } from "./resource-cover.jsx";
import React, { useEffect, useState, useRef } from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
import {
  AGENT_TEMPLATE,
  agentDocument,
  readAgent,
  agentIssues,
} from "./agent-format.mjs";
const steps = ["身份与职责", "行为指引与附件", "检查保存"];
export function AgentWizard({ resource, onClose, onSave }) {
  const [cover, setCover] = useState(resource?.metadata?.cover ?? "");
  const [initial] = useState(() => readAgent(resource));
  const [step, setStep] = useState(0),
    [slug, setSlug] = useState(initial.slug || `agent-${crypto.randomUUID().slice(0, 8)}`),
    [name, setName] = useState(resource?.name || ""),
    [description, setDescription] = useState(initial.description),
    [instructions, setInstructions] = useState(() =>
      [
        initial.goal && "## 任务目标\n" + initial.goal,
        initial.boundaries && "## 处理边界\n" + initial.boundaries,
        initial.instructions,
      ]
        .filter(Boolean)
        .join("\n\n"),
    ),
    [tags, setTags] = useState((resource?.tags || []).join(", ")),
    [files, setFiles] = useState(
      (resource?.files || []).filter(
        (f) => !["AGENT.md", "config.json"].includes(f.path),
      ),
    ),
    [selected, setSelected] = useState(-1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const parsedTags = [
    ...new Set(
      tags
        .split(/[,，]/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  const goal = "",
    boundaries = "";
  const config = { ...(resource?.metadata?.agent?.config || {}) };
  delete config.model;
  const hasConfig = Object.keys(config).length > 0;
  const document = agentDocument(
    { slug, description, goal, boundaries, instructions },
    initial.extra,
  );
  const issues = agentIssues({
    slug,
    name,
    description,
    goal,
    instructions,
    files,
    config,
    tags: parsedTags,
    error: initial.error,
  });
  const identityOK =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length <= 64 &&
    !!name.trim() &&
    !!description.trim();
  const dutiesOK = !!instructions.trim() && instructions !== AGENT_TEMPLATE;
  async function upload(folder, list) {
    setBusy(true);
    setError("");
    try {
      const incoming = [];
      for (const file of list) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let content, encoding;
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          if (content.includes("\0")) throw Error();
          encoding = "utf8";
        } catch {
          let raw = "";
          for (const b of bytes) raw += String.fromCharCode(b);
          content = btoa(raw);
          encoding = "base64";
        }
        incoming.push({ path: `${folder}/${file.name}`, encoding, content });
      }
      const next = [...files, ...incoming];
      const problem = agentIssues({
        slug,
        name,
        description,
        goal,
        instructions,
        files: next,
        config,
        tags: parsedTags,
      }).find((x) => /文件|路径/.test(x));
      if (problem) throw Error(problem);
      setFiles(next);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (issues.length) return;
    setBusy(true);
    setError("");
    try {
      await onSave({
        type: "agent",
        name: name.trim(),
        description: description.trim(),
        tags: parsedTags,
        metadata: {
          ...withResourceCover(resource?.metadata, cover),
          agent: {
            ...(resource?.metadata?.agent || {}),
            slug: slug.trim(),
            goal,
            boundaries,
            instructions,
            model: "",
            config,
          },
        },
        references: resource?.references || [],
        files: [
          { path: "AGENT.md", encoding: "utf8", content: document },
          ...(hasConfig
            ? [
                {
                  path: "config.json",
                  encoding: "utf8",
                  content: JSON.stringify(config, null, 2) + "\n",
                },
              ]
            : []),
          ...files,
        ],
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  const current = files[selected];
  return (
    <Modal onClose={() => !busy && onClose()}>
      <section
        className="gal-dialog gal-skill-wizard gal-agent-wizard"
        role="dialog"
        aria-modal="true"
        aria-label={resource ? "编辑 Agent" : "新建 Agent"}
        tabIndex={-1}
      >
        <header className="gal-dialog-head">
          <h2>
            <Glyph name="agent" /> {resource ? "编辑 Agent" : "新建 Agent"}
          </h2>
          <button aria-label="关闭编辑" disabled={busy} onClick={onClose}>
            <Glyph name="close" />
          </button>
        </header>
        <nav className="gal-skill-steps gal-three-steps" aria-label="创建进度">
          {steps.map((title, i) => (
            <button
              key={title}
              aria-current={step === i ? "step" : undefined}
              disabled={busy || (i > 0 && !identityOK) || (i > 1 && !dutiesOK)}
              onClick={() => setStep(i)}
            >
              <span>{i < step ? "✓" : i + 1}</span>
              {title}
            </button>
          ))}
        </nav>
        <div className="gal-dialog-body gal-skill-layout">
          <main>
            <h3 ref={heading} tabIndex={-1}>
              {steps[step]}
            </h3>
            {step === 0 && (
              <div className="gal-skill-fields">
                <label>
                  名称
                  <input
                    aria-label="名称"
                    value={name}
                    maxLength={160}
                    placeholder="研究助手"
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  描述
                  <textarea
                    aria-label="描述"
                    rows={3}
                    maxLength={1024}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="说明这个 Agent 负责什么。"
                  />
                </label>
                <details><summary>高级设置</summary>                <label>
                  调用标识
                  <input
                    aria-label="调用标识"
                    value={slug}
                    maxLength={64}
                    placeholder="research-agent"
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </label>
                <p>作为 Agent 文件夹名称，使用小写英文、数字和连字符。</p>
</details>
              </div>
            )}
            {step === 1 && (
              <div className="gal-skill-fields">
                <p>写清职责、处理边界、何时回报和交付格式。</p>
                <button
                  aria-pressed={preview}
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? "继续编辑" : "预览指引"}
                </button>
                {preview ? (
                  <pre className="gal-skill-preview">{document}</pre>
                ) : (
                  <label>
                    行为指引
                    <textarea
                      aria-label="行为指引"
                      className="gal-skill-code"
                      rows={10}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    />
                  </label>
                )}
                <details className="gal-skill-fields">
                  <summary>附属文件与选项 · {files.length} 个附件</summary>
                  <div className="gal-skill-folders">
                    {[
                      ["references", "参考资料"],
                      ["assets", "素材模板"],
                    ].map(([folder, title]) => (
                      <section
                        className="gal-skill-folder"
                        key={folder}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          upload(folder, e.dataTransfer.files);
                        }}
                      >
                        <Glyph name="folder" size={28} />
                        <h3>{title}</h3>
                        <code>{folder}/</code>
                        <label className="gal-upload">
                          上传文件
                          <input
                            aria-label={`上传${title}`}
                            type="file"
                            multiple
                            disabled={busy}
                            onChange={(e) => {
                              upload(folder, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          disabled={busy || files.length >= 98}
                          onClick={() => {
                            let n = 1,
                              path;
                            do {
                              path = `${folder}/untitled-${n++}.md`;
                            } while (files.some((f) => f.path === path));
                            setFiles([
                              ...files,
                              { path, encoding: "utf8", content: "" },
                            ]);
                            setSelected(files.length);
                          }}
                        >
                          新建文本
                        </button>
                        <span>
                          {
                            files.filter((f) => f.path.startsWith(folder + "/"))
                              .length
                          }{" "}
                          个文件
                        </span>
                      </section>
                    ))}
                  </div>
                  <div className="gal-skill-attachments">
                    <div className="gal-skill-filelist">
                      {files.map((f, i) => (
                        <div key={i}>
                          <button
                            onClick={() => setSelected(i)}
                            aria-pressed={selected === i}
                          >
                            <Glyph name="file" />
                            {f.path}
                          </button>
                          <button
                            aria-label={`删除 ${f.path}`}
                            onClick={() => {
                              setFiles(files.filter((_, j) => j !== i));
                              setSelected(-1);
                            }}
                          >
                            <Glyph name="close" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {current && (
                      <fieldset className="gal-skill-fields">
                        <label>
                          文件路径
                          <input
                            aria-label="文件路径"
                            value={current.path}
                            onChange={(e) =>
                              setFiles(
                                files.map((f, i) =>
                                  i === selected
                                    ? { ...f, path: e.target.value }
                                    : f,
                                ),
                              )
                            }
                          />
                        </label>
                        {current.encoding === "utf8" ? (
                          <label>
                            文件内容
                            <textarea
                              aria-label="文件内容"
                              rows={8}
                              value={current.content}
                              onChange={(e) =>
                                setFiles(
                                  files.map((f, i) =>
                                    i === selected
                                      ? { ...f, content: e.target.value }
                                      : f,
                                  ),
                                )
                              }
                            />
                          </label>
                        ) : (
                          <p>二进制附件随资源保存。</p>
                        )}
                      </fieldset>
                    )}
                  </div>
                </details>
              </div>
            )}
            {step === 2 && (
              <div className="gal-skill-fields">
                <div className="gal-skill-summary">
                  <Glyph name="agent" size={36} />
                  <h2>{name}</h2>
                  <p>{description}</p>
                  <span>
                    {files.length + 1 + (hasConfig ? 1 : 0)} 个文件 · 整体保存
                  </span>
                </div>
                <ResourceCoverPicker
                  resource={{
                    type: "agent",
                    name,
                    description,
                    tags: tags.split(/[,，]/),
                    cover,
                  }}
                  onChange={setCover}
                />
                <label>
                  标签（选填）
                  <input
                    aria-label="标签"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="例如：研究，分析"
                  />
                </label>
                {issues.length ? (
                  <div className="gal-error" role="alert">
                    {issues.map((x) => (
                      <p key={x}>{x}</p>
                    ))}
                  </div>
                ) : (
                  <p className="gal-skill-ok">✓ 格式检查通过，可以保存</p>
                )}
                <details>
                  <summary>查看 AGENT.md</summary>
                  <pre className="gal-skill-preview">{document}</pre>
                </details>
                {hasConfig && (
                  <details>
                    <summary>查看 config.json</summary>
                    <pre className="gal-skill-preview">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            {error && (
              <p role="alert" className="gal-error">
                {error}
              </p>
            )}
          </main>
          <details open className="gal-skill-tree">
            <summary>文件结构</summary>
            <strong>
              <Glyph name="folder" /> {slug || "my-agent"}/
            </strong>
            <div>
              <Glyph name="file" /> AGENT.md
            </div>
            {hasConfig && (
              <div>
                <Glyph name="file" /> config.json
              </div>
            )}
            {files.map((f, i) => (
              <div key={i}>
                <Glyph name="file" /> {f.path}
              </div>
            ))}
          </details>
        </div>
        <footer className="gal-skill-footer">
          <button
            disabled={busy}
            onClick={step ? () => setStep(step - 1) : onClose}
          >
            {step ? "上一步" : "取消"}
          </button>
          {step < 2 ? (
            <button
              className="gal-primary"
              disabled={
                busy || (step === 0 && !identityOK) || (step === 1 && !dutiesOK)
              }
              onClick={() => setStep(step + 1)}
            >
              下一步
              <Glyph name="arrow" />
            </button>
          ) : (
            <button
              className="gal-primary"
              disabled={busy || !!issues.length}
              onClick={save}
            >
              {busy ? "保存中…" : "保存 Agent"}
            </button>
          )}
        </footer>
      </section>
    </Modal>
  );
}
