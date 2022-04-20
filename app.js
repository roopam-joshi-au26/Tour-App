const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

//1.GLOBAL Middlewares
//Set Security HTTP headers
app.use(helmet());

//Development logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
};

//100 request from same IP in 1hr
const limiter = rateLimit({
    max:100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, Please try again in an hour!'
});
app.use('/api',limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());//if user want to add some malicious code then it will prevent from them

//prevent parameter pollution
app.use(hpp({
    whitelist:['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

//Serving static files
app.use(express.static(`${__dirname}/public`))

//Test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
}); 

//3.ROUTES
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);

//for handling error request by user
app.all('*',(req,res,next) => {
    next(new AppError(`can't find ${req.originalUrl} on this server!`,404));
});

//Error handling middleware
app.use(globalErrorHandler);

//4.START THE SERVER
module.exports = app;