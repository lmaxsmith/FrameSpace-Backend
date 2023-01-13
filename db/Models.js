const {mongo} = require('mongoose')
const Schema = require('mongoose').Schema

class Models {
	constructor(mongoose) {
		this.User = mongoose.model('User', new Schema({
			email: {
				type: String,
				required: true,
				index: {
					unique: true
				},
				validate: function (input) {
					return true;
				}
			},
			passwordBCrypt: {
				type: String,
				required: true,
			}
		}))
		
		this.Session = mongoose.model('Session', new Schema({
			user: {
				type: Schema.Types.ObjectId,
				ref: 'User'
			},
			createdAt: { type: Date, expires: 864000},
			sessionKey: {
				type: String,
				required: true
			}
		}))
		
		this.Image = mongoose.model('Image', new Schema({
			user: {
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
			creationTimestamp: {
				type: Date,
				default: Date.now
			},
			imageURL : {
				type: Schema.Types.ObjectId,
				ref: 'ImageURL'
			},
			orientation: {
				// this will probably be a different format later, for now just a string
				type: String,
				required: true
			},
			location: {
				type: {
					type: String, // Don't do `{ location: { type: String } }`
					enum: ['Point'], // 'location.type' must be 'Point'
					required: true
				},
				coordinates: {
					type: [Number],
					required: true
				}
			}
		}))
		
		
		
		this.ImageURL = mongoose.model('ImageURL', new Schema({
			cloudflareUUID: {
				type: String,
				required: true
			},
			imageUploadURL: {
				type: String
			},
			imageDownloadURL: {
				type: String
			}
		}))
		
		
		
	}
}

module.exports = Models