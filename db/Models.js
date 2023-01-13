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
				type: String,
				required: true,
			},
			orientation: {
				// this will probably be a different format later, for now just a string
				type: String,
				required: true
			},
			latLong: {
				type: String,
				required: true
			}
		}))
		
		
	}
}

module.exports = Models