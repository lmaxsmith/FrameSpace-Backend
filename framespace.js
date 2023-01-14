global.__base = __dirname + '/'

const express = require('express')
const bcrypt = require('bcryptjs')
const axios = require('axios')
const bodyParser = require('body-parser')
const cors = require('cors')
const crypto = require('crypto')
const fs = require('fs')
const FormData = require('form-data')

const f = require(__base + 'utils/asyncExpressRouteWrapper')
const MongoSetup = require(__base + 'db/MongodbSetup')
const {Model} = require('mongoose')

function generateKey() {
	return crypto.randomBytes(20).toString('base64');
}

async function run() {
	let models = await MongoSetup()
	
	let rawdataSecrets = fs.readFileSync('secrets.json');
	let secrets = JSON.parse(rawdataSecrets);
	
	const app = express()
	const port = 3000
	app.use(bodyParser.json())
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
		
		
		//curl --request POST \
		//  --url https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v2/direct_upload \
		//  --header 'Authorization: Bearer <API_TOKEN>' \
		//  --form 'requireSignedURLs=true' \
		//  --form 'metadata={"key":"value"}'
		
		let form = new FormData()
		form.append('requireSignedURLs', 'false')
		form.append('metadata','{"key":"value"}')
		
		let cloudflareResponse = await axios({
			method: 'post',
			url: 'https://api.cloudflare.com/client/v4/accounts/'+secrets.cloudflareAccountID+'/images/v2/direct_upload',
			headers: {'Authorization': 'Bearer ' +secrets.cloudflareAPIToken},
			data: form
		})
		if (cloudflareResponse.data.success!=true) {
			console.error('bad cloudflare response: ', cloudflareResponse)
			throw 'bad cloudflare response'
		}
		
		//cloudflareResponse.data.result.id
		
		console.log(cloudflareResponse)
		let imageURL = new models.ImageURL({
			cloudflareUUID: cloudflareResponse.data.result['id'],
			imageUploadURL: cloudflareResponse.data.result.uploadURL,
			imageDownloadURL: 'https://imagedelivery.net/'+secrets.cloudflareAccountHash+'/'+cloudflareResponse.data.result.id+'/public'
			//https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/<VARIANT_NAME>
		})
		await imageURL.save()
		let image = new models.Image({
			user: req.validUserID,
			imageURL : imageURL._id,
			//todo: validate orientation and location data
			orientation: req.body['orientation'],
			location: req.body['location'],
			aspectRatio: req.body['aspectRatio']
		})
		await image.save()
		
		image.imageURL = imageURL
		res.json({
			success: true,
			image: image
		})
	}))
	
	
	app.get('/images', f(async (req, res, next)=>{
		if (!req.loggedIn) {
			throw 'not logged in'
		}
		let images = await models.Image.find().populate('imageURL').exec()
		res.json({
			success: true,
			images: images
		})
	}))
	
	app.get('/images/:lat/:long/:range', f(async (req, res, next)=>{
		if (!req.loggedIn) {
			throw 'not logged in'
		}
		let images = await models.find({
			location: {
				$near: {
					$maxDistance: req.body['range'],
					$geometry: {
						type: "Point",
						coordinates: [req.body['long'], req.body['lat']]
					}
				}
			}
		}).exec()
		res.json({
			success: true,
			images:  images
		})
	
	}))
	
	app.use(function (err, req, res, next) {
		console.error(Date.now().toString() + ' Caught an error in api server: ', err)
		res.status(403).json({
			success: false,
			message: 'Invalid Request. See logs for more info near ' + Date.now().toString()
		})
	})
	
	app.listen(port, () => {
		console.log(`FrameSpace app listening on port ${port}`)
	})
}

run()