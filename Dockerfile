FROM node:10.16-alpine

LABEL maintainer="Flownote <docker@hasbrain.com>"

RUN apk add --no-cache tini

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci --only=production

# Bundle app source
COPY ./dist ./dist

ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "dist/index.js" ]

USER node