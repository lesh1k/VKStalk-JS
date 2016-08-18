# VKStalk-JS
Scrapes VK user page for important information and interesting updates  


### Setup

- Install NodeJS >= v6.2.2  
- Install mongodb  
- Install [PhantomJS](http://phantomjs.org/)  
- Navigate to `./src` and run `npm install`  
- Use `./config/db_sample_config.json` to create `./config/db.json`; Update config with your DB credentials.
- Navigate to `src` dir. Launch the app by executing `./vkstalk stalk USER_ID`, where `USER_ID` is to be replaced with the ID of the target user.
To get the full list of accepted commands and options use `./vkstalk help`
