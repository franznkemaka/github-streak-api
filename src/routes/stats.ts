import express from 'express';
const router = express.Router();

router.route('/:username').get((req, res) => {
  res.status(200).json({
    username: req.params.username,
  });
  //
});

export default router;
