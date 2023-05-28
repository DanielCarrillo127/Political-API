const controller = {}
const jwt = require('jsonwebtoken')

controller.verifyToken = async (req, res) => {
    try {
        const authHeader = await req.headers['authorization']
        const token = authHeader
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}
controller.decodeToken = async (req, res) => {
    try {
        const authHeader = await req.headers['authorization']
        const token = authHeader
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        return decoded
        console.log(decoded)
    } catch (error) {
        console.log(error)
        return false
    }
}
controller.createToken = (payload) => jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' })

module.exports = controller