import { getMatches } from './src/services/matches.service';

(async () => {
  try {
    const matches = await getMatches({ date: '20230528' });
    console.log(JSON.stringify(matches, null, 2).substring(0, 1000));
  } catch (err) {
    console.error(err);
  }
})();
