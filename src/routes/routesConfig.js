const userRouters = require('./users')
const eventRoutes = require('./events')
const attendanceRoutes = require('./attendance')

const routes = (app) => {
    app.use("/api", userRouters)
    app.use("/api", eventRoutes)
    app.use("/api", attendanceRoutes)
};

module.exports = routes