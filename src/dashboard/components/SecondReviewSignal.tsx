import React from 'react';
import { Brain, Check, Shield } from 'lucide-react';
import type { SecondReviewState } from '../types';

interface SecondReviewSignalProps {
  review: SecondReviewState;
  onAcknowledge: () => void;
  onFinalApprove: () => void;
  onDismiss: () => void;
}

export const SecondReviewSignal: React.FC<SecondReviewSignalProps> = ({
  review,
  onAcknowledge,
  onFinalApprove,
  onDismiss,
}) => {
  if (!review.recommendation) return null;

  return (
    <aside className="second-review" role="complementary" aria-label="Kate second review">
      <div className="second-review__pulse" aria-hidden />
      <div className="second-review__head">
        <Brain size={20} className="second-review__icon" />
        <div>
          <span className="second-review__eyebrow">Second review · Kate</span>
          <span className="second-review__context">{review.context}</span>
        </div>
      </div>
      <p className="second-review__body">{review.recommendation}</p>
      <p className="second-review__approver">
        <Shield size={14} />
        You remain the <strong>final approver</strong> — Kate advises; you decide.
      </p>
      <div className="second-review__actions">
        <button
          type="button"
          className={`second-review__btn ${review.acknowledged ? 'second-review__btn--done' : ''}`}
          onClick={onAcknowledge}
          disabled={review.acknowledged}
        >
          {review.acknowledged ? 'Kate review noted' : "I've read Kate's review"}
        </button>
        <button
          type="button"
          className={`second-review__btn second-review__btn--final ${review.finalApproved ? 'second-review__btn--done' : ''}`}
          onClick={onFinalApprove}
        >
          <Check size={16} />
          {review.finalApproved ? 'Final approval recorded' : 'Final call — I approve'}
        </button>
        <button type="button" className="second-review__btn second-review__btn--dismiss" onClick={onDismiss}>
          Dismiss — not now
        </button>
      </div>
    </aside>
  );
};
