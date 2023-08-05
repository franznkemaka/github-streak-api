import express from 'express';
const router = express.Router();
import axios from 'axios';

router.route('/:username').get(async (req, res) => {
  const { username } = req.params;
  const response = await axios.get(`https://ghchart.rshah.org/${username}`);
  res.status(200).send(response.data);
  //
});

export default router;
