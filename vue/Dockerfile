FROM node:lts-alpine

# make the 'app' folder the current working directory
WORKDIR /app

# copy project files and folders to the current working directory
COPY . .

# install project dependencies
RUN npm install

# build app for production with minification
RUN npm run build

# Build express server
RUN cd express && npm install --omit=dev

CMD [ "node", "express/server.js" ]