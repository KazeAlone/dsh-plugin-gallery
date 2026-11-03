FROM node:24-slim
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node scripts/admin.mjs ./scripts/admin.mjs
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 4318
CMD ["node", "src/server.mjs", "--database", "/data/gallery.sqlite", "--host", "0.0.0.0", "--port", "4318"]
