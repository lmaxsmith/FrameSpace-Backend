global.__base = __dirname + '/'

const express = require('express')
const bcrypt = require('bcryptjs')
const axios = require('axios')
const bodyParser = require('body-parser')
const cors = require('cors')
const crypto = require('crypto')

const f = require(__base + 'utils/asyncExpressRouteWrapper')
const MongoSetup = require(__base + 'db/MongodbSetup')

function generateKey() {
	return crypto.randomBytes(20).toString('base64');
}

async function run() {
	let models = await MongoSetup()
	
	const app = express()
	const port = 3000
	app.use(bodyParse.json())
	app.disable('x-powered-by')
	
	app.use(cors({
		origin: '*'
	}));
	
	app.use(f(async (req, res, next)=>{
		// console.log('got request:', req)
		try {
			if (req.get('FrameSpaceSessionKey')) {
				let declaredSessionKey = req.get('FrameSpaceSessionKey')
				let session = await models.Session.findOne({
					sessionKey: declaredSessionKey
				}).orFail()
				
				let user = await models.User.findOne({
					_id: session.user
				}).orFail()
				
				req.loggedIn = true
				req.validUserID = session.user
				req.validSessionKey = session.sessionKey
				
			} else throw "noSessionKey"
		} catch (err) {
			console.log(err)
			req.loggedIn = false
			req.validUserID = null
		}
		next()
	}))
	
	app.post('/signup', f(async (req, res, next)=>{
		// console.log(req.body)
		try {
			if (req.body['password'].length <8) {
				throw "invalidPassword"
			}
			let salt = bcrypt.genSaltSync(8);
			let hash = bcrypt.hashSync(req.body['password'], salt)
			
			let newUser = new models.User({
				email: req.body['email'],
				passwordBCrypt: hash,
			})
			await newUser.save()
			res.json({
				success: true,
				username: newUser.username,
				email: newUser.email
			})
		} catch (err) {
			console.error('signup error: ', err)
			res.json({
				success: false,
				error: 'invalid input'
			})
		}
	}))
	
	app.post('/login', f(async(req, res, next)=>{
		try {
			if (req.loggedIn === true) {
				throw "already logged in"
			}
			
			let loginemail = req.body['email']
			let loginpassword = req.body['password']
			
			let user = await models.User.findOne({
				email: loginemail,
			}).orFail()
			
			if (bcrypt.compareSync(loginpassword, user.passwordBCrypt)) {
				let session = new models.Session({
					user: user._id,
					sessionKey: generateKey(),
					createdAt: Date.now()
				})
				await session.save()
				res.json({
					success: true,
					email: user.email,
					sessionKey: session.sessionKey
				})
				
			} else {
				console.log('bad password')
				throw "bad password"
			}
		} catch(err) {
			console.log('login error: ', err)
			res.json({
				success: false
			})
		}
	}))
	
	
	app.get('/sessionCheck', f(async (req, res, next)=>{
		if (req.loggedIn) {
			res.json({
				success: true
			})
		} else {
			res.json({
				success: false
			})
		}
	}))
	
	app.post('/newImage', f(async (req, res, next)=>{
		if (!req.loggedIn) {
			throw 'not logged in'
		}
		let image = new models.Image({
			user: req.validUserID,
			imageURL : 'placeholder',
			//todo: validate orientation and lat long data
			orientation: req.body['orientation'],
			latLong: req.body['latLong']
		})
		await image.save()
		res.json({
			success: true,
			image: image
		})
	}))
	
	
	
	
}