// Try many URL variants to find the correct live fixtures endpoint
const urlVariants = [
  'https://pub.fotmob.com/prod/db/api/fixture/live',
  'https://pub.fotmob.com/prod/db/api/fixtures/live', 
  'https://pub.fotmob.com/prod/db/fixture/live',
  'https://pub.fotmob.com/prod/fixtures/live',
  'https://pub.fotmob.com/fixtures/live',
  'https://pub.fotmob.com/prod/db/api/live',
  'https://pub.fotmob.com/api/v1/fixture/live',
  'https://pub.fotmob.com/prod/v1/fixture/live',
];

for (const internalUrl of urlVariants) {
  const fullUrl = `https://www.fotmob.com/api/data/liveFixtures?url=${encodeURIComponent(internalUrl)}`;
  try {
    const res = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    const text = await res.text();
    if (res.status === 200) {
      console.log('✅ SUCCESS:', internalUrl);
      console.log(text.substring(0, 400));
      break;
    } else {
      console.log(`${res.status}: ${internalUrl}`);
    }
  } catch(e) {
    console.log(`ERR: ${internalUrl} → ${e}`);
  }
}

// Also try hitting pub.fotmob.com directly
console.log('\n--- Trying pub.fotmob.com directly ---');
try {
  const res = await fetch('https://pub.fotmob.com/prod/db/api/fixture/live', {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' }
  });
  const text = await res.text();
  console.log('Direct status:', res.status, text.substring(0, 300));
} catch(e) {
  console.log('Direct err:', e);
}
