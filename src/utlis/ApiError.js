class ApiError extends Error {
    constructor(
        statusCode ,
        message = "An error occurred",
        errors = [],
        statck = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.sucess = false
        this.errors = errors

        if (statck) {
            this.stack = this.stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
        
    
}


export { ApiError } 