import express from 'express';
import github from '../github';
const router = express.Router();

router.route('/:username').get(async (req, res) => {
  const { username } = req.params;
  const contributionGraphs = await github.fetchContributionGraphs(username, [2021]);
  const contributions = github.parseContributions(contributionGraphs);

  res.status(200).json(contributions);
  //
});

export default router;
