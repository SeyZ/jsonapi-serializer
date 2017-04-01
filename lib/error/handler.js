module.exports = function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  return res
    .status(parseInt(err.status) || 500)
    .json({ errors: err });
};
