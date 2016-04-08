# docker-logentries
#
# VERSION 0.2.0

FROM node:0.12-onbuild
MAINTAINER Matteo Collina <hello@matteocollina.com>

WORKDIR /usr/src/app
COPY package.json package.json
RUN npm install --production
COPY index.js /usr/src/app/index.js

ENTRYPOINT ["/usr/src/app/index.js"]
CMD []
