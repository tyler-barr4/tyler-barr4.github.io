// All site copy and facts live here. Sources: resume, statement of objectives, the six papers and two posters.
// Keep numbers exactly as published. If something changes, edit it here and every page updates.

export const person = {
  name: 'Tyler Barr',
  role: 'Aerospace engineering (astronautics) and applied math',
  school: 'Embry-Riddle Aeronautical University',
  location: 'Daytona Beach, FL',
  email: 'tylerbarr80@gmail.com',
  phone: '(916) 521-4919',
  links: {
    github: 'https://github.com/tyler-barr4',
    linkedin: 'https://www.linkedin.com/in/tbarr4/',
    researchgate: 'https://www.researchgate.net/profile/Tyler-Barr-6',
    cv: '/cv/Tyler_Barr_CV.pdf',
  },
  headline: [
    'I aim to build spacecraft and autonomous systems that travel farther from Earth, work in unfamiliar environments, and return observations that expand what we know about the universe.',
    'I use AI to strengthen planning and adaptation inside physical systems, and I let the dynamics and the optimizer keep authority.',
  ],
  blurb:
    'Senior at Embry-Riddle (B.S. 2027), researcher at XDLab, GNC intern at Turion Space in summer 2026, and an A-10C crew chief in the Idaho Air National Guard since 2021. I am applying to Ph.D. programs to work on autonomous spacecraft and exploration systems.',
};

export type Stat = { value: string; label: string };
export type TradeOff = { chose: string; over: string; why: string; cost: string };
// Posters and other non-paper outputs shown with a project. Papers come from `publications` by topic.
export type PaperLink = { label: string; href?: string };

export type Chapter = {
  /** Short verb phrase for the research map and chapter label. */
  step: string;
  /** Which 3D shot the homepage camera flies to for this chapter. */
  scene: 'debris' | 'shell' | 'rpo' | 'transfer';
  /** Homepage chapter text: what it is, in two or three sentences. */
  story: string;
  /** One line that hands off to the next chapter. */
  next: string;
  /** Two headline numbers shown on the homepage. */
  stats: Stat[];
  /** Related side work that belongs to this thread. */
  related?: { label: string; note: string }[];
};

export type CaseStudy = {
  slug: string;
  chapter: Chapter;
  title: string;
  short: string;
  when: string;
  where: string;
  role: string;
  tags: string[];
  cardStat: Stat;
  stats: Stat[];
  problem: { summary: string; question: string; constraints: string[] };
  architecture: { summary: string; points: string[] };
  tradeoffs: TradeOff[];
  outcomes: { summary: string; points: string[]; caveat?: string };
  papers: PaperLink[];
  code?: { label: string; status: 'soon' | 'live'; href?: string }[];
  note?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: 'catalyst-emocat',
    chapter: {
      step: 'Model the environment',
      scene: 'debris',
      story:
        'I asked how analysts could trace a debris-policy conclusion back to the assumptions behind it. I converted the MOCAT-MC and source-sink models into E-MOCAT and built Catalyst around them, so every answer carries its inputs and evidence. Integrated mitigation cut fragments sharply, yet the population still grew, and I learned to separate mitigation from stabilization. Orbit is a shared environment, so these choices reach every operator and future mission.',
      next: 'Next question: when an AI explains these results to policymakers, how do you know the explanation is right?',
      stats: [
        { value: '−94.8%', label: 'generated fragments, integrated mitigation vs. business as usual' },
        { value: '2.096×', label: 'final vs. initial population, even with the best package' },
      ],
      related: [{ label: 'Economics of orbital carrying capacity', note: 'Coauthor. 2026 Macauley Award winner, Business and Space Policy.' }],
    },
    title: 'Catalyst and E-MOCAT',
    short: 'I built a debris simulator and an AI assistant that answers policy questions only as far as the simulation supports.',
    when: '2026 to present',
    where: 'XDLab, Embry-Riddle',
    role: 'Lead developer. First author, AMOS 2026.',
    tags: ['Monte Carlo propagation', 'Source-sink models', 'Code World Model', 'LoRA', 'Python'],
    cardStat: { value: '−94.8%', label: 'generated fragments under integrated mitigation vs. business as usual' },
    stats: [
      { value: '500', label: 'matched-seed Monte Carlo runs, 10-year horizon' },
      { value: '19,085', label: 'objects in the shared initial state' },
      { value: '2.096×', label: 'final vs. initial population, even with the best package' },
      { value: '98.13%', label: 'assistant answers that held up (vs. 82.50% unadapted)' },
    ],
    problem: {
      summary:
        'People argue about debris rules in qualitative terms and quote simulation outputs without the assumptions behind them. Add a general-purpose language model, and it can blur a simulated result, a proxy number, and a legal requirement into one confident sentence.',
      question:
        'Can I map a policy requirement to bounded model settings, run it through a physics model, and hand back evidence an analyst can audit, with an AI that explains the result but has no say over the physics or the decision?',
      constraints: [
        'Rare events and nonlinear feedback make a single deterministic forecast insufficient, so uncertainty has to come from repeated realizations.',
        'Conditions must share the same initial state and random seeds, or noise swamps the differences between policies.',
        'Every number the assistant states has to trace back to a stored run, a unit, and a solver field.',
        'The assistant cannot launch simulations on its own. An analyst authorizes every new run.',
      ],
    },
    architecture: {
      summary:
        'E-MOCAT converts MIT’s MATLAB MOCAT-MC and source-sink models to Python and extends them. Catalyst wraps E-MOCAT with scenario building, a source registry, provenance tracking, and a fine-tuned Code World Model.',
      points: [
        'Object-resolved Monte Carlo branch: collisions, breakups, disposal, launch, and decay, with an event log for every run.',
        'Shell-level source-sink branch for fast population and governance-parameter sweeps.',
        'TLE-derived initial states and replayed launch traffic. Catalyst stores each run with its configuration, seeds, logs, and metrics.',
        'A source registry maps technical, policy, and economic sources (IADC, ISO 24113, UN long-term sustainability guidelines, FCC rules) to typed requirements.',
        'Assistant: Meta CWM-SFT (32B) with a Catalyst LoRA adapter. I trained the adapter on 1,149 cases and validated it on 188 across 20 task types. Deterministic checks screen its numbers, citations, and run requests.',
      ],
    },
    tradeoffs: [
      {
        chose: 'Matched seeds: 100 seed blocks shared across all five conditions',
        over: 'independent runs per condition',
        why: 'Paired differences cancel most of the stochastic noise, so small policy effects show up and I can test interactions.',
        cost: 'I have to keep all 500 runs in lockstep, and a bad seed affects every condition at once.',
      },
      {
        chose: 'Two model branches with a shared evidence store',
        over: 'one fidelity level for everything',
        why: 'Object-resolved Monte Carlo keeps event-level provenance; source-sink answers sweep questions in a fraction of the time.',
        cost: 'Two code paths to validate against the original MATLAB, and every result needs a branch label.',
      },
      {
        chose: 'The assistant interprets but holds no authority',
        over: 'letting the model run tools and cite freely',
        why: 'Physics comes from E-MOCAT, source meaning from approved records, and the decision from the analyst, so the checks catch a wrong answer from the model before anyone acts on it.',
        cost: 'Slower interaction, and some questions end with “the evidence does not support a conclusion.”',
      },
      {
        chose: 'A small LoRA adapter on a frozen 32B checkpoint',
        over: 'full fine-tuning or prompting alone',
        why: 'I can switch the adapter on and off against the same base model, which makes the matched evaluation possible.',
        cost: 'Gains are specific to this checkpoint; they did not transfer the same way to other model families.',
      },
    ],
    outcomes: {
      summary:
        'Integrated mitigation (full post-mission disposal plus rocket-body passivation) gave the lowest collisions, generated fragments, and final population of the five conditions. It still did not stabilize the environment.',
      points: [
        'Collisions fell from 17.56 to 7.79 per run (−55.6%), generated fragments from 122,617 to 6,403 (−94.8%), and final population from 90,059 to 40,011 (−55.6%).',
        'High post-mission disposal mostly cut collisions; passivation drove almost all of the fragment reduction. Their collision effect was sub-additive (interaction +2.21 events).',
        'Final population still ended at 2.096 times the 19,085-object starting state, so even the best package slowed growth without stabilizing the environment.',
        'On an 800-case held-out benchmark, the adapted assistant gave 785 acceptable answers against 660 for the same model without the adapter (exact McNemar p = 2.4 × 10⁻³⁰).',
      ],
      caveat:
        'These are study-defined conditions over ten years, not forecasts. The benchmark measures answers under fixed evidence; it does not validate the orbital physics.',
    },
    papers: [
      { label: 'Embry-Riddle Discovery Day 2026 poster', href: 'https://commons.erau.edu/discovery-day/db-discovery-day-2026/poster-session/210/' },
    ],
    code: [
      { label: 'Catalyst', status: 'soon' },
      { label: 'E-MOCAT', status: 'soon' },
    ],
  },
  {
    slug: 'verifiable-xai',
    chapter: {
      step: 'Check the AI',
      scene: 'shell',
      story:
        'I asked whether an opaque model can give a scientifically supportable explanation without exposing its hidden reasoning. I fixed the evidence each model could see, then changed one thing at a time: removed evidence, swapped a fact, added irrelevant metadata. Adaptation made explanations hold up far more often, but the effect depended on the model family, so I argue for validating each model on its own.',
      next: 'Analysis says what should happen in orbit. The next project is a spacecraft that has to do it.',
      stats: [
        { value: '82.5 → 98.1%', label: 'explanations that held up, before and after adaptation (800 cases)' },
        { value: '133 / 8', label: 'cases that improved / regressed' },
      ],
      related: [{ label: 'LLM risk management in orbital capacity', note: 'First author. Abstract accepted, AIAA SciTech 2027.' }],
    },
    title: 'Verifiable AI explanations',
    short: 'I tested whether an AI’s explanation of a simulation follows the evidence, without looking inside the model.',
    when: '2025 to present',
    where: 'XDLab, Embry-Riddle',
    role: 'First author. Molly K. Macauley Award finalist, 2026.',
    tags: ['Explainable AI', 'Evaluation design', 'Contrastive tests', 'Statistics'],
    cardStat: { value: '82.5 → 98.1%', label: 'explanations that held up against their evidence' },
    stats: [
      { value: '800', label: 'fixed cases in eight sections, adapter off vs. on' },
      { value: '133 / 8', label: 'cases improved / regressed' },
      { value: '720', label: 'responses in the cross-model study (CWM, Gemma, Nemotron)' },
      { value: '0', label: 'fabricated artifact IDs across all 720' },
    ],
    problem: {
      summary:
        'Language models explain debris simulations fluently, but a correct-looking answer does not show what it relied on. It could be the evidence, or something irrelevant that happened to be in the prompt.',
      question:
        'Can outside tests make an opaque model’s explanation behavior measurable, and does Catalyst’s adaptation make that behavior follow the evidence more closely?',
      constraints: [
        'I had no access to the model’s internal reasoning, so I measured everything from its outputs.',
        'Prompts, evidence, case order, and decoding stay fixed across configurations, so only one thing changes at a time.',
        'The models never see the scoring references.',
        'A justified “the evidence does not support that” counts as a success, and an unneeded refusal counts as a failure.',
      ],
    },
    architecture: {
      summary:
        'Each case runs under an evidence contract. The model sees the task, the allowed evidence, and the output requirements; it never sees the protected references, required or prohibited claims, or the outcome criterion.',
      points: [
        'Test 1: one CWM checkpoint with the Catalyst adapter off (reference) or on (adapted), 800 cases, 100 per section.',
        'Test 2: 120 cases on CWM, Gemma, and Nemotron, each with and without its adapter (720 responses).',
        'Contrast probes: remove evidence, change one fact, ask about a cause, add irrelevant metadata, or repeat the question.',
        'Software checks objective fields (verdict, value and unit, direction, cause, uncertainty, provenance, limits); a reviewer applies a fixed five-part rubric to cases that need judgment.',
        'I store every response with its prompt, visible evidence, and requirement, so anyone can recheck a judgment.',
      ],
    },
    tradeoffs: [
      {
        chose: 'Black-box contrastive testing',
        over: 'mechanistic interpretability',
        why: 'It works on any model you can call, including ones whose weights you cannot inspect, and it measures what an analyst actually sees.',
        cost: 'It shows how answers respond to the evidence, not why the model produced them.',
      },
      {
        chose: 'Counting justified non-answers as success',
        over: 'scoring only direct answers',
        why: 'An assistant that guesses when evidence is missing is worse than one that says so. The rubric has to reward restraint.',
        cost: 'Needs a careful audit of which cases truly lack evidence; 500 of the 800 test this boundary.',
      },
      {
        chose: 'Greedy decoding and fixed case order',
        over: 'sampled outputs',
        why: 'Repeatability: the repeated cases came back byte for byte, so differences come from the configuration, not chance.',
        cost: 'Says nothing about behavior under the sampling settings people often use in practice.',
      },
    ],
    outcomes: {
      summary:
        'Adaptation raised the success rate from 82.50% to 98.13% and improved every one of the eight sections. Across model families the effect was not universal.',
      points: [
        '141 cases changed outcome: 133 improved and 8 regressed (exact McNemar p = 2.4 × 10⁻³⁰).',
        'Largest gain was orbital and collision questions (69 → 99 per 100). Tool and scenario execution gained least (88 → 91) and is the clearest weak spot.',
        'Value-and-unit correctness rose for CWM (89 → 114 of 120) but fell for Gemma (105 → 93).',
        'No fabricated artifact identifiers in any of the 720 cross-model responses.',
        'The strictest contrast probes, where every field must be right at once, passed at most 1 of 30, so the answers do not yet fully track the evidence.',
      ],
      caveat:
        'One checkpoint and adapter in Test 1, a single reviewer on semantic cases, and descriptive cross-family comparisons. Next is multi-reviewer replication and model-specific validation.',
    },
    papers: [],
  },
  {
    slug: 'adaptive-rendezvous',
    chapter: {
      step: 'Act up close',
      scene: 'rpo',
      story:
        'A chaser has to reach a noncooperative target while a guard spacecraft tries to stop it. I asked whether adaptation could improve performance without taking maneuver authority away from the numerical controller. A supervisory layer retunes the model predictive controller, and the controller still computes every thrust command. I learned that autonomy adds the most when it extends a physically grounded system instead of replacing it.',
      next: 'Getting close is the last step. Getting there in the first place is a trajectory problem.',
      stats: [
        { value: '94.0%', label: 'success over a 1,000-run Monte Carlo campaign' },
        { value: '72%', label: 'adaptive MPC success, vs. 60% fixed and 28% naive' },
      ],
      related: [{ label: 'Explainable and adaptive AI in space differential games', note: 'First author. AAS 26-896, oral presentation.' }],
    },
    title: 'Adaptive rendezvous autonomy',
    short: 'A chaser closes on a defended, noncooperative target while an adaptive layer tunes the controller and never sends thrust commands itself.',
    when: '2025 to 2026',
    where: 'XDLab, Embry-Riddle',
    role: 'Rendezvous guidance lead. Coauthor (JSR, under review). First author, AAS 26-896.',
    tags: ['Clohessy–Wiltshire', 'MPC', 'Convex QP', 'Cross-entropy method', 'Genetic algorithms'],
    cardStat: { value: '94.0%', label: 'success over a 1,000-run Monte Carlo campaign' },
    stats: [
      { value: '72%', label: 'adaptive MPC success (vs. 60% fixed, 28% naive)' },
      { value: '940 / 1000', label: 'successful Monte Carlo runs' },
      { value: '1.6%', label: 'runs where the Guard captured the pursuer' },
      { value: '~8 s', label: 'action latency that limited the LLM operator' },
    ],
    problem: {
      summary:
        'In the Capture the Satellite scenario (KSPDG, 2026 AIAA competition), a pursuer must get within 5 m of a target while a Guard with an undisclosed policy tries to come within 10 m of the pursuer. No single maneuver solves it. Every decision trades progress against safety, timing, and how the other spacecraft responds.',
      question:
        'Can adaptation improve rendezvous performance without moving maneuver authority outside the numerical control structure?',
      constraints: [
        'Clohessy–Wiltshire relative dynamics about a circular orbit, in the LVLH frame.',
        'Per-axis actuator limits and rate limits on control changes.',
        'A predictive keep-out zone around the Guard, which has to stay feasible when geometry gets tight.',
        'Real-time ticks: the QP has to solve every step.',
      ],
    },
    architecture: {
      summary:
        'An inner receding-horizon MPC solves a convex QP each tick and applies only the first control. An outer supervisory layer changes the MPC’s parameters, not its commands.',
      points: [
        'My earlier phasing and rendezvous guidance: burn timing, maneuver sequencing, and delta-v budgeting, with a genetic algorithm tuning guidance parameters across repeated scenarios.',
        'Offline: a cross-entropy method search over a bounded parameter set (horizons, tracking weights, keep-out weight, minimum separation, terminal weights, barrier gains).',
        'Online: geometry rules. Minimum separation inflates as the Guard closes; tracking weights step up at 500, 200, and 80 m from the target.',
        'If the QP goes infeasible, the keep-out weight relaxes in stages: 0.5×, then 0.3×, and zero only as a last resort.',
        'For comparison, a top-down agent (GUIDE) put a language model directly at the action interface and evolved a rule playbook offline.',
      ],
    },
    tradeoffs: [
      {
        chose: 'Adapt interpretable parameters',
        over: 'learn thrust commands end to end',
        why: 'Every command is still a QP solution that respects actuator and safety limits, and you can read off why the controller changed.',
        cost: 'Adaptation can only reach what the parameter set can express.',
      },
      {
        chose: 'Soft keep-out constraint with slack and staged relaxation',
        over: 'a hard constraint',
        why: 'A hard keep-out constraint can make the QP infeasible exactly when the Guard is close, which is when the controller most needs an answer.',
        cost: 'Safety becomes a weighted objective near the Guard, so minimum separation inflation has to backstop it.',
      },
      {
        chose: 'Rule-based online updates',
        over: 'a learned online policy',
        why: 'Deterministic, inspectable, and cheap enough to run every tick.',
        cost: 'Less general. New geometries may need new rules.',
      },
      {
        chose: 'Bottom-up hybrid',
        over: 'top-down reasoning agent at the controls',
        why: 'In the comparison, where adaptation sat and how fast it could act mattered more than model size. The LLM operator often spotted the opening and missed it because the maneuver came about 8 seconds late.',
        cost: 'Less strategic variety than the reasoning agent shows.',
      },
    ],
    outcomes: {
      summary:
        'Adaptive MPC beat both fixed-parameter and naive MPC, and held up in a 1,000-run campaign.',
      points: [
        '25-run ablation: 28% success for naive MPC, 60% with fixed tuned parameters, 72% with adaptive parameters.',
        '1,000-run Monte Carlo: 940 successes (94.0%), 44 timeouts (4.4%), 16 Guard captures (1.6%).',
        'The keep-out weight and minimum separation dominated online adaptation.',
        'From the comparison with GUIDE, three design principles: integrate adaptation above an authoritative dynamics and constraint layer; refine against solver feedback instead of predicting once; architecture matters more than model scale.',
      ],
      caveat:
        'The two architectures used different scenarios and metrics, so I compare them as design lessons, not as a performance ranking.',
    },
    papers: [],
  },
  {
    slug: 'multiphase-trajectory-optimization',
    chapter: {
      step: 'Plan the path',
      scene: 'transfer',
      story:
        'At Turion Space, I found that a nonlinear trajectory optimizer could report convergence while joining adjacent phases discontinuously. I traced the problem to incomplete state linkage and inconsistent frame handling, then rebuilt the transition logic for any number of phases. I now treat convergence, physical consistency, and recoverability as separate claims, and I want evidence for each.',
      next: 'Where this is heading: spacecraft that plan and act on their own, far from Earth.',
      stats: [
        { value: 'Any N', label: 'phases, each boundary linked explicitly' },
        { value: 'Continuous', label: 'phase boundaries, verified to numerical precision' },
      ],
    },
    title: 'Multiphase trajectory optimization',
    short: 'A trajectory optimizer reported convergence while its phases did not line up. I found out why and rebuilt the phase linkage.',
    when: 'Summer 2026',
    where: 'Turion Space',
    role: 'GNC Engineer Intern',
    tags: ['Pseudospectral collocation', 'YAPSS', 'IPOPT', 'Nonlinear optimal control', 'Python'],
    cardStat: { value: 'N phases', label: 'linked with continuity verified to numerical precision' },
    stats: [
      { value: 'YAPSS + IPOPT', label: 'direct pseudospectral collocation in Python' },
      { value: 'Any N', label: 'phases, each boundary linked explicitly' },
      { value: 'Continuous', label: 'phase boundaries, verified to numerical precision' },
    ],
    problem: {
      summary:
        'A nonlinear multiphase optimizer for rendezvous and proximity operations could report convergence while joining adjacent phases discontinuously. The solver said “done,” but the spacecraft could not have flown the result.',
      question: 'Why does a converged solution break at phase boundaries, and how do you make convergence mean something?',
      constraints: [
        'Arbitrary numbers of phases, each with its own boundary conditions.',
        'Frame transformations between phases had to be consistent.',
        'Terminal constraints on the final state.',
        'The tool had to tell a truly infeasible mission apart from a solver artifact.',
      ],
    },
    architecture: {
      summary:
        'I traced the problem to incomplete state linkage and inconsistent frame handling, then rebuilt the transition logic so it works for any number of phases.',
      points: [
        'Python with YAPSS and IPOPT, using direct pseudospectral collocation.',
        'Explicit linkage constraints on the full state at every phase boundary, after a consistent frame transformation.',
        'Terminal constraints, mesh refinement, and continuation for hard cases.',
        'Restart logic and explicit infeasibility diagnostics, so a failed solve tells you which constraint broke.',
      ],
    },
    tradeoffs: [
      {
        chose: 'Linkage enforced inside the NLP',
        over: 'stitching phases after the solve',
        why: 'Continuity becomes something the solver has to satisfy rather than something you hope for.',
        cost: 'A larger problem with more constraints for IPOPT to handle.',
      },
      {
        chose: 'Continuation and restarts',
        over: 'one cold-start solve',
        why: 'Hard mission structures converge from a sequence of easier problems, and a failed run can recover.',
        cost: 'Longer run times and more solver logic to test.',
      },
      {
        chose: 'Diagnostics as a first-class output',
        over: 'a pass/fail flag',
        why: 'Feasible trajectories and solver artifacts look the same from a single exit code.',
        cost: 'More code to maintain.',
      },
    ],
    outcomes: {
      summary:
        'I validated the rebuilt framework across several mission structures, delivered it as a reusable tool, and presented the results to Turion’s engineering team.',
      points: [
        'Phase continuity measured to numerical precision across arbitrary phase counts.',
        'Infeasibility diagnostics separated feasible trajectories from solver artifacts.',
        'Since then I treat convergence, physical consistency, and recoverability as separate claims, and I want evidence for each one.',
      ],
    },
    papers: [],
    note: 'I describe this work at the method level only. No Turion data, mission details, or figures appear here.',
  },
];

export type Pub = {
  authors: string;
  title: string;
  venue: string;
  year: string;
  status: string;
  kind: 'journal' | 'conference' | 'award' | 'abstract';
  href?: string;
  linkLabel?: string;
  first?: boolean;
  topic?: string;
};

// Papers not yet in proceedings or on arXiv link to the ResearchGate profile, where the PDFs are posted.
const RG = 'https://www.researchgate.net/profile/Tyler-Barr-6/research';
export const publications: Pub[] = [
  {
    authors: 'L. Sportelli, T. Barr, C. Kilic, D. Wu',
    title: 'AI-Augmented Model Predictive Control for Safe and Adaptive Rendezvous and Proximity Operations',
    venue: 'arXiv:2607.16630; under review at the Journal of Spacecraft and Rockets',
    year: '2026',
    status: 'Preprint · under review',
    kind: 'journal',
    href: 'https://arxiv.org/abs/2607.16630',
    linkLabel: 'arXiv',
    topic: 'adaptive-rendezvous',
  },
  {
    authors: 'T. Barr, A. Carrasco, L. Sportelli, M. Storey-Matsutani, G. Lavezzi, V. Rodriguez-Fernandez, R. Linares, C. Kilic, D. Wu',
    title: 'Design Principles for Explainable and Adaptive AI in Space Differential Games',
    venue: 'AAS Paper 26-896, AAS/AIAA Astrodynamics Specialist Conference, Whistler, BC',
    year: '2026',
    status: 'Oral presentation · proceedings pending',
    href: RG,
    linkLabel: 'ResearchGate',
    kind: 'conference',
    first: true,
    topic: 'adaptive-rendezvous',
  },
  {
    authors: 'T. Barr, K. Adams, D. Wu',
    title: 'A Repeatable Code World Model Assistant for Orbital Debris Governance and Mitigation',
    venue: 'Advanced Maui Optical and Space Surveillance Technologies Conference (AMOS)',
    year: '2026',
    status: 'Published',
    kind: 'conference',
    href: 'https://doi.org/10.64861/VQVF2441',
    linkLabel: 'DOI',
    first: true,
    topic: 'catalyst-emocat',
  },
  {
    authors: 'K. Adams, T. Barr, D. Wu',
    title: 'Simulation-Driven Space Debris Governance Using E-MOCAT, Space Situational Awareness, and Catalyst for Quantitative Policy Assessment',
    venue: 'Advanced Maui Optical and Space Surveillance Technologies Conference (AMOS)',
    year: '2026',
    status: 'Published',
    kind: 'conference',
    href: 'https://doi.org/10.64861/UTKE8310',
    linkLabel: 'DOI',
    topic: 'catalyst-emocat',
  },
  {
    authors: 'T. Barr, K. Adams, D. Wu',
    title: 'Verifiable AI Explanations for Orbital Capacity and Space Sustainability Analysis',
    venue: 'AAS Molly K. Macauley Award, Science and Engineering category',
    year: '2026',
    status: 'Finalist (one of five) · proceedings pending',
    href: RG,
    linkLabel: 'ResearchGate',
    kind: 'award',
    first: true,
    topic: 'verifiable-xai',
  },
  {
    authors: 'K. Adams, T. Barr, D. Wu',
    title: 'The Economic Effects of Orbital Carrying Capacity in Low Earth Orbit: A Shell-Level Framework for Congestion, Risk, and Access',
    venue: 'AAS Molly K. Macauley Award, Business and Space Policy category',
    year: '2026',
    status: 'Award winner · proceedings pending',
    href: RG,
    linkLabel: 'ResearchGate',
    kind: 'award',
    topic: 'catalyst-emocat',
  },
  {
    authors: 'T. Barr, D. Wu',
    title: 'LLM Risk Management in Orbital Capacity and Space Sustainability',
    venue: 'AIAA SciTech Forum 2027',
    year: '2027',
    status: 'Abstract accepted · manuscript in preparation',
    href: RG,
    linkLabel: 'ResearchGate',
    kind: 'abstract',
    first: true,
    topic: 'verifiable-xai',
  },
];

export type LogEntry = {
  when: string;
  org: string;
  title: string;
  where?: string;
  points: string[];
  kind: 'industry' | 'research' | 'military' | 'education';
};

export const flightLog: LogEntry[] = [
  {
    when: 'Summer 2026',
    org: 'Turion Space',
    title: 'GNC Engineer Intern',
    points: [
      'Built GNC tools for multiphase rendezvous and proximity operations: trajectory optimization, maneuver planning, and nonlinear optimal-control analysis.',
      'Implemented and validated pseudospectral optimization for multisegment trajectories with phase continuity, boundary constraints, and frame transformations.',
    ],
    kind: 'industry',
  },
  {
    when: '2025 to present',
    org: 'XDLab, Embry-Riddle',
    title: 'Undergraduate Researcher',
    points: [
      'I study spacecraft autonomy, astrodynamics, space situational awareness, and explainable AI through simulation experiments with reproducible analysis.',
      'Seven papers and abstracts since 2025, four as first author.',
    ],
    kind: 'research',
  },
  {
    when: '2021 to present',
    org: 'Idaho Air National Guard',
    title: 'Staff Sergeant · A-10C Crew Chief',
    points: [
      'Maintain and inspect A-10 airframe, hydraulics, electrical, propulsion, and avionics systems for flight readiness.',
      'Troubleshoot from schematics and precision measurements; mentor Airmen and coordinate training and maintenance at home station and deployed (80+ personnel, 2,000+ flight hours supported).',
    ],
    kind: 'military',
  },
  {
    when: '2023 to 2027',
    org: 'Embry-Riddle Aeronautical University',
    title: 'B.S. Aerospace Engineering (Astronautics), Minor in Applied Mathematics',
    points: ['GPA 3.80 / 4.0 · Dean’s List, 2023 to present.'],
    kind: 'education',
  },
  {
    when: '2021 to 2023',
    org: 'Sierra College',
    title: 'A.S. Computer Science',
    points: ['GPA 3.80 / 4.0 · President’s List.'],
    kind: 'education',
  },
];

export const toolkit: { domain: string; items: string[] }[] = [
  {
    domain: 'Guidance, navigation & control',
    items: ['Clohessy–Wiltshire relative motion', 'Model predictive control (convex QP)', 'Control barrier functions', 'Phasing & rendezvous guidance', 'Delta-v budgeting', 'Maneuver sequencing'],
  },
  {
    domain: 'Trajectory optimization',
    items: ['Direct pseudospectral collocation', 'YAPSS', 'IPOPT', 'Mesh refinement & continuation', 'Genetic algorithms', 'Cross-entropy method / CMA-ES'],
  },
  {
    domain: 'Orbital environment simulation',
    items: ['E-MOCAT (MOCAT-MC & source-sink)', 'Monte Carlo propagation', 'TLE-derived scenarios', 'KSPDG / Kerbal Space Program'],
  },
  {
    domain: 'AI & evaluation',
    items: ['LoRA fine-tuning', 'Code World Models (32B)', 'Evidence-contract evaluation', 'Paired statistics (McNemar, Wilson, Holm)'],
  },
  {
    domain: 'Software',
    items: ['Python', 'MATLAB', 'Java'],
  },
  {
    domain: 'Hardware & design',
    items: ['CATIA V5', 'SolidWorks', '3D printing', 'Drafting', 'Metalwork & woodworking', 'A-10C systems maintenance'],
  },
];

export type Talk = { when: string; event: string; what: string; where?: string; kind: 'talk' | 'poster' | 'service' | 'upcoming'; href?: string; linkLabel?: string };

export const talks: Talk[] = [
  { when: 'Jan 2027', event: 'AIAA SciTech Forum', what: 'LLM risk management in orbital capacity (abstract accepted)', kind: 'upcoming' },
  { when: 'Fall 2026', event: 'Embry-Riddle AI Day', what: 'Poster: “Meowthful: An Evidence-Grounded AI Assistant for Space Sustainability”', where: 'Daytona Beach, FL', kind: 'poster', href: '/posters/Barr_Meowthful_AI_Day_2026.pdf', linkLabel: 'Poster (PDF)' },
  { when: '2026', event: 'von Braun Space Exploration Symposium', what: 'Poster: “Verifiable AI Explanations for Orbital Capacity and Space Sustainability Analysis” (Macauley Award finalist)', kind: 'poster' },
  { when: 'Sep 2026', event: 'AMOS Conference', what: 'Talk in the AI for SDA Applications session: Catalyst’s Code World Model assistant', where: 'Maui, HI', kind: 'talk' },
  { when: '2026', event: 'AAS/AIAA Astrodynamics Specialist Conference', what: 'Oral presentation, AAS 26-896: design principles for adaptive AI in space differential games', where: 'Whistler, BC', kind: 'talk' },
  { when: '2026', event: 'Embry-Riddle Discovery Day', what: 'Poster: “Catalyst: A Unified Framework for Orbital Debris Risk, Conjunction Analysis, and Space Policy”', where: 'Daytona Beach, FL', kind: 'poster', href: 'https://commons.erau.edu/discovery-day/db-discovery-day-2026/poster-session/210/', linkLabel: 'Poster on Scholarly Commons' },
  { when: '2026', event: 'ASTRA Workshop', what: 'Co-chair. Two-day workshop on AI, space robotics, orbital operations, and sustainability; ran the Student Research Showcase and hosted the opening and closing sessions.', where: 'Daytona Beach, FL', kind: 'service' },
];

export const honors: string[] = [
  'Molly K. Macauley Award finalist, Science and Engineering (2026)',
  'Molly K. Macauley Award winner, Business and Space Policy, as coauthor (2026)',
  'Sigma Xi, associate member (2026 to present)',
  'Embry-Riddle Dean’s List (2023 to present)',
];
