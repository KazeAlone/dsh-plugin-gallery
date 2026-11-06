/** Log host turn failures without copying conversation content or tool arguments. */
export function runtimeErrorDetail(error) {
  const seen = new Set(), lines = [];
  let current = error;
  while (current != null && !seen.has(current) && lines.length < 6) {
    seen.add(current);
    lines.push(typeof current?.stack === 'string' ? current.stack : String(current?.message ?? current));
    current = current?.cause;
  }
  return lines.join('\nCaused by: ');
}
export function registerRuntimeDiagnostics(ctx, write = (message) => console.error(message)) {
  return ctx.on('agent/error', ({ agent, turn, step, error }) => {
    try {
      write(`[Gallery host diagnostics] session=${agent?.id ?? 'unknown'} turn=${turn} step=${step}\n${runtimeErrorDetail(error)}`);
    } catch { /* Diagnostics must never break session error handling. */ }
  });
}
