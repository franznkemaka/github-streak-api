import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import error from './middleware/error';
import statsRoutes from './routes/stats';

// -- configure env
dotenv.config();

/**
 * Express instance
 * @public
 */
const app = express();
app.use(cors());
// mount api routes
app.use('/stats', statsRoutes);
app.use(error.notFound);

const port = process.env.PORT || 5000;

// listen to requests
app.listen(port, () => console.info(`server started on port ${port} (${app.get('env')})`));
