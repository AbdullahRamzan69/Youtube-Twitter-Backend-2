// const asyncHandler = (requestHandler)=>{(req,res,next)=>{
//     Promise.resolve(asyncHandler(req,res,next))
//     .catch((err)=>next(err))
// }}

// export {asyncHandler}

/// with async/await

// const asyncHandler = ()=>{}
// //high order function (accepts another function)

// const asyncHandler = (func)=>{()=>{}}

// //remove the the curly braces to make it short
 const asyncHandler = (fn)=> async (req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
        console.error("Error caught in asyncHandler:");
        console.error(error.stack);
        
        res.status(error.code || 500).json({
            success: false,
            message: error.message,
            stack: error.stack // Added for debugging
        })
    }
 } // also made it async

 // this also doesnt need a return statement because the arrow func doest have curly braces

export {asyncHandler}
