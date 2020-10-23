const winston = require('winston');

module.exports = function(err, req, res, next) {
  winston.error(err.message, err);

  //#region Logs 
  /**
   * error
   * warn
   * info
   * verbose
   * debug
   * silly
   */
  //#endregion 

  res.status(500).send('Something failed.');
}