import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import error from './middleware/error';
import statsRoutes from './routes/stats';

// -- configure env
dotenv.config();

/**
 * Express instance
 * @public
 */
const app = express();

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// mount api routes
app.use('/stats', statsRoutes);
app.use(error.notFound);

const port = process.env.PORT || 5000;

// listen to requests
app.listen(port, () => console.info(`server started on port ${port} (${app.get('env')})`));
