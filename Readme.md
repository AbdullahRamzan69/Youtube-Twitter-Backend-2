step 1 :-

install the dependencies like nodemon , update the package.json file and create iniatial files and folders.

step 2 :-

setup the db at mongodb atlas and get the url for db connection 

step 3 :- 

configure express in index.js , and also add cors and middleware like cookie parser

step 4 :-

in utils make a asyncHandler.js to make a wrapper function for the routes later so you dant have to use try catch in everyone.
also make a apiError.js to use Error class of node to make custom errors.

step 5 :-

install bcrypt and jwt
/////////////////////////////////////Extra /////////////////////////////////////

1:when making a user model we dont save its id because the id is auto created in db in bson(binary json)
It's MongoDB's internal format for storing data.

