# docker-logentries
#
# VERSION 0.2.0

FROM alpine:edge
MAINTAINER Rapid 7 - Logentries <support@logentries.com>

RUN echo '@edge http://nl.alpinelinux.org/alpine/edge/main' >> /etc/apk/repositories
RUN apk update && apk upgrade
RUN apk add nodejs

WORKDIR /usr/src/app
COPY package.json package.json
RUN npm install --production
COPY index.js /usr/src/app/index.js

ENTRYPOINT ["node", "/usr/src/app/index.js"]
CMD []
