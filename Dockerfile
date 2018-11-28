# debian with buildpack-deps
FROM node:latest

WORKDIR /src

COPY package.json /src
RUN npm install

COPY . /src

EXPOSE 4001

CMD ["npm", "run", "deploy"]