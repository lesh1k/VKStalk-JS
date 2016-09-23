# vkstalk-js
Collect and analyze VK.com user's public information  

- [Setup](#setup)


### Setup

- Install [NodeJS](https://nodejs.org/en/) >= v6.2.2 [(ubuntu help)](http://stackoverflow.com/questions/20031849/how-can-i-find-my-node-js-files-in-linux-usr-bin-node-is-not-working/32740546#32740546)  
- Install mongodb  
- Install [PhantomJS](http://phantomjs.org/)  
- Navigate to `./src` and run `npm install`  
- Use `./config/db_sample_config.json` to create `./config/db.json`; Update config with your DB credentials.
- Use `./config/secrets_sample.json` to create `./config/secrets.json`; Add your secret key.
- Navigate to `src` dir. To launch the app:  
    -- Just stalker: `./stalker/run stalk USER_ID` (You'll see plenty of log messages and unformatted data. Log level can be changed in config)  
    -- Console: `./console/run/ stalk USER_ID` (Formatted output in console)  
    -- Web: `node ./web/server.js` (The most user friendly option. Will start an Express server, providing point-and-click control over stalker's functionality)  

`USER_ID` is to be replaced with the ID of the target user.  


To get the full list of accepted commands (by either stalker OR console) and options use `./stalker run help`
