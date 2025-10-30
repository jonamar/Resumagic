import theme from '../theme.js';

// No need for __dirname here; keep imports minimal

type QnaBlock = {
  title: string;
  result: string;
  action: string;
  proof: string;
  secondary?: string;
};

function getDefaultBlocks(): QnaBlock[] {
  return [
    {
      title: '[Baze] Subscription turnaround',
      result: '+54% CLTV; 1.8× conversion; −24% churn',
      action: 'Personalized plans to habits → bundled offers → fixed at‑home test experience',
      proof: '~$20M ARR on $11.3M; Seed→A→acq',
      secondary: '82% daily adherence; 73% fixed deficiencies (3 months)',
    },
    {
      title: '[Wikimedia] FOSS scaling (~40→104)',
      result: '104 deployments; 289K expert users; 41% CAGR',
      action: 'Public metrics → partners over one‑offs → steady release rhythm',
      proof: '€30.54M funding unlocked; 98% retention',
      secondary: 'Serves 2B+ linked data facts; powers Wikipedia/Apple Maps',
    },
    {
      title: '[Founderland] Values‑aligned VC marketplace',
      result: 'CA $14.1M VC enabled; 600+ founders; 25+ countries',
      action: 'Clear goals → shipped matching tools → weekly operating cadence',
      proof: 'High‑trust matches; repeatable throughput',
      secondary: '3 directs + 6 volunteers; firefighting → shipping',
    },
    {
      title: '[People] Team building and retention',
      result: '92% retention across 22 hires; women‑majority eng team; 2 promos',
      action: 'Inclusive hiring → clear growth paths → consistent 1:1s/rituals',
      proof: '100% retention in 10‑person team during 18‑month leadership leave',
      secondary: 'Co‑founded DEI CoP; managed 6 directs',
    },
  ];
}

function routeQuestionToBlocks(question: string): QnaBlock[] {
  const q = question.toLowerCase();
  const all = getDefaultBlocks();

  // Simple heuristics for 80/20 routing
  if (/lemon|turnaround|churn|conversion|subscription|cltv/.test(q)) return [all[0] as QnaBlock];
  if (/scale|deploy|foss|open[- ]?source|wikibase|platform/.test(q)) return [all[1] as QnaBlock];
  if (/marketplace|community|founderland|founders|invest(or|ment)/.test(q)) return [all[2] as QnaBlock];
  if (/team|retain|retention|hire|culture|dei|people|promotion/.test(q)) return [all[3] as QnaBlock];

  // If ambiguous, return top two that most interviews ask about
  return [all[0] as QnaBlock, all[1] as QnaBlock];
}

function printBlock(block: QnaBlock): void {
  console.log(`- ${block.title}`);
  console.log(`  - Result: ${block.result}`);
  console.log(`  - Action: ${block.action}`);
  console.log(`  - Proof: ${block.proof}`);
  if (block.secondary) {
    console.log(`  - Secondary: ${block.secondary}`);
  }
  console.log('');
}

async function main() {
  // Echo a minimal header for live use
  console.log(`${theme.messages.emojis.start} QnA jogger`);

  // Combine all args after script name into a single question string
  const rawArgs = process.argv.slice(2);
  const question = rawArgs.join(' ').trim();

  // No flags; 80/20 default: if no question, show all
  const blocks = question ? routeQuestionToBlocks(question) : getDefaultBlocks();
  blocks.forEach(printBlock);
}

main().catch((err) => {
  console.error(`${theme.messages.emojis.error} /qna failed:`, err?.message || String(err));
  process.exit(1);
});


