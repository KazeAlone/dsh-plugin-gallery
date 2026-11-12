import { createResourceIdentifier } from "./resource-id.mjs";
import { ResourceBasics } from "./resource-basics.jsx";
import { ResourceCoverPicker, withResourceCover } from "./resource-cover.jsx";
import React, { useState, useRef, useEffect } from "react";
import { Modal } from "./modal.jsx";
import { Glyph } from "./icons.jsx";
import {
  SKILL_TEMPLATE,
  skillDocument,
  skillIssues,
  readSkill,
  syncSkillAttachments,
} from "./skill-format.mjs";
const steps = ["基本信息", "编写指引", "检查保存"];
const folders = [
  ["references", "参考资料", "执行时需要查阅的文档", "file"],
  ["scripts", "辅助脚本", "执行任务需要运行的代码", "settings"],
  ["assets", "素材模板", "模板、图片及其他素材", "folder"],
];
function Preview({ text }) {
  return (
    <div className="gal-skill-preview">
      {text.split("\n").map((line, i) => {
        if (/^### /.test(line)) return <h4 key={i}>{line.slice(4)}</h4>;
        if (/^## /.test(line)) return <h3 key={i}>{line.slice(3)}</h3>;
        if (/^# /.test(line)) return <h2 key={i}>{line.slice(2)}</h2>;
        return <p key={i}>{line || "\u00a0"}</p>;
      })}
    </div>
  );
}
export function SkillWizard({ resource, importedResource, onClose, onSave }) {
  const draft = resource || importedResource;
  const [cover, setCover] = useState(draft?.metadata?.cover ?? "");
  const [initial] = useState(() => readSkill(draft));
  const [step, setStep] = useState(0),
    [name, setName] = useState(() => initial.name || createResourceIdentifier("skill")),
    [displayName, setDisplayName] = useState(draft?.name || ""),
    [description, setDescription] = useState(initial.description),
    [body, setBody] = useState(initial.body),
    [files, setFiles] = useState(initial.files),
    [tags, setTags] = useState((draft?.tags || []).join(", ")),
    [active, setActive] = useState(-1),
    [preview, setPreview] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const linkedBody = syncSkillAttachments(body, files);
  const document = skillDocument(
    name,
    description,
    linkedBody,
    initial.frontmatter,
  );
  useEffect(() => {
    setBody((value) => syncSkillAttachments(value, files));
  }, [files]);
  const parsedTags = [
    ...new Set(
      tags
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
  const issues = [
    ...(parsedTags.length > 20 ? ["最多添加 20 个标签。"] : []),
    ...(parsedTags.some((tag) => tag.length > 40)
      ? ["每个标签最多 40 个字符。"]
      : []),
    ...(!displayName.trim() || displayName.length > 160 ? ["请填写名称，最多 160 字符。"] : []),
    ...(initial.error ? [initial.error] : []),
    ...skillIssues(name, description, linkedBody, files),
  ];
  const basicValid =
    !!displayName.trim() && displayName.length <= 160 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) &&
    name.length <= 64 &&
    !!description.trim() &&
    description.length <= 1024;
  const bodyValid = !!body.trim() && body !== SKILL_TEMPLATE;
  function go(next) {
    setError("");
    setStep(next);
  }
  async function upload(folder, list) {
    setBusy(true);
    setError("");
    try {
      const incoming = [];
      if (files.length + list.length > 99)
        throw new Error("最多添加 99 个附属文件。");
      if ([...list].reduce((sum, f) => sum + f.size, 0) > 5 * 1024 * 1024)
        throw new Error("上传文件总大小不能超过 5 MiB。");
      for (const file of list) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let content, encoding;
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
          if (content.includes("\0")) throw new Error();
          encoding = "utf8";
        } catch {
          let raw = "";
          for (const b of bytes) raw += String.fromCharCode(b);
          content = btoa(raw);
          encoding = "base64";
        }
        incoming.push({ path: `${folder}/${file.name}`, encoding, content });
      }
      const merged = [...files, ...incoming];
      const errors = skillIssues(name, description, body, merged).filter(
        (e) => !e.startsWith("引用的文件"),
      );
      if (errors.length) throw new Error(errors.join("\n"));
      setFiles(merged);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function newFile(folder) {
    let n = 1,
      path;
    do {
      path = `${folder}/untitled-${n++}.${folder === "scripts" ? "py" : "md"}`;
    } while (files.some((f) => f.path === path));
    setFiles([...files, { path, encoding: "utf8", content: "" }]);
    setActive(files.length);
  }
  async function save() {
    if (issues.length) return;
    setBusy(true);
    setError("");
    try {
      await onSave({
        type: "skill",
        name: displayName.trim(),
        description: description.trim(),
        tags: parsedTags,
        metadata: withResourceCover(draft?.metadata, cover),
        references: resource?.references || [],
        files: [
          { path: "SKILL.md", encoding: "utf8", content: document },
          ...files,
        ],
      });
    } catch (e) {
      setError(e?.rpcError?.message || e.message || String(e));
      setBusy(false);
    }
  }
  const current = files[active];
  return (
    <Modal onClose={() => !busy && onClose()}>
      <section
        className="gal-dialog gal-skill-wizard"
        role="dialog"
        aria-modal="true"
        aria-label={resource ? "编辑 Skill" : "新建 Skill"}
        tabIndex={-1}
      >
        <header className="gal-dialog-head">
          <h2>
            <Glyph name="skill" /> {resource ? "编辑 Skill" : "新建 Skill"}
          </h2>
          <button aria-label="关闭编辑" disabled={busy} onClick={onClose}>
            <Glyph name="close" />
          </button>
        </header>
        <nav className="gal-skill-steps gal-three-steps" aria-label="创建进度">
          {steps.map((title, i) => (
            <button
              key={title}
              disabled={busy || (i > 0 && !basicValid) || (i > 1 && !bodyValid)}
              aria-current={step === i ? "step" : undefined}
              onClick={() => go(i)}
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
            {step === 0 && <ResourceBasics name={displayName} onName={setDisplayName} description={description} onDescription={setDescription} identifier={name} onIdentifier={setName} busy={busy} />}
            {step === 1 && (
              <div className="gal-skill-fields">
                <p>
                  写清适用场景、执行步骤和交付结果，可以附上输入与输出示例。
                </p>
                <button
                  aria-pressed={preview}
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? "继续编辑" : "预览正文"}
                </button>
                {preview ? (
                  <Preview text={body} />
                ) : (
                  <label>
                    执行指引
                    <textarea
                      aria-label="执行指引"
                      className="gal-skill-code"
                      rows={15}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </label>
                )}
                <details className="gal-skill-fields">
                  <summary>附属文件与选项 · {files.length} 个附件</summary>
                  <div className="gal-skill-folders">
                    {folders.map(([folder, title, hint, icon]) => (
                      <section
                        key={folder}
                        className="gal-skill-folder"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!busy) upload(folder, e.dataTransfer.files);
                        }}
                      >
                        <Glyph name={icon} size={28} />
                        <h3>{title}</h3>
                        <code>{folder}/</code>
                        <p>{hint}</p>
                        <label className="gal-upload">
                          上传或拖入
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
                          disabled={busy || files.length >= 99}
                          onClick={() => newFile(folder)}
                        >
                          新建文件
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
                    {files.length > 0 && (
                      <div className="gal-skill-filelist">
                        {files.map((f, i) => (
                          <div key={i}>
                            <button
                              onClick={() => setActive(i)}
                              aria-pressed={active === i}
                            >
                              <Glyph name="file" />
                              {f.path}
                            </button>
                            <button
                              aria-label={`删除 ${f.path}`}
                              disabled={busy}
                              onClick={() => {
                                setFiles(files.filter((_, j) => i !== j));
                                setActive(-1);
                              }}
                            >
                              <Glyph name="close" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {current && (
                      <fieldset disabled={busy} className="gal-skill-fields">
                        <label>
                          文件路径
                          <input
                            value={current.path}
                            onChange={(e) =>
                              setFiles(
                                files.map((f, i) =>
                                  i === active
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
                                    i === active
                                      ? { ...f, content: e.target.value }
                                      : f,
                                  ),
                                )
                              }
                            />
                          </label>
                        ) : (
                          <p>二进制附件将原样保存。</p>
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
                  <Glyph name="skill" size={36} />
                  <h2>{name}</h2>
                  <p>{description}</p>
                  <span>{files.length + 1} 个文件 · 整体保存</span>
                </div>
                <ResourceCoverPicker
                  resource={{
                    type: "skill",
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
                    placeholder="例如：开发，代码审查"
                  />
                </label>
                <p>用逗号分隔，最多 20 个标签。</p>
                {!!parsedTags.length && (
                  <div className="gal-tags">
                    {parsedTags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
                {issues.length ? (
                  <div role="alert" className="gal-error">
                    {issues.map((x) => (
                      <p key={x}>{x}</p>
                    ))}
                  </div>
                ) : (
                  <p className="gal-skill-ok">✓ 格式检查通过，可以保存</p>
                )}
                <details>
                  <summary>查看 SKILL.md</summary>
                  <pre className="gal-skill-preview">{document}</pre>
                </details>
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
              <Glyph name="folder" /> {name || "my-skill"}/
            </strong>
            <div>
              <Glyph name="file" /> SKILL.md
            </div>
            {folders.map(
              ([folder]) =>
                files.some((f) => f.path.startsWith(folder + "/")) && (
                  <div key={folder}>
                    <strong>
                      <Glyph name="folder" /> {folder}/
                    </strong>
                    {files
                      .filter((f) => f.path.startsWith(folder + "/"))
                      .map((f, i) => (
                        <div className="gal-skill-leaf" key={i}>
                          <Glyph name="file" />
                          {f.path.slice(folder.length + 1)}
                        </div>
                      ))}
                  </div>
                ),
            )}
          </details>
        </div>
        <footer className="gal-skill-footer">
          <button disabled={busy} onClick={step ? () => go(step - 1) : onClose}>
            {step ? "上一步" : "取消"}
          </button>
          {step < 2 ? (
            <button
              className="gal-primary"
              disabled={
                busy ||
                (step === 0 && !basicValid) ||
                (step === 1 && !bodyValid)
              }
              onClick={() => go(step + 1)}
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
              {busy ? "保存中…" : "保存 Skill"}
            </button>
          )}
        </footer>
      </section>
    </Modal>
  );
}
