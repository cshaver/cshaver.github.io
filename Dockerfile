# syntax=docker/dockerfile:1

# make sure node and node-sass versions are compatible:
# https://www.npmjs.com/package/node-sass#node-version-support-policy
FROM node:12-alpine
WORKDIR /app
RUN apk add --no-cache python2 git make g++ libsass-dev
COPY package.json package-lock.json ./
RUN ls
RUN npm install
# couldn't get this to work, oh well
RUN npm rebuild node-sass
COPY . .
CMD ["npm", "run", "develop"]
EXPOSE 4000 3000