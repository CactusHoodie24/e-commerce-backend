process.env.JWT_SECRET = "testsecret123";
import {expect} from 'chai'
import request from 'supertest'
import app from '../src/app.js'
import User from '../src/models/user.model.js'
import bcrypt from "bcrypt";
import sinon from 'sinon'

describe('POST api/users/login', () => {
    let findonestub;

    before(() => {
        findonestub = sinon.stub(User, 'findOne')
    })

    after(() => {
        findonestub.restore()
    })

    it('should login user with valid credentials', async () => {
        const fakeUser = {
            email: 'john@example.com',
            password: await bcrypt.hash('mypassword', 10)
        }
        findonestub.resolves(fakeUser)
        const res = await request(app).post('/api/users/login').send({email: 'johnexample.com', password: 'mypassword'})
        expect(res.status).to.equal(200)
        expect(res.body.message).to.equal('Login successful')
    })
})

describe('POST /api/users', () => {
    let findonestab

    before(() => {
        findonestab = sinon.stub(User, 'create')
    })

    after(() => {
        findonestab.restore()
    })

    it('should create user', async () => {
      findonestab.resolves({id: 1, name: 'hoodie', email: 'hoodie@gmail.com', password: await bcrypt.hash('hoodie24', 10)})
      const res = await request(app).post('/api/users').send({id: 1, name: 'hoodie', email: 'hoodie@gmail.com', password: await bcrypt.hash('hoodie24', 10)})
      expect(res.status).to.equal(200)
      expect(res.body.message).to.equal('User created successfully')
    })
})