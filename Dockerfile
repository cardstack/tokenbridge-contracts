FROM node:10 as contracts

WORKDIR /contracts

COPY package.json .
COPY package-lock.json .
RUN yarn install

COPY truffle-config.js truffle-config.js
COPY ./contracts ./contracts
RUN yarn run compile

COPY flatten.sh flatten.sh
RUN bash flatten.sh

FROM node:10

WORKDIR /contracts
COPY --from=contracts /contracts/build ./build
COPY --from=contracts /contracts/flats ./flats

COPY ./deploy/package.json ./deploy/
COPY ./deploy/package-lock.json ./deploy/
RUN cd ./deploy; yarn; cd ..

COPY ./upgrade/package.json ./upgrade/
COPY ./upgrade/package-lock.json ./upgrade/
RUN cd ./upgrade; yarn; cd ..

COPY ./upgrade ./upgrade
COPY deploy.sh deploy.sh
COPY ./deploy ./deploy

ENV PATH="/contracts/:${PATH}"
ENV NOFLAT=true
