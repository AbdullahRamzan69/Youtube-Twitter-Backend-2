class apiError extends Error {
    constructor(
        //these are the things ill pass when creating the error
        statusCode,
        message= "Something went wrong",
        error=[],
        stack=""
    ){
        super(message) // calls the parent Error constructor
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        // this code helps to locate the error from where it was created 
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {apiError}