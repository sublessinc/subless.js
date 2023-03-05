# subless.js
embedded js for subless integrations. The compiled version of this file is served by subless, and usage of this repo is not required for subless partners, creators, or users.

Building and embedding subless.js directly is not supported in partner integrations, but this source is provided for transparency and to assist with integration questions.

For guidance on integration, please visit https://github.com/sublessinc/SampleClients

# requirements
* docker
* node.js 16+

# building
## To build via npm
* npm install
* npm build:prod
* subless2.0.js should now be present in ./dist

## To build via docker
* docker build --build-arg build_environment=prod -t sublessjs .
* A docker image named subless.js should now be available and subless2.0.js should be available in /src/dist