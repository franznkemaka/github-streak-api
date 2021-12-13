import express from 'express';
import { getContributionGraphs } from '../github/graphql';
const router = express.Router();

router.route('/:username').get(async (req, res) => {
  const contributionGraph = await getContributionGraphs(req.params.username);
  res.status(200).json(contributionGraph.data.user.contributionsCollection.contributionCalendar);
  //
});

export default router;
