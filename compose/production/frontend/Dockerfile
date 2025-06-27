FROM node:18-alpine AS builder

WORKDIR /app

COPY ./frontend/package.json ./

RUN yarn install

COPY ./frontend/ ./
RUN yarn run build

CMD ["yarn","run","start"]