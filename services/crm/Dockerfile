FROM node:22-alpine

WORKDIR /app

# Clone and build Atomic CRM from upstream
RUN apk add --no-cache git && \
    git clone --depth 1 https://github.com/marmelab/atomic-crm.git . && \
    npm install && \
    rm -rf .git

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
