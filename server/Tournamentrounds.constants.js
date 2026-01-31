/**
 * Tournament Round Constants
 * Contains PDF links, questions, contexts, and ground truth answers for all 5 rounds
 * Each round tests different aspects of RAG capabilities
 */

const TOURNAMENT_ROUNDS = {
  1: {
    roundNumber: 1,
    name: "RAG Fundamentals (NeurIPS 2020)",
    pdf_url:
      "https://proceedings.neurips.cc/paper/2020/file/6b493230205f780e1bc26945df7481e5-Paper.pdf",
    description:
      "Understanding the foundational RAG paper: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    questions: [
      "What are the two main components that RAG combines, and what pre-trained models are used for each component?",
      "What is the key difference between RAG-Sequence and RAG-Token models in how they handle retrieved documents?",
      "Which Wikipedia dump and how many documents were used for the non-parametric memory in the RAG experiments?",
      "On which three open-domain QA datasets did RAG achieve state-of-the-art results according to the paper?",
      "What percentage of cases did the top retrieved document come from a gold article in the FEVER fact verification task?",
    ],
    context: `The RAG paper introduces Retrieval-Augmented Generation, which combines two components: a retriever (using Dense Passage Retriever/DPR with BERT) and a generator (using BART-large with 400M parameters). The parametric memory is a pre-trained seq2seq transformer, and the non-parametric memory is a dense vector index of Wikipedia.
  RAG-Sequence uses the same retrieved document to generate the complete output sequence, treating it as a single latent variable. RAG-Token can draw a different latent document for each target token, allowing content from multiple documents.
The experiments used the December 2018 Wikipedia dump, split into 21 million disjoint 100-word chunks. They built a FAISS index with a Hierarchical Navigable Small World approximation for fast retrieval.
RAG set state-of-the-art results on three open-domain QA tasks: Natural Questions (NQ), WebQuestions (WQ), and CuratedTrec (CT). It also performed strongly on TriviaQA.
In the FEVER fact verification task analysis, the top retrieved document came from a gold article in 71% of cases, and a gold article was present in the top 10 retrieved articles in 90% of cases.`,
    groundTruths: [
      "RAG combines two main components: (1) a retriever p_η(z|x) using Dense Passage Retriever (DPR) based on BERT, and (2) a generator p_θ(y_i|x,z,y_{1:i-1}) using BART-large, a pre-trained seq2seq transformer with 400M parameters. The parametric memory is the BART generator and the non-parametric memory is a dense vector index of Wikipedia.",
      "RAG-Sequence uses the same retrieved document to predict each target token and generate the complete sequence, treating the retrieved document as a single latent variable. RAG-Token can predict each target token based on a different document, drawing a different latent document for each token and marginalizing accordingly, allowing the generator to choose content from several documents.",
      "The experiments used the December 2018 Wikipedia dump. Each Wikipedia article was split into disjoint 100-word chunks, making a total of 21 million (21M) documents for the non-parametric knowledge source.",
      "RAG achieved state-of-the-art results on three open-domain QA datasets: Natural Questions (NQ), WebQuestions (WQ), and CuratedTrec (CT). The paper also mentions strong performance on TriviaQA.",
      "In the FEVER fact verification task, the top retrieved document came from a gold article in 71% of cases. Additionally, a gold article was present in the top 10 retrieved articles in 90% of cases.",
    ],
    difficulty: "medium",
    timeout: 120000,
  },

  2: {
    roundNumber: 2,
    name: "Agentic AI - Basic Understanding Round (Corrected)",
    pdf_url: "https://www.aibattlearena.in/round2.pdf",
    description:
      "Factual retrieval questions for the Agentic AI systematic review paper - corrected based on actual paper content",

    questions: [
      "According to Figure 1, what are the six key aspects of Agentic AI mentioned in the paper?",
      "What is the primary difference between the Copilot model and the Autopilot model in AI systems?",
      "Which four industries are mentioned as application areas for Agentic AI in Section 1.1.1?",
      "In which decade did the deep learning revolution occur, and what were the two key technological milestones mentioned?",
      "According to the McKinsey report cited in the paper, what percentage improvement in productivity can AI-driven automation achieve in some industries?",
      "What are the three main challenges associated with Agentic AI implementation mentioned in Section 1.2?",
      "Name at least three commercial AI tools or platforms and three open-source solutions discussed in Section 7.",
    ],

    context:
      "This paper presents a systematic review of Agentic AI and its role in shaping a smart future. It explores key aspects including autonomy, goal-oriented behavior, environmental interaction, learning capability, workflow optimization, and multi-agent systems. The paper discusses the evolution from assisted 'Copilot' models to autonomous 'Autopilot' models, examines hierarchical agent architectures, and reviews various commercial tools (LangGraph, CrewAI, IBM Watson, Amazon SageMaker) and open-source solutions (AutoGen, AutoGPT, TensorFlow, Llama). It addresses challenges including data security, privacy concerns, ethical issues, and workforce transformation while highlighting applications across energy, transportation, healthcare, and finance sectors.",

    groundTruths: [
      "According to Figure 1, the six key aspects of Agentic AI are: (1) Autonomy - the ability to operate independently and make decisions without direct human intervention, (2) Goal-oriented behavior - pursuing specific objectives and optimizing actions to achieve desired outcomes, (3) Environmental interaction (Interaction with the environment) - perceiving and adapting to changes in surroundings, (4) Learning capability (Ability to learn) - improving performance over time through machine learning or reinforcement learning, (5) Workflow optimization - combining language understanding, reasoning, planning, and decision-making to enhance business processes, and (6) Multi-agent systems (Multiagent dialog and system) - enabling communication among agents for creating complex workflows.",

      "The Copilot model functions as an AI assistant that supports human operators within a 'human-in-the-loop' framework, providing recommendations and requiring human oversight. The Autopilot model represents fully autonomous AI systems capable of operating independently without human intervention, making decisions and executing tasks with minimal or no human supervision.",

      "The four industries mentioned for Agentic AI applications in Section 1.1.1 are: (1) Energy - optimizes energy consumption, predicts demand, and enhances the efficiency of renewable resources, (2) Transportation - improves route planning, reduces delivery times, and enhances supply chain logistics, (3) Healthcare - aids in medical diagnosis, personalized treatment plans, and patient data management, and (4) Finance - analyzes market trends, assesses investment risks, and optimizes financial decision-making.",

      "The deep learning revolution occurred in the 2010s. The two key technological milestones mentioned were: (1) The introduction of AlexNet, which demonstrated the power of convolutional neural networks (CNNs) in image recognition, and (2) The development of the Transformer architecture, which revolutionized Natural Language Processing (NLP), enabling context-aware language models and multimodal processing.",

      "According to a McKinsey report cited in Section 3, AI-driven automation can improve productivity by up to 40% in some industries by reducing manual workloads and optimizing workflows.",

      "The three main challenges associated with Agentic AI implementation mentioned in Section 1.2 are: (1) Data Security & Privacy - AI systems process vast amounts of sensitive data, making them vulnerable to breaches, requiring stringent data protection policies and compliance with legal frameworks, (2) Ethical & Regulatory Concerns - Autonomous AI decisions can have unintended consequences, necessitating transparent AI governance models and ethical AI principles, and (3) Workforce Transformation - Automation raises concerns about job displacement, requiring proactive workforce reskilling initiatives and AI-human collaboration strategies.",

      "Commercial AI tools/platforms discussed in Section 7 include: LangGraph (designed for customer support with statefulness and streaming), CrewAI (tailored for Fortune 500 companies with no-code tools), IBM Watson (provides AI services for healthcare, finance, and retail with NLP and predictive analytics), and Amazon SageMaker (streamlines ML model creation and deployment). Open-source solutions include: AutoGen (facilitates multi-agent collaboration), AutoGPT (leverages GPT-4 for autonomous task performance), TensorFlow (library for building ML models), and Llama (Meta's open-source LLMs).",
    ],

    difficulty: "basic",
    timeout: 120000,
  },

  3: {
    roundNumber: 3,
    name: "Agentic AI - Medium Comprehension Round",
    pdf_url: "https://arxiv.org/pdf/2510.25445",
    description:
      "Medium-difficulty questions requiring synthesis across sections, understanding of relationships, and multi-hop retrieval from the Agentic AI systematic review paper",
    questions: [
      "What is 'conceptual retrofitting' and why do the authors argue it's problematic when applied to modern LLM-based agentic systems?",
      "Describe the two independent dimensions used in the dual-paradigm taxonomy framework (Figure 2) for categorizing agentic systems.",
      "According to the paper's historical timeline (Figure 1), which five distinct eras mark the evolution of AI, and in which era did the Transformer architecture emerge?",
      "What are the three orchestration mechanisms used by modern neural agentic frameworks according to Table 3, and name one framework that exemplifies each mechanism?",
      "Based on Table 6, which architectural paradigm dominates in healthcare applications and what are the two primary constraints that drive this choice?",
      "What was the final corpus size for the systematic PRISMA-based review, and why were 12 additional papers included beyond the primary search results?",
      "According to the paper, what is the fundamental operational difference between how symbolic systems and neural systems achieve multi-agent coordination?",
    ],

    context: `This survey introduces a dual-paradigm framework categorizing agentic systems into Symbolic/Classical (algorithmic planning, persistent state) and Neural/Generative (stochastic generation, prompt-driven orchestration) lineages. Through a PRISMA-based review of 90 studies (2018-2025), it analyzes theoretical foundations, domain-specific implementations, and paradigm-specific challenges. The paper argues against conceptual retrofitting—misapplying classical frameworks like BDI to modern LLMs—and demonstrates that paradigm choice is strategic: symbolic systems dominate safety-critical domains while neural systems prevail in adaptive environments.`,

    groundTruths: [
      "Conceptual retrofitting is the misapplication of classical symbolic frameworks (e.g., Belief-Desire-Intention (BDI), perceive-plan-act-reflect (PPAR) loops) to describe modern systems built on large language models (LLMs). The authors argue this is problematic because it obscures the true operational mechanics of LLM-based agents, which operate on fundamentally different principles of stochastic generation and prompt-driven orchestration rather than algorithmic symbolic planning. This practice creates a false sense of continuity between incompatible architectural paradigms.",
      "The dual-paradigm taxonomy framework uses two independent dimensions: (1) Architectural Paradigm, which distinguishes between Symbolic/Classical systems (relying on algorithmic planning and persistent state) and Neural/Generative systems (leveraging stochastic generation and prompt-driven orchestration), and (2) Agency & Coordination, which distinguishes between Single-Agent systems and Multi-Agent Systems (MAS). This framework is designed as an analytical tool for classification and comparison, not to show chronological evolution.",
      "The five distinct eras in AI evolution are: (1) Symbolic AI Era (1950s-1980s), (2) Machine Learning Era (1980s-2010s), (3) Deep Learning Era (2010s-Present), (4) Generative AI Era (2014-Present), and (5) Agentic AI Era (2022-Present). The Transformer architecture emerged in 2017 during the Generative AI Era, enabling the scaling of large language models like GPT and BERT.",
      "According to Table 3, the three orchestration mechanisms are: (1) Prompt Chaining (exemplified by LangChain), which orchestrates linear sequences of LLM calls and API tools; (2) Multi-Agent Conversation (exemplified by AutoGen), which facilitates structured dialogues between collaborative LLM agents; and (3) Role-Based Workflow (exemplified by CrewAI), which assigns roles and goals to a team of agents and manages their interaction workflow.",
      "The Symbolic/Deterministic paradigm (or Hybrid) dominates in healthcare applications. The two primary constraints driving this choice are: (1) Safety and high reliability requirements, and (2) Privacy (HIPAA compliance), Explainability, and the need for verifiable, auditable pipelines. These constraints favor deterministic, rule-based approaches over emergent neural behavior to ensure patient safety and regulatory compliance.",
      "The final corpus size was 90 publications. The 12 additional papers were included through a supplemental phase during thematic synthesis. These were seminal theoretical papers from the symbolic paradigm (e.g., foundational works on MDPs and cognitive architectures like BDI and SOAR) that were essential for providing complete historical context and understanding the symbolic lineage, though they were analyzed separately from contemporary neural paradigm research.",
      "Symbolic systems achieve multi-agent coordination through pre-defined, algorithmic protocols rooted in distributed AI research (e.g., Contract Net Protocol, Blackboard Systems, Market-Based Approaches). These are engineered to ensure predictable, verifiable, and fault-tolerant interactions with explicit state management. In contrast, neural systems achieve coordination through emergent properties of structured conversation and prompt-driven orchestration, where coordination emerges from conversation-based patterns, role-based workflows, or dynamic context management within LLM context windows, making decisions stochastically rather than deterministically.",
    ],

    difficulty: "medium",
    timeout: 120000,
  },
  4: {
    roundNumber: 4,
    name: "The Trial – Expert-Level RAG Evaluation Answers",
    pdf_url: "https://www.aibattlearena.in/round4.pdf",
    description:
      "Reference answers for evaluating RAG model responses on Kafka's The Trial with maximum difficulty questions requiring deep contextual analysis, logical reasoning, and synthesis",
    questions: [
      "Construct a chronological timeline of K.'s trial from arrest to execution, calculating the duration and identifying ALL specific time markers mentioned in the text (days of week, times of day, seasonal references, explicit duration statements). Then analyze the contradictions: K.'s trial is described as 'six months old' at one point and as occurring over 'the course of a year' at another, while his execution happens 'on the eve of his thirty-first birthday' when he was arrested 'on the morning of his thirtieth birthday.' Reconcile these temporal inconsistencies and explain what they reveal about narrative reliability and the court's relationship to time.",
      "The lawyer Huld claims to have 'extensive contacts with court officials' and describes receiving visits from a 'Chief Clerk of the Court' in his bedroom. However, Titorelli later categorizes lawyers into 'petty lawyers' and 'great lawyers,' stating Huld belongs only to the former category, and that 'great lawyers' are inaccessible and choose their own cases. Cross-reference at least four separate passages where the hierarchical structure of the court is described (including the examining magistrate's painting, the doorkeeper parable, Titorelli's explanation of judges' ranks, and the offices K. visits). Synthesize these fragments to map the complete hierarchical structure of the court system, identify which level each named official occupies, and determine whether Huld's claimed influence is genuine or systematically exaggerated.",
      "Block the merchant has been on trial for 'more than five and a half years' and secretly employs 'five lawyers' in addition to Huld, which is described as forbidden. Calculate the financial implications: if Block has 'withdrawn all my capital from the business' and his 'firm's offices used to almost fill an entire floor' but now only 'one small room in the back suffices,' estimate the economic destruction the trial has caused. Then analyze the logical paradox: Block claims lawyers 'can't be bribed' in one passage, yet earlier describes attempting to bribe the doorkeeper and states 'the guards are corrupt ruffians... they wanted bribes.' Extract and compare at least three distinct statements about corruption, bribery, and payment within the court system, resolve the apparent contradictions, and construct a coherent model of how money and influence actually function in this judicial system.",
      "During K.'s first interrogation, he observes the assembled crowd and later learns they are divided into two 'parties' with 'contrasting opinions' who applaud at different moments. The examining magistrate allegedly signals one group. Later, Titorelli explains that 'everything belongs to the court' including the young girls, and describes how 'defendants are attractive' to certain people. K. also notices badges on the collars of those he assumed were neutral observers, revealing they are all court officials. Perform a forensic analysis: identify every person K. encounters who is later revealed to have court connections (include the merchant, the washerwoman, Leni, the information officer, the girls at Titorelli's, the guards, the Inspector, the Captain, and any others). Map the network of surveillance and control around K., then determine: Is there ANY character in the entire novel who is definitively NOT connected to the court? What does this network structure reveal about the boundary between the court and ordinary life?",
      "The cathedral scene contains the parable 'Before the Law' where the doorkeeper tells the dying man: 'this entrance was meant solely for you. I'm going to go and shut it now.' The priest offers multiple contradictory interpretations, including that the doorkeeper 'will not be able to shut the gate' because 'if it always stands open... then even the doorkeeper can't shut it.' Cross-reference this with (1) K.'s arrest where he is told he is 'under arrest, certainly, but that's not meant to keep you from carrying on your profession,' (2) Titorelli's statement that the trial's 'proceedings gradually merge into the judgment,' and (3) the final execution scene where K. reflects 'it seemed as though the shame was to outlive him.' Synthesize these four narrative elements to construct a comprehensive logical argument: What is the court's actual ontological status? Is it an external institution, an internalized psychological state, a metaphysical condition, or something else entirely? Support your argument with specific textual evidence showing how the court's boundaries are defined or dissolved.",
      "K. works at a bank where he holds the position of 'chief financial officer' (Prokurist), has 'a large office with a waiting room,' manages 'assistants' and 'clerks,' and is considered for promotion. The 'vice president' is his rival, and the 'president' is his superior. However, the manufacturer refers to K. as 'practically a lawyer' and K.'s uncle initially believes K. might become 'vice president' soon. Meanwhile, Titorelli is described as a 'court painter' whose position is 'hereditary,' Block is a 'grain merchant' who has lost his business, and multiple characters reference their socioeconomic status. Extract every mention of profession, social class, economic status, and hierarchical position for at least six major characters. Then analyze: How does the court's hierarchy mirror, invert, or intersect with the socioeconomic hierarchy of Prague society? Specifically, does economic or professional status provide any protection from or influence within the court, and what evidence supports or contradicts this?"
    ],
    context:
      "This round focuses on Kafka's 'The Trial', requiring deep contextual analysis, logical reasoning, and synthesis. Evaluation metrics emphasize comprehensive understanding (Exact Match), identifying key connections (Partial Match), and penalizing factually incorrect or hallucinated information. The court is synthesized as a totalizing network where the trial itself is the judgment, and its boundaries with ordinary life are entirely dissolved.",
    groundTruths: [
      "Temporal markers in the text include: arrest 'on the morning of his thirtieth birthday'; first interrogation 'the following Sunday'; subsequent visits to court offices; the painter conversation occurs when K.'s trial is 'six months old'; later references indicate 'a yearlong struggle'; execution occurs 'on the eve of his thirty-first birthday.' The mathematical contradiction is clear: if arrested at age 30 and executed on the eve of age 31, the trial lasted nearly one year, yet it's described as six months old at a point that seems late in the narrative. This represents how the court distorts experienced time.",
      "Court hierarchy from textual evidence: guards and ushers (operational), examining magistrates (investigative), chief clerks (administrative coordination), judges, 'higher courts,' and an inaccessible highest court. Lawyer hierarchy: shysters (forbidden), petty lawyers like Huld (tolerated), and great lawyers (possibly mythical/inaccessible). Huld's influence is genuine at lower levels (receiving visits from a Chief Clerk) but he cannot reach higher courts where actual acquittal might be possible.",
      "Financial destruction: Block 'spent everything,' business shrank from 'entire floor' to 'one small room.' Six lawyers working for 5+ years plus bribes to guards and officials. Bribery duel economy: (1) Low level (guards) for conveniences; (2) Middle level (magistrates) via disguised gifts; (3) Higher levels possibly non-monetary. The system extracts maximum economic value while ensuring money never purchases freedom.",
      "Confirmed court connections: guards Franz/Willem, Inspector, clerks Rabensteiner/Kullich/Kaminer, hearing crowd (all officials), flogger, usher, washerwoman, law student, Leni, lawyer Huld, Chief Clerk, Block (defendant/informant-like), Titorelli, studio girls, information officer, prison chaplain, executioners. Ambiguous/Doubtful: Captain Lanz, Frau Grubach, Fräulein Bürstner/Montag. Conclusion: Virtually no significant character is definitively prove outside court influence; the boundary with ordinary life has dissolved.",
      "Synthesis: Parable indicates Law as structural relationship; arrest shows status-based power without physical restriction; Titorelli show the process IS the judgment; 'shame outlives him' shows persistence beyond life. Ontological status: The court exists simultaneously as a corrupt bureaucratic institution (external), a psychological state of guilt (internal), and a metaphysical condition of existence before inscrutable judgment. It cannot be fought on a single plane.",
      "HIERARCHY ANALYSIS: Court access (e.g., Titorelli) is unrelated to wealth (Block) or profession (K.). Economic status is inverted/destroyed—the court nullifies worldly achievements. Hereditary/insider positions matter more than achievement. The court functions as a separate class system where once accused, your social status becomes irrelevant except as something to be destroyed. Economic/professional status provides no protection."
    ],
    difficulty: "expert",
    timeout: 120000,
  },

  5: {
    roundNumber: 5,
    name: "Multilingual RAG – Cross-Language Reasoning & Grounded Evaluation Round",
    pdf_url: "https://www.aibattlearena.in/round5.pdf",
    description: "Advanced multilingual evaluation round to assess RAG systems on English technical content, French narrative reasoning, and Hindi contextual comprehension with increasing difficulty",
    questions: [
      "According to the English technical section, which category of machine learning algorithms explicitly requires knowledge of the outcome (dependent) variable during training, and how does the text describe the role of the loss function in this learning process?",
      "Using the English section on the framework for developing machine learning models, list the major stages from problem identification to deployment, and identify the stage where feature extraction and feature engineering are explicitly emphasized.",
      "In the French narrative, Jeji Bapa teaches Biju mathematics using colored threads, knotting, and grouping techniques. Explain how this method can be interpreted as an analogy for feature extraction and feature engineering described in the English section. Your answer must explicitly reference both the French narrative and the English technical explanation.",
      "हिंदी अनुभाग में वर्णित पारिवारिक जीवन और काम करने की प्रक्रिया को ध्यान में रखते हुए बताइए कि किस प्रकार श्रम का विभाजन और कौशल का क्रमिक विकास दर्शाया गया है। अपने उत्तर को केवल हिंदी अनुभाग में दी गई जानकारी तक सीमित रखें।",
      "The English section emphasizes that true value creation in machine learning comes from innovative use of data rather than mere use of tools. The French narrative shows Biju's family bypassing intermediaries to sell saris directly, while the Hindi section highlights sustained effort and collective contribution. Construct a logical reasoning chain showing how all three language sections express the same underlying principle of value creation. Clearly distinguish what is explicitly stated in each language section from what is logically inferred."
    ],
    context: "This round evaluates multilingual RAG capabilities across English technical documentation on machine learning, French narrative storytelling about traditional mathematics education, and Hindi descriptions of family-based craft work. Questions progress from single-language factual retrieval to cross-language analogical reasoning and synthesis of principles across all three languages.",
    groundTruths: [
      "Supervised learning algorithms explicitly require knowledge of the outcome (dependent) variable during training. The loss function serves to measure the difference between predicted outputs and actual outcomes, guiding the optimization process to minimize prediction errors.",
      "The major stages are: problem identification and definition, data collection and preparation, feature extraction and feature engineering, model selection and training, model evaluation and validation, and deployment and monitoring. Feature extraction and feature engineering are explicitly emphasized in the third stage (data preparation/feature engineering stage).",
      "In the French narrative, Jeji Bapa uses colored threads representing different values, knotting to group units, and systematic arrangement to teach mathematical concepts. This parallels feature extraction (identifying relevant attributes from raw data) and feature engineering (transforming and combining attributes meaningfully) described in the English section, as both involve taking raw elements and structuring them into meaningful patterns that enable learning and problem-solving.",
      "हिंदी अनुभाग में पारिवारिक व्यवस्था में प्रत्येक सदस्य की विशिष्ट भूमिका दिखाई गई है - कोई धागा तैयार करता है, कोई रंगाई करता है, कोई बुनाई करता है। यह श्रम विभाजन दर्शाता है। साथ ही, पीढ़ियों के अनुभव से कौशल का स्थानांतरण और सुधार होता है, जो क्रमिक विकास को प्रदर्शित करता है।",
      "Explicitly stated: English section states value comes from innovative data use, not tools. French narrative shows direct sales eliminating middlemen for better profits. Hindi section emphasizes continuous effort and family contribution. Logical inference: All three sections converge on the principle that sustainable value creation requires removing unnecessary intermediaries (whether conceptual, commercial, or procedural), directly engaging with core resources (data, customers, craft), and applying sustained, skillful effort rather than relying solely on external tools or systems."
    ],
    difficulty: "hard",
    timeout: 25000
  }
};

/**
 * Get round configuration by round number
 */
function getRoundConfig(roundNumber) {
  if (roundNumber < 1 || roundNumber > 5) {
    throw new Error('Invalid round number. Must be between 1 and 5.');
  }
  return TOURNAMENT_ROUNDS[roundNumber];
}

/**
 * Get all round configurations
 */
function getAllRounds() {
  return Object.values(TOURNAMENT_ROUNDS);
}

/**
 * Validate if a round number is valid
 */
function isValidRound(roundNumber) {
  return roundNumber >= 1 && roundNumber <= 5;
}

module.exports = {
  TOURNAMENT_ROUNDS,
  getRoundConfig,
  getAllRounds,
  isValidRound
};