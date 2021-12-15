import express from 'express';
import github from '../github';
const router = express.Router();

router.route('/:username').get(async (req, res) => {
  const { username } = req.params;
  const stats = await github.getStreakStats(username);
  res.status(200).json(stats);
  //
});

export default router;
