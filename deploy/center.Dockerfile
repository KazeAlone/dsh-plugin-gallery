FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --omit=peer --ignore-scripts
COPY --chown=node:node src ./src
COPY --chown=node:node scripts/center.mjs scripts/center-users.mjs ./scripts/
ENV HOST=0.0.0.0 PORT=8090
USER node
EXPOSE 8090
HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD node -e "fetch('http://127.0.0.1:8090/v2/health',{headers:{Authorization:'Bearer '+process.env.GALLERY_API_TOKEN},signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/center.mjs"]
