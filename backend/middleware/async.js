// This is not currently being used
// Using 'express-async-errors' instead

module.exports = function (handler) { 
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } 
    catch (ex) {
      next(ex);
    }
  };
}