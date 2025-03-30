# Этап сборки
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Этап запуска (nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Можно кастомизировать nginx.conf при необходимости
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]