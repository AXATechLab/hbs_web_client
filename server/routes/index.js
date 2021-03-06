const path = require('path');
const validator = require('validator');

const DirectlineClient = require('../directline-client');
const setupCookie = require('../cookies/cookie-helper');
const Logger = require('../logger');

const logger = Logger.getLogger();

const isValidBundle = (bundle, key) => {
   return Object.keys(bundle).length === 1 || bundle.hasOwnProperty(key);
};

const isValidOrUndefined = input => {
    return input === undefined || validator.isAlphanumeric(input);
};

const directlineClient = new DirectlineClient(process.env.WEBCHAT_SECRET);

module.exports = (app) => {
  app.get('/has-cookie',  function(req, res) {
      try {
          const hasCookie = !!req.cookies && req.cookies.userid;
          let response = {};
  
          if (hasCookie) {
              response = {
                  hasCookie
              };
          }
          res.json(response);
      } catch(error) {
          logger.error(error);
          res.status(500).send();
      }
  });

  app.post('/chatbot',  async function(req, res) {
      try {
          if (!isValidBundle(req.body, 'hasAcceptedCookie') || !validator.isBoolean(req.body.hasAcceptedCookie.toString())) {
              return res.status(400).json({});
          }
          const hasAcceptedCookie = req.body.hasAcceptedCookie;
          let userId = req.cookies.userid;
          logger.debug(`hasAcceptedCookie: ${hasAcceptedCookie}`);

          if (!isValidOrUndefined(userId)) {
            return res.status(400).json({});
          }

          if (hasAcceptedCookie && !userId) {
              userId = setupCookie(res);
          }
          const token = await directlineClient.generateJwtToken(userId);
  
          res.send(token);
      } catch(error) {
          logger.error(error);
          res.status(500).send();
      }
  });
  
  app.get('*', function(req, res){
      const notFoundPath = path.join(__dirname, '..', '..', 'public', '404.html');
      logger.error(`not found url: ${req.url}`);
      res.status(404).sendFile(notFoundPath);
  });
};
