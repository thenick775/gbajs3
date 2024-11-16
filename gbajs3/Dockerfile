# first stage - builder
FROM node:20.12.1-alpine3.19 AS builder
WORKDIR /app
COPY . /app

ARG CLIENT_HOST
ENV VITE_GBA_SERVER_LOCATION=${CLIENT_HOST}
# build statically embeds git information for display and reference
RUN apk add --no-cache git

WORKDIR /app/gbajs3
RUN npm install && npm run build

# second stage, server
FROM nginx:stable-alpine

LABEL org.opencontainers.image.source https://github.com/thenick775/gbajs3

COPY ./gbajs3/docker/nginx.conf.template /etc/nginx/templates/nginx.conf.template

# copy build
COPY --from=builder /app/gbajs3/dist /var/www/

# install fail2ban, fail2ban config
RUN apk add rsyslog fail2ban

COPY ./gbajs3/docker/fail2ban/jail.conf /etc/fail2ban/jail.conf
COPY ./gbajs3/docker/fail2ban/nginx-*.conf /etc/fail2ban/filter.d/
COPY ./gbajs3/docker/fail2ban/alljailstatus.sh /etc/fail2ban/custom/alljailstatus.sh
COPY ./gbajs3/docker/fail2ban/bancountall.sh /etc/fail2ban/custom/bancountall.sh
ENV PATH="${PATH}:/etc/fail2ban/custom/"
RUN touch /var/log/fail2ban.log

COPY ./gbajs3/docker/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
