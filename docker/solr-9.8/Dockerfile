FROM solr:9.8.0
LABEL org.opencontainers.image.authors="dkd Internet Service GmbH info@dkd.de"
ENV TERM=linux

ARG SOLR_UNIX_UID="8983"
ARG SOLR_UNIX_GID="8983"

USER root
RUN rm -fR /opt/solr/server/solr/* \
  && usermod --non-unique --uid "${SOLR_UNIX_UID}" solr \
  && groupmod --non-unique --gid "${SOLR_UNIX_GID}" solr \
  && chown -R solr:solr /var/solr /opt/solr \
  && apt update && apt upgrade -y && apt install sudo -y \
  && echo "solr ALL=NOPASSWD:SETENV: /docker-entrypoint-initdb.d-as-sudo/*" > /etc/sudoers.d/solr

RUN touch /tmp/teste

COPY docker/solr-9.8/docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d
COPY docker/solr-9.8/docker-entrypoint-initdb.d-as-sudo/ /docker-entrypoint-initdb.d-as-sudo
USER solr

COPY --chown=solr:solr docker/solr-9.8/conf /var/solr/data
RUN mkdir -p /var/solr/data/data