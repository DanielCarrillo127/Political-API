const app = require('../app');
const request = require('supertest');

//https://jestjs.io/docs/getting-started

describe("Alive", () => {
    test("should return a status 200", async () => {
        const response = await request(app).get("/api/")
        expect(response.statusCode).toBe(200)
        expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
    })
})

// describe("POST Request /Users",  () => {
//     test("should Create the user in the database and return a json",async () => {
//         const body = {
//             name: "Admin user",
//             surnames: "Admin surnames",
//             password: "Admin password",
//             cedula: "1192812094",
//             phoneNumber: "3508117016",
//             sex: "1",
//             address: "calle 12#12a",
//             age: "22"
//           }
//         const response = await request(app).post("/api/newUser").send(body)
//         expect(response.headers['content-type']).toEqual(expect.stringContaining("json"))
//         expect(response.statusCode).toBe(201)
//     })
// })

// describe("Get Request /Users", () => {
//     test("should save the user in the database", () => {
//         const body = {
//             username: "username",
//             password: "password"
//         }
//         const response = await request(app).post("/users").send(body)
//     })
// })