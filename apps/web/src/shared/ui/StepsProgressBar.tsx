function StepsProgressBar({
  stepsLabel,
  curActiveStep,
}: {
  stepsLabel: string[];
  curActiveStep: number;
}) {
  const stepsCount = stepsLabel.length;

  return (
    <div className="flex w-full">
      {Array.from({ length: stepsCount }, (_v, index) => index).map(
        (step, index) => {
          const isActiveStep = curActiveStep === index;
          const isCompletedStep = index < curActiveStep;
          const isLastStep = index + 1 === stepsCount;
          return (
            <div key={step} className="flex w-full">
              <div className="flex max-w-8 flex-col">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isActiveStep || isCompletedStep ? "bg-indigo-700" : "bg-neutral-600"} transition duration-300`}
                >
                  {isCompletedStep ? "✓" : step + 1}
                </span>

                <p
                  className={`mt-1 text-center text-xs ${isActiveStep ? "text-indigo-400" : "text-neutral-500"} transition duration-300`}
                >
                  {stepsLabel[step]}
                </p>
              </div>

              {!isLastStep && (
                <span
                  className={`mt-3.5 h-1 w-full ${isCompletedStep ? "bg-indigo-700" : "bg-neutral-600"} transition duration-300`}
                />
              )}
            </div>
          );
        },
      )}
    </div>
  );
}

export default StepsProgressBar;
