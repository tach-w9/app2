FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# تثبيت المتصفح والتبعيات صراحة داخل الحاوية
RUN npx playwright install --with-deps chromium

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]