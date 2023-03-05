ARG build_environment=dev

FROM node:16-alpine as jsbuild
ARG build_environment
RUN echo "building for $build_environment"
WORKDIR /src
COPY ./package*.json ./
RUN npm install
COPY ./ /src
RUN npm run build:$build_environment