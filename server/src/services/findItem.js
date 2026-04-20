const mongoose = require("mongoose");
const createError = require("http-errors");


const findWithId = async(Model,id, options={})=> {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw createError(400, "Invalid item ID format");
        }
        
        const item= await Model.findById(id, options);
        if(!item) {
            throw createError(404, `${Model.modelName} does not exits with this id`);
        };
        return item;
    } catch (error) {
        throw error;
    }
}

module.exports= findWithId;