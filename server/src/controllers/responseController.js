const errorResponse = (res, {status=500, message="Internal Server Error"}) =>{
    return res.status(status).json({
        success: false,
        message: message,
    });
}

const successResponse = (res, {status=200, message="Success", payload="" }) =>{
    return res.status(status).json({
        success: true,
        message: message,
        payload: payload,
    });
}

module.exports= {errorResponse, successResponse};