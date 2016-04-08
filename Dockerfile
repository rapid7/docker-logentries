# docker-logentries
#
# VERSION 1.0.0

FROM mhart/alpine-node:5.10.1
MAINTAINER Matteo Collina <hello@matteocollina.com>

ENTRYPOINT ["/usr/src/app/index.js"]
CMD []
