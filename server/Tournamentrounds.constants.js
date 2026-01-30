/**
 * Tournament Round Constants
 * Contains PDF links, questions, contexts, and ground truth answers for all 5 rounds
 * Each round tests different aspects of RAG capabilities
 */

const TOURNAMENT_ROUNDS = {
  1: {
    roundNumber: 1,
    name: "Factual Retrieval Round",
    pdfLink: "https://example.com/rounds/round1_frames_paper.pdf",
    description: "Basic factual retrieval and dataset understanding",
    questions: [
      "What does the acronym FRAMES stand for, and what is the primary purpose of this dataset?",
      "How many test samples does the FRAMES dataset contain?",
      "Which state-of-the-art LLM models were evaluated in this paper, and what are their release dates?",
      "What are the five types of reasoning that questions in FRAMES can be labeled with?",
      "What is the range of Wikipedia articles required to answer questions in the FRAMES dataset?"
    ],
    context: `FRAMES stands for "Factuality, Retrieval, And reasoning MEasurement Set." It is designed to test LLMs' factual responses, retrieval capabilities, and reasoning in generating final answers in end-to-end RAG scenarios. The dataset contains 824 test samples. The models evaluated were: Gemini-Pro-1.5 (5/14/24), Gemini-Flash-1.5 (5/14/24), Gemma2-27b (6/27/24), LLama3.2-3B-I (9/25/24), and Qwen2.5-3B-I (9/19/24). The five reasoning types are: Numerical Reasoning, Tabular Reasoning, Multiple Constraints, Temporal Reasoning, and Post-Processing. Each question in FRAMES requires 2-15 Wikipedia articles to answer.`,
    groundTruths: [
      "FRAMES stands for 'Factuality, Retrieval, And reasoning MEasurement Set.' It is designed to test LLMs' factual responses, retrieval capabilities, and reasoning in generating final answers in end-to-end RAG scenarios.",
      "The FRAMES dataset contains 824 test samples/questions.",
      "The models evaluated were: Gemini-Pro-1.5 (5/14/24), Gemini-Flash-1.5 (5/14/24), Gemma2-27b (6/27/24), LLama3.2-3B-I (9/25/24), Qwen2.5-3B-I (9/19/24)",
      "The five reasoning types are: Numerical Reasoning, Tabular Reasoning, Multiple Constraints, Temporal Reasoning, and Post-Processing.",
      "Each question in FRAMES requires 2-15 Wikipedia articles to answer."
    ],
    difficulty: "easy",
    timeout: 15000 // 15 seconds per question
  },

  2: {
    roundNumber: 2,
    name: "Methodology Comprehension Round",
    pdfLink: "https://example.com/rounds/round2_frames_paper.pdf",
    description: "Understanding of methodology and experimental design",
    questions: [
      "What was the main problem encountered when attempting to generate the dataset synthetically using LLMs?",
      "What was the baseline accuracy achieved by Gemini-Pro-1.5-0514 using naive prompting (without retrieval)?",
      "What are the three baseline prompting methods used in single-step evaluations, and what does each method involve?",
      "What specific quality check was implemented to prevent LLMs from achieving high accuracy through random guessing?",
      "How was the LLM-based auto-rating mechanism validated, and what metrics demonstrated its reliability?"
    ],
    context: `When attempting to generate the dataset synthetically, the main problem was a high proportion of hallucinated questions and answers (>30%), and the LLM struggled to generate questions requiring more than four articles. The naive prompting baseline achieved 0.408 (40.8%) accuracy. The three baseline methods are: Naive Prompt (simply asking without retrieval), BM25-Retrieved Prompt (augmenting with top n_docs using BM25 scoring), and Oracle Prompt (including ALL ground truth Wikipedia articles). Questions with binary answers were removed to prevent 50% accuracy through random guessing. The auto-rating mechanism showed strong alignment with accuracy of 0.96 and Cohen's Kappa of 0.889 for Gemini-Pro-1.5-0514.`,
    groundTruths: [
      "The main problem was a high proportion of hallucinated questions and answers (>30%). Additionally, the LLM struggled to generate questions that strictly required more than four articles.",
      "The naive prompting baseline achieved an accuracy of 0.408 (or 40.8%).",
      "The three baseline methods are: Naive Prompt (simply asking the question without search retrieval), BM25-Retrieved Prompt (augmenting the question with top n_docs Wikipedia articles using BM25 scoring), and Oracle Prompt (including the question with ALL ground truth Wikipedia articles used by annotators).",
      "Questions with binary answers ('yes' or 'no') were removed to prevent LLMs from achieving 50% accuracy through random guessing.",
      "The auto-rating mechanism was tested against human evaluations and showed strong alignment with an accuracy of 0.96 and Cohen's Kappa of 0.889 for Gemini-Pro-1.5-0514, making it a suitable approach for evaluation."
    ],
    difficulty: "medium",
    timeout: 20000
  },

  3: {
    roundNumber: 3,
    name: "Performance Analysis Round",
    pdfLink: "https://example.com/rounds/round3_frames_paper.pdf",
    description: "Numerical analysis and comparative evaluation",
    questions: [
      "By how much did the multi-step retrieval pipeline improve accuracy compared to naive prompting, and what was the final accuracy achieved?",
      "According to the dataset statistics, what percentage of questions require exactly two Wikipedia articles, and what percentage require three articles?",
      "What was the Oracle Prompt accuracy for Gemini-Pro-1.5-0514, and what do the errors in this setting reveal about model limitations?",
      "How did the researchers address the issue of answers changing over time, and can you provide an example of how a question was modified?",
      "According to Table 1, which existing datasets evaluate retrieval capabilities, and how does FRAMES differ from them?"
    ],
    context: `The multi-step retrieval pipeline improved accuracy from 0.408 (naive prompting) to 0.66, representing a greater than 50% improvement. Approximately 36% of questions require two articles, and approximately 35% require three articles. Oracle Prompt achieved 0.729 accuracy; of the 27% errors, approximately 80% belonged to numerical, tabular, and post-processing categories. Annotators added extra context with specific dates for temporal disambiguation. For example, the FIFA World Cup question was revised to include "As of August 1, 2024" for clarity. Natural Questions and ELI5 evaluate retrieval, and Multihop-RAG evaluates both factuality and retrieval, but FRAMES uniquely provides comprehensive evaluation of all three components (Factuality, Retrieval, AND Reasoning) together.`,
    groundTruths: [
      "The multi-step retrieval pipeline improved accuracy from 0.408 (naive prompting) to 0.66, representing a greater than 50% improvement in performance.",
      "Approximately 36% of questions require two articles, and approximately 35% require three articles.",
      "Oracle Prompt achieved 0.729 accuracy. Of the 27% errors, approximately 80% belonged to numerical, tabular, and post-processing categories, revealing reasoning gaps where the model failed to reason through facts even when all relevant information was provided.",
      "Annotators added extra context with specific dates to disambiguate answers that could change over time. For example, the question 'Which country were holders of the FIFA World Cup the last time the UEFA Champions League was won by a club from London?' was revised to 'As of August 1, 2024, which country were holders of the FIFA World Cup the last time the UEFA Champions League was won by a club from London?'",
      "Natural Questions and ELI5 evaluate retrieval, and Multihop-RAG evaluates both factuality and retrieval. However, FRAMES is unique in providing a comprehensive evaluation of all three components (Factuality, Retrieval, AND Reasoning) together in a unified framework, along with multi-hop questions and temporal disambiguation."
    ],
    difficulty: "medium",
    timeout: 25000
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