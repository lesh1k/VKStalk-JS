# VKStalk-JS
Scrapes VK user page for important information and interesting updates  


### Setup

- Install [NodeJS](https://nodejs.org/en/) >= v6.2.2 [(ubuntu help)](http://stackoverflow.com/questions/20031849/how-can-i-find-my-node-js-files-in-linux-usr-bin-node-is-not-working/32740546#32740546)  
- Install mongodb  
- Install [PhantomJS](http://phantomjs.org/)  
- Navigate to `./src` and run `npm install`  
- Use `./config/db_sample_config.json` to create `./config/db.json`; Update config with your DB credentials.
- Use `./config/secrets_sample.json` to create `./config/secrets.json`; Add your secret key.
- Navigate to `src` dir. To launch the app:  
    -- Just stalker: `./stalker/run stalk USER_ID`  
    -- Console: `./console/run/ stalk USER_ID`  
    -- Web: `node ./web/server.js`  

`USER_ID` is to be replaced with the ID of the target user.
To get the full list of accepted commands and options use `./vkstalk help`
