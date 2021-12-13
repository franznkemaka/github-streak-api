const notFound = (req, res) => {
  res.status(404);
  if (req.accepts('json')) {
    res.end();
  }
};

export default { notFound };
