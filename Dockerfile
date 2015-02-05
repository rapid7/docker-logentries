# docker-logentries
#
# VERSION 0.1.0

FROM node:0.10-onbuild
MAINTAINER Matteo Collina <hello@matteocollina.com>

ENTRYPOINT ["/usr/src/app/index.js"]
CMD []
