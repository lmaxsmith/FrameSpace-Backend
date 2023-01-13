const Models = require(__base + 'db/Models')
const mongoose = require('mongoose')



async function MongodbSetup() {
	await mongoose.connect('mongodb://localhost/framespace-v1')
	let db = mongoose.connection
	db.on('error', console.error.bind(console, 'connection error: '))
	
	console.log('db connection established')
	let models = new Models(mongoose)
	return models
	
	// return new Promise(resolve => {
	// 	resolve(models);
	// });
	
	// db.once('open', ()=>{
	// 	console.log('db connection established')
	// 	let models = new Models(mongoose)
	//
	//
	// })
}



module.exports = MongodbSetup