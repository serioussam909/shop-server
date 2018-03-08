
import mongoose from 'mongoose';
import multer from 'multer';
import mkdirp from 'mkdirp';
import find from 'find';
import rimraf from 'rimraf';
import AdmZip from 'adm-zip';
import path from 'path';
//import models
import Item from '../models/item.model';

export const getItems = (req, res) => {
    Item.find().exec().then(items => {
        return res.json({ 'success': true, 'message': 'Items fetched successfully', 'items': items });
    }).catch(err => {
        return res.status(500).json({ 'success': false, 'message': 'Error', 'error': err });
    });
}

//shared functions for edit and update
const multerSetup = () => {
    const storage = multer.diskStorage({
        destination: './temp',
        filename: function (req, file, cb) {

            cb(null, file.fieldname + '-' + Date.now() + '.zip');
        }
    })

    const multerParams = {
        storage: storage,
        fileFilter: function (req, file, cb) {
            //accept only zip files
            if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
                cb(null, true);
            } else {
                cb(null, false);
            }

        }
    };

    return multer(multerParams).single('model');
}

const createUpdateModelFile = (item, filedata, res) => {

    //create a folder under uploads with the same ID as the model
    const newPath = './uploads/' + item._id + '/';
    try {
        mkdirp.sync(newPath, { mode: 0o777 });
    } catch (exception) {
        //cleanup
        rimraf.sync(newPath);
        rimraf.sync('./temp/' + filedata.filename);
        return res.status(500).json({ 'success': false, 'message': 'Error creating model folder', 'error': exception });
    }

    try {
        const zip = new AdmZip('./temp/' + filedata.filename);
        zip.extractAllTo(newPath, true);
    } catch (exception) {
        //cleanup
        rimraf.sync(newPath);
        rimraf.sync('./temp/' + filedata.filename);
        return res.status(500).json({ 'success': false, 'message': 'Error extracting', 'error': exception });
    }
    //cleanup
    rimraf.sync('./temp/' + filedata.filename);

    //look for dae files
    var files = find.fileSync(/\.dae$/, newPath);
    if (files.length > 0) {
        const modelFilepath = files[0];
        const modelFilename = path.basename(modelFilepath);
        //extracted successfully
        Item.findByIdAndUpdate(item._id, { modelFilename: modelFilename }, { new: true }).exec().then(item => {
            return res.json({ 'success': true, 'message': 'Item added successfully', 'item': item });
        }).catch(err => {
            return res.status(500).json({ 'success': false, 'message': 'Error updating database', 'error': err });
        });

    } else {
        return res.status(422).json({ 'success': false, 'message': 'Error - no .dae file', 'error': 'No .dae file in the archive' });
    }


}

export const addItem = (req, res) => {


    const upload = multerSetup();

    //parse the form data
    upload(req, res, function (error) {
        if (error) {
            return res.status(500).json({ 'success': false, 'message': 'Error uploading file', 'error': err });
        }
        const filedata = req.file;
        //uploaded successfully
        const newItem = new Item(req.body);
        newItem.save((err, item) => {
            if (err) {
                return res.status(500).json({ 'success': false, 'message': 'Error saving to database', 'error': err });
            } else {
                if (filedata) {
                    //saved to db successfully - create or update model file if it exists
                    createUpdateModelFile(item, filedata, res);

                } else {
                    return res.json({ 'success': true, 'message': 'Item added successfully', 'item': item });
                }

            }
        });

    })

}

export const updateItem = (req, res) => {
    const upload = multerSetup();
    //parse the form data
    upload(req, res, function (error) {
        if (error) {
            return res.status(500).json({ 'success': false, 'message': 'Error uploading file', 'error': err });
        }
        const filedata = req.file;
        //uploaded successfully
        Item.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec().then(item => {

            if (filedata) {
                //clean up the old model files
                try {
                    rimraf.sync('./uploads/' + item._id + '/');
                } catch (exception) {
                    return res.status(500).json({ 'success': false, 'message': 'Error deleting old models', 'error': exception });
                }

                //saved to db successfully - create or update model file if it exists
                createUpdateModelFile(item, filedata, res);

            } else {
                return res.json({ 'success': true, 'message': 'Item updated successfully', 'item': item });
            }



        }).catch(err => {
            //cleanup
            if (filedata) {
                rimraf.sync('./temp/' + filedata.filename);
            }
            return res.status(500).json({ 'success': false, 'message': 'Error updating database', 'error': err });
        });

    });
}


export const getItem = (req, res) => {
    Item.find({ _id: req.params.id }).exec().then(item => {
        if (item.length) {
            return res.json({ 'success': true, 'message': 'Item fetched by id successfully', 'item': item.pop() });
        } else {
            return res.status(404).json({ 'success': false, 'message': 'Item with the given id not found' });
        }
    }).catch(err => {
        return res.status(500).json({ 'success': false, 'message': 'Error fetching item', 'error': err });
    });
}

export const deleteItem = (req, res) => {
    Item.findByIdAndRemove(req.params.id).exec(item => {
        //clean up uploaded files too
        rimraf.sync('./uploads/' + req.params.id + '/');
        return res.json({ 'success': true, 'message': 'item with id ' + req.params.id + ' deleted successfully' });
    }).catch(err => {
        return res.status(500).json({ 'success': false, 'message': 'Error deleting item', 'error': err });
    });
}