FROM node:alpine AS base

RUN mkdir /app
WORKDIR /app
ENTRYPOINT ["node", "cron"]
CMD ["./example_tasks.json"]
HEALTHCHECK CMD npm run health -- 120

RUN apk upgrade --no-cache
COPY ./package*.json /app/

FROM base AS build
RUN apk add --no-cache git
RUN npm install --production

FROM base
COPY --from=build /app/node_modules/ /app/node_modules/
COPY ./cron.js ./example_tasks.json /app/
