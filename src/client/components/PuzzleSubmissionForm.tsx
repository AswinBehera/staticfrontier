import React, { useState } from 'react';

type PuzzleSubmission = {
  title: string;
  description: string;
  phrases: Array<{
    text: string;
    frequency: number;
    modulation: number;
  }>;
  metaAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  hints: string[];
};

export const PuzzleSubmissionForm = () => {
  const [submission, setSubmission] = useState<PuzzleSubmission>({
    title: '',
    description: '',
    phrases: [{ text: '', frequency: 50, modulation: 25 }],
    metaAnswer: '',
    difficulty: 'medium',
    category: '',
    hints: [''],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const addPhrase = () => {
    setSubmission((prev) => ({
      ...prev,
      phrases: [...prev.phrases, { text: '', frequency: 50, modulation: 25 }],
    }));
  };

  const removePhrase = (index: number) => {
    if (submission.phrases.length > 1) {
      setSubmission((prev) => ({
        ...prev,
        phrases: prev.phrases.filter((_, i) => i !== index),
      }));
    }
  };

  const updatePhrase = (
    index: number,
    field: 'text' | 'frequency' | 'modulation',
    value: string | number
  ) => {
    setSubmission((prev) => ({
      ...prev,
      phrases: prev.phrases.map((phrase, i) =>
        i === index ? { ...phrase, [field]: value } : phrase
      ),
    }));
  };

  const addHint = () => {
    setSubmission((prev) => ({
      ...prev,
      hints: [...prev.hints, ''],
    }));
  };

  const removeHint = (index: number) => {
    if (submission.hints.length > 1) {
      setSubmission((prev) => ({
        ...prev,
        hints: prev.hints.filter((_, i) => i !== index),
      }));
    }
  };

  const updateHint = (index: number, value: string) => {
    setSubmission((prev) => ({
      ...prev,
      hints: prev.hints.map((hint, i) => (i === index ? value : hint)),
    }));
  };

  const validateSubmission = (): string[] => {
    const errors: string[] = [];

    if (!submission.title.trim()) errors.push('Title is required');
    if (!submission.description.trim()) errors.push('Description is required');
    if (!submission.metaAnswer.trim()) errors.push('Meta answer is required');
    if (!submission.category.trim()) errors.push('Category is required');

    const validPhrases = submission.phrases.filter((p) => p.text.trim());
    if (validPhrases.length < 2) errors.push('At least 2 phrases are required');

    // Check for duplicate frequencies
    const frequencies = validPhrases.map((p) => p.frequency);
    const uniqueFrequencies = new Set(frequencies);
    if (frequencies.length !== uniqueFrequencies.size) {
      errors.push('All phrases must have unique frequencies');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateSubmission();
    if (errors.length > 0) {
      setMessage(`❌ ${errors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/puzzles/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('✅ Puzzle submitted successfully! You earned 5 Echo Points for submission.');
        setSubmission({
          title: '',
          description: '',
          phrases: [{ text: '', frequency: 50, modulation: 25 }],
          metaAnswer: '',
          difficulty: 'medium',
          category: '',
          hints: [''],
        });
        setShowForm(false);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage('❌ Error submitting puzzle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-black border border-green-300/40 p-4 rounded-sm">
        <div className="text-center">
          <h3 className="text-lg font-bold text-green-300 mb-2">CREATE YOUR OWN PUZZLE</h3>
          <p className="text-sm text-green-400/80 mb-4">
            Design a radio signal puzzle for the community to solve!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-400 text-black px-4 py-2 font-mono text-sm hover:bg-green-300 transition-all duration-200 btn-hover"
          >
            START CREATING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black border border-green-300/40 p-6 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-green-300">PUZZLE CREATOR</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-green-400 hover:text-green-300 text-xl"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-mono mb-2 text-green-300">PUZZLE TITLE *</label>
            <input
              type="text"
              value={submission.title}
              onChange={(e) => setSubmission((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono focus:outline-none focus:border-green-300"
              placeholder="Enter puzzle title..."
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-mono mb-2 text-green-300">DESCRIPTION *</label>
            <textarea
              value={submission.description}
              onChange={(e) => setSubmission((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono focus:outline-none focus:border-green-300 h-20 resize-none"
              placeholder="Describe the puzzle scenario..."
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-mono mb-2 text-green-300">DIFFICULTY *</label>
              <select
                value={submission.difficulty}
                onChange={(e) =>
                  setSubmission((prev) => ({
                    ...prev,
                    difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                  }))
                }
                className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono focus:outline-none focus:border-green-300"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-mono mb-2 text-green-300">CATEGORY *</label>
              <input
                type="text"
                value={submission.category}
                onChange={(e) => setSubmission((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono focus:outline-none focus:border-green-300"
                placeholder="e.g., Science, History, Pop Culture"
                maxLength={50}
              />
            </div>
          </div>
        </div>

        {/* Phrases */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-mono text-green-300">
              RADIO PHRASES * (2-5 phrases)
            </label>
            <button
              type="button"
              onClick={addPhrase}
              disabled={submission.phrases.length >= 5}
              className="text-green-400 hover:text-green-300 text-sm disabled:text-gray-500"
            >
              + Add Phrase
            </button>
          </div>

          {submission.phrases.map((phrase, index) => (
            <div
              key={index}
              className="grid grid-cols-3 gap-2 mb-3 p-3 border border-green-400/30 rounded"
            >
              <div>
                <label className="block text-xs text-green-400 mb-1">Text</label>
                <input
                  type="text"
                  value={phrase.text}
                  onChange={(e) => updatePhrase(index, 'text', e.target.value)}
                  className="w-full px-2 py-1 bg-black border border-green-400/50 text-green-400 font-mono text-sm focus:outline-none focus:border-green-300"
                  placeholder="Phrase text..."
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-xs text-green-400 mb-1">Frequency</label>
                <input
                  type="number"
                  min="0"
                  max="108"
                  step="0.1"
                  value={phrase.frequency}
                  onChange={(e) =>
                    updatePhrase(index, 'frequency', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 bg-black border border-green-400/50 text-green-400 font-mono text-sm focus:outline-none focus:border-green-300"
                />
              </div>
              <div className="flex items-end">
                <div className="flex-1">
                  <label className="block text-xs text-green-400 mb-1">Modulation</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={phrase.modulation}
                    onChange={(e) =>
                      updatePhrase(index, 'modulation', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 bg-black border border-green-400/50 text-green-400 font-mono text-sm focus:outline-none focus:border-green-300"
                  />
                </div>
                {submission.phrases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhrase(index)}
                    className="ml-2 text-red-400 hover:text-red-300 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Meta Answer */}
        <div>
          <label className="block text-sm font-mono mb-2 text-green-300">META ANSWER *</label>
          <input
            type="text"
            value={submission.metaAnswer}
            onChange={(e) => setSubmission((prev) => ({ ...prev, metaAnswer: e.target.value }))}
            className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 font-mono focus:outline-none focus:border-green-300"
            placeholder="What do the phrases reveal when combined?"
            maxLength={200}
          />
        </div>

        {/* Hints */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-mono text-green-300">HINTS (Optional)</label>
            <button
              type="button"
              onClick={addHint}
              className="text-green-400 hover:text-green-300 text-sm"
            >
              + Add Hint
            </button>
          </div>

          {submission.hints.map((hint, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={hint}
                onChange={(e) => updateHint(index, e.target.value)}
                className="flex-1 px-3 py-2 bg-black border border-green-400/50 text-green-400 font-mono focus:outline-none focus:border-green-300"
                placeholder="Optional hint for solvers..."
                maxLength={200}
              />
              {submission.hints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHint(index)}
                  className="px-2 text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="flex-1 py-2 px-4 border border-green-400 text-green-400 font-mono hover:bg-green-400/10 transition-all duration-200"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-2 px-4 font-mono text-sm ${
              isSubmitting
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-400 text-black hover:bg-green-300 hover:shadow-lg hover:shadow-green-400/30 btn-hover'
            }`}
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT PUZZLE'}
          </button>
        </div>

        {message && (
          <div
            className={`text-center text-sm p-3 rounded ${
              message.includes('✅')
                ? 'bg-green-400/20 text-green-400'
                : 'bg-red-400/20 text-red-400'
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
};
