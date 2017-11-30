FROM node:8.6.0 

EXPOSE 5555
ARG NODE_ENV=production

ADD package.json /opt/backend/

WORKDIR /opt/backend/

RUN npm install

ADD . /opt/backend/

CMD ["npm", "run", "start:prod"]