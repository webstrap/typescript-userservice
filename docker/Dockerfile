FROM node:8.6.0 

EXPOSE 5555
ARG NODE_ENV=production

WORKDIR /opt/backend/

ADD package.json .
ADD yarn.lock .



RUN yarn install

ADD . .

CMD ["yarn", "run", "start:prod"]