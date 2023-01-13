module.exports = fn => // we wrap all our async router functions in this so that we can centralize error handling in later middleware
	(req, res, next) => {
		Promise.resolve(fn(req, res, next))
			.catch(next);
	};