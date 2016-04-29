# docker-logentries
#
# VERSION 1.0.0

FROM mhart/alpine-node:5.10.1
MAINTAINER Matteo Collina <hello@matteocollina.com>
RUN apk add --no-cache bash

WORKDIR /usr/src/app
COPY package.json package.json
RUN npm install --production
RUN npm cache clean
COPY index.js /usr/src/app/index.js

ENTRYPOINT ["/usr/src/app/index.js"]
CMD []
