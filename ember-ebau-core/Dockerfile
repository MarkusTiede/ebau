FROM danlynn/ember-cli:4.8.0 as build

COPY package.json yarn.lock /myapp/
COPY ./ember-ebau-core/package.json /myapp/ember-ebau-core/

RUN yarn workspace ember-ebau-core install

COPY ember-ebau-core /myapp/ember-ebau-core

WORKDIR /myapp/ember-ebau-core
