
import express from 'express';
//import controller file
import * as itemController from '../controllers/item.controller';

// get an instance of express router
const router = express.Router();
router.route('/')
        .get(itemController.getItems)
        .post(itemController.addItem);
router.route('/:id')
        .put(itemController.updateItem)
        .get(itemController.getItem)
        .delete(itemController.deleteItem);
export default router;