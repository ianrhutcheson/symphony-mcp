FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV SYMPHONY_API_KEY=${SYMPHONY_API_KEY}
EXPOSE 3000
CMD ["node", "server-http.js"]
