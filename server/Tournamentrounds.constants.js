/**
 * Tournament Round Constants
 * Contains PDF links, questions, contexts, and ground truth answers for all 5 rounds
 * Each round tests different aspects of RAG capabilities
 */

const TOURNAMENT_ROUNDS = {
  1: {
    roundNumber: 1,
    name: "RAG Fundamentals (NeurIPS 2020)",
    pdfLink:
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
    pdfLink: "https://www.aibattlearena.in/round2.pdf",
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
    pdfLink: "https://arxiv.org/pdf/2510.25445",
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
    name: "Advanced Reasoning Round",
    pdfLink: "https://example.com/rounds/round4_advanced_rag.pdf",
    description: "Complex multi-hop reasoning and synthesis",
    questions: [
      "In a RAG system, if the retrieval component achieves 85% recall but 60% precision, and the LLM has 90% accuracy on retrieved documents, what is the approximate end-to-end accuracy?",
      "A research paper shows that increasing context window from 4K to 16K tokens improved accuracy by 15%, but latency increased by 200%. What is the accuracy-per-latency-unit improvement ratio?",
      "If a multi-step retrieval system uses BM25 for initial ranking (retrieving top 20 from 1M docs) followed by a reranker (selecting top 5), and the BM25 step has 70% recall, what minimum reranker recall is needed for 60% overall recall?",
      "Given that numerical reasoning questions have 45% accuracy, temporal reasoning has 55% accuracy, and they comprise 30% and 25% of the dataset respectively, what is the weighted average accuracy for these categories?",
      "A model processes queries at 500ms with 2 documents and 1200ms with 8 documents. Assuming linear scaling, at what document count does latency exceed the 3000ms threshold?"
    ],
    context: `RAG systems combine retrieval and generation components. End-to-end accuracy depends on both retrieval quality (recall and precision) and LLM performance. The formula for end-to-end accuracy is approximately: Retrieval_Recall × LLM_Accuracy. Context window size affects both accuracy and latency - larger windows provide more information but slower processing. Multi-stage retrieval systems cascade recall rates multiplicatively. Weighted averages are calculated by multiplying each value by its weight and summing. Latency scaling in RAG systems often follows linear or sub-linear patterns with document count.`,
    groundTruths: [
      "End-to-end accuracy ≈ Retrieval_Recall × LLM_Accuracy = 0.85 × 0.90 = 0.765 or 76.5%",
      "Accuracy improvement per latency unit = 15% / 200% = 0.075 or 7.5% accuracy per 100% latency increase",
      "Overall recall = BM25_recall × Reranker_recall. So 0.60 = 0.70 × Reranker_recall. Therefore, minimum reranker recall needed = 0.60 / 0.70 ≈ 0.857 or 85.7%",
      "Weighted average = (0.45 × 0.30) + (0.55 × 0.25) = 0.135 + 0.1375 = 0.2725 or 27.25%",
      "Latency = 500 + (700/6) × (n-2) where n is document count. Setting to 3000: 3000 = 500 + 116.67(n-2). Solving: n ≈ 23.4, so at 24 documents, latency exceeds 3000ms."
    ],
    difficulty: "hard",
    timeout: 30000
  },

  5: {
    roundNumber: 5,
    name: "Championship Final Round",
    pdfLink: "https://example.com/rounds/round5_championship.pdf",
    description: "Comprehensive evaluation across all RAG dimensions",
    questions: [
      "Compare and contrast the advantages and limitations of BM25 versus dense retrieval methods for multi-hop question answering, considering both retrieval quality and computational efficiency.",
      "Explain how the Oracle Prompt setting reveals fundamental limitations in LLM reasoning capabilities, and what this implies for the role of retrieval versus generation in RAG systems.",
      "Design an optimal evaluation strategy for a new RAG system that balances factuality, retrieval accuracy, reasoning capability, and inference speed. What metrics and benchmarks would you prioritize?",
      "Analyze why removing binary yes/no questions is crucial for dataset quality, and propose two additional quality control measures that could further improve RAG benchmark reliability.",
      "If you were to extend the FRAMES dataset, what new question types or reasoning categories would you add to better capture real-world RAG challenges, and why?"
    ],
    context: `BM25 is a sparse retrieval method based on term frequency and inverse document frequency, offering fast exact matching but limited semantic understanding. Dense retrieval uses neural embeddings for semantic similarity but requires more computation. The Oracle Prompt provides all relevant documents but still shows ~27% error rate, indicating that retrieval isn't the only bottleneck - reasoning over retrieved information is equally critical. Effective RAG evaluation requires balanced metrics across multiple dimensions: retrieval (recall/precision), generation (accuracy/groundedness), reasoning (multi-hop/numerical), and efficiency (latency/throughput). Dataset quality controls like removing binary questions prevent gaming metrics and ensure meaningful evaluation. Real-world RAG faces challenges beyond current benchmarks including: conflicting information reconciliation, temporal reasoning, multi-modal understanding, and long-context synthesis.`,
    groundTruths: [
      "BM25 advantages: Fast, interpretable, works well for exact keyword matching, no training required. Limitations: No semantic understanding, struggles with paraphrasing, vocabulary mismatch. Dense retrieval advantages: Captures semantic similarity, handles paraphrasing, better for conceptual queries. Limitations: Computationally expensive, requires training data, less interpretable. For multi-hop QA, dense methods typically perform better due to semantic understanding, but BM25 remains competitive for specific fact retrieval and is more efficient.",
      "The Oracle Prompt setting provides all necessary documents yet still achieves only 72.9% accuracy, with 80% of errors in numerical/tabular/post-processing categories. This reveals that retrieval is not the sole bottleneck - LLMs have fundamental reasoning limitations even with perfect information access. This implies RAG systems need improvements in both retrieval AND reasoning components, and that better prompting strategies or reasoning-focused model architectures are needed to close this gap.",
      "An optimal evaluation strategy should include: (1) Retrieval metrics - recall@k, precision@k, MRR for finding relevant documents; (2) Factuality metrics - accuracy, groundedness, hallucination rate; (3) Reasoning metrics - performance breakdown by reasoning type (numerical, temporal, multi-hop); (4) Efficiency metrics - latency, throughput, cost per query. Prioritize end-to-end accuracy as the primary metric, with reasoning breakdown as secondary diagnostic metrics. Use diverse benchmarks like FRAMES for comprehensive evaluation, MS MARCO for retrieval, and domain-specific datasets for real-world applicability.",
      "Removing binary yes/no questions prevents 50% random guessing baseline, ensuring models must demonstrate genuine understanding. Additional quality controls: (1) Answer length diversity - require varied response lengths to prevent models from gaming based on answer patterns; (2) Adversarial negative sampling - include highly relevant but incorrect documents to test grounding; (3) Temporal validation - verify questions have stable answers or proper temporal disambiguation; (4) Multi-annotator agreement - require consensus on ground truth to reduce subjective bias.",
      "Proposed extensions: (1) Conflicting information resolution - questions where different sources provide contradictory facts, testing reconciliation abilities; (2) Multi-modal reasoning - incorporating images, tables, and charts alongside text; (3) Temporal chain reasoning - questions requiring understanding of event sequences and causal relationships; (4) Negation and exception handling - testing understanding of 'except', 'not', 'excluding' scenarios; (5) Quantitative comparison - requiring mathematical operations across multiple sources. These capture real-world challenges like fact-checking, research synthesis, and analytical reasoning that current benchmarks underrepresent."
    ],
    difficulty: "expert",
    timeout: 40000
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