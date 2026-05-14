function Stepper({ steps, currentStep, onGoToStep }) {
    return (
        <div className="stepper">
            {steps.map((step, idx) => (
                <div key={step.id} className="stepper__item">
                    <button
                        className={`stepper__dot ${idx === currentStep ? 'stepper__dot--active' :
                                idx < currentStep ? 'stepper__dot--done' : ''
                            }`}
                        onClick={() => onGoToStep(idx)}
                        title={step.title}
                        aria-label={`Langkah ${idx + 1}: ${step.title}`}
                    >
                        {idx < currentStep ? '' : idx + 1}
                    </button>
                    {idx < steps.length - 1 && (
                        <div className={`stepper__line ${idx < currentStep ? 'stepper__line--done' : ''}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default Stepper;
