const userRouters = require('./users')
const eventRoutes = require('./events')
const attendanceRoutes = require('./attendance')
const witnessRoutes = require('./witness')

const routes = (app) => {
    app.use("/api", userRouters)
    app.use("/api", eventRoutes)
    app.use("/api", attendanceRoutes)
    app.use("/api", witnessRoutes)
};

module.exports = routes