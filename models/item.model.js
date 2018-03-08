import mongoose from 'mongoose';

var Schema = mongoose.Schema({

    createdAt: {
        type: Date,
        default: Date.now
    },
    name: { type: String, minlength: 1 },
    description: String,
    price: {type: Number, min:0},
    modelFilename: String

});
export default mongoose.model('Item', Schema);