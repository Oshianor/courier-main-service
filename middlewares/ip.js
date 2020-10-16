module.exports = function(req, res, next) {
  try {
    var IPs =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    if (IPs.indexOf(":") !== -1) {
      IPs = IPs.split(":")[IPs.split(":").length - 1];
    }

		// return res.json({ IP: IPs.split(",")[0] });
		req.ipAddress = IPs.split(",")[0];
    next();
  } catch (err) {
    return res.status(400).json({ message: "got error" });
  }
};
