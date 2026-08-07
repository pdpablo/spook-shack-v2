FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

ENV NODE_ENV=production \
    VITE_BASE44_APP_ID="" \
    VITE_BASE44_APP_BASE_URL="" \
    VITE_BASE44_FUNCTIONS_VERSION="" \
    PORT=8080

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
