var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DeviceSchema = new Schema({
   owner: {
        type: Schema.Types.ObjectId,
        required: true,
	    ref: 'User'
   },
   device_token: {
        type: String,
	    unique: true,
        required: true
   }
});

module.exports = mongoose.model('Device', DeviceSchema);