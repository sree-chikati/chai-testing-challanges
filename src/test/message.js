require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

// const SAMPLE_USER_ID  = 'aaaaaaaaaaaa' // 12 byte string
const SAMPLE_MESSAGE_ID = 'aaaaaaaaaabc' // 12 byte string

describe('Message API endpoints', () => {
    beforeEach((done) => {
        // TODO: add any beforeEach code here
        const sampleUser = new User({
            username: 'myuser',
            password: 'mypassword'
        })

        const sampleMessage = new Message({
            title: 'testTitle',
            body: 'testBody',
            _id: SAMPLE_MESSAGE_ID
        })

        sampleUser.save()
        .then( () => {
            sampleMessage.author = sampleUser
            return sampleMessage.save()
        })
        .then(() => {
            sampleUser.messages.unshift(sampleMessage)
            return sampleUser.save()
        })
        .then( () => {
            done()
        })
    })

    afterEach((done) => {
        User.deleteMany({ username: ['myuser'] })
        Message.deleteMany({ title: ['testTitle'] })
        .then(() => {
            done()
        })  
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages')
        .end( (err, res) => {
            if (err) {
                done(err)
            } 
            else {
                expect(res).to.have.status(200)
                expect(res.body.messages).to.be.an('array')
                done()
            }
        })
    })

    it('should get one specific message', (done) => {
        const message = Message.findOne({title: 'testTitle'})
        chai.request(app)
        .get(`/messages/${message._id}`)
        .end( (err, res) => {
            if (err) {
                done(err)
            } 
            else {
                expect(res).to.have.status(200)
                expect(res.body).to.be.an('object')
                expect(res.body.title).to.be.deep.equal('testTitle')
                expect(res.body.body).to.be.deep.equal('testBody')
                done()
            }
        })
    })

    it('should post a new message', (done) => {
        const user = User.findOne({username: 'myuser'})
        chai.request(app)
        .post(`/messages`)
        .send({title: 'testTitle2', body: 'testBody2', author: user})
        .end( (err, res) => {
            if (err) {
                done(err)
            } 
            else {
                expect(res.body.title).to.be.deep.equal('testTitle2')
                expect(res.body.body).to.be.deep.equal('testBody2')
                expect(res.body.author).to.be.equal(`${user._id}`)

                Message.findOne({title: 'testTitle2'})
                .then( (message) => {
                    expect(message).to.be.an('object')
                    done()
                })
            }
        })
    })

    it('should update a message', (done) => {
        const message = Message.findOne({title: 'testTitle'})
        chai.request(app)
        .put(`/messages/${message._id}`)
        .send({title: 'Updated testTitle'})
        .end( (err, res) => {
            if (err) { 
                done(err) 
            }
            expect(res.body.message.title).to.be.deep.equal('Updated testTitle')
            expect(res.body.message).to.have.property('title', 'Updated testTitle')
            
            Message.findOne({title: 'Updated testTitle'})
            .then( (message) => {
                expect(message.title).to.be.deep.equal('Updated testTitle')
                done()
            })
        })
    })

    it('should delete a message', (done) => {
        const message = Message.findOne({title: 'testTitle'})
        chai.request(app)
        .delete(`/messages/${message._id}`)
        .end( (err, res) => {
            if (err) {
                done(err)
            }
            expect(res.body.message).to.be.deep.equal('Message Deleted')
            done()
        })
    })
})
