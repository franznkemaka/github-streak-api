import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import error from './middleware/error';
import statsRoutes from './routes/stats';
import graphRoutes from './routes/graph';

// -- configure env
dotenv.config();

/**
 * Express instance
 * @public
 */
const app = express();

// -- limit each IP to 1000 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use(limiter);

app.use(cors());

// -- mount api routes
app.use('/stats', statsRoutes);
app.use('/graph', graphRoutes);
app.use(error.notFound);

const port = process.env.PORT || 5000;

// listen to requests
app.listen(port, () => console.info(`server started on port ${port} (${app.get('env')})`));
