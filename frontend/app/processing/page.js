"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import styles from "./processing.module.css";

const steps = [
  { icon: "description", text: "Extracting invoice data..." },
  { icon: "analytics", text: "Analyzing invoice details..." },
  { icon: "policy", text: "Detecting anomalies..." },
  { icon: "check_circle", text: "Processing complete" },
];

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id") || "INV-7842";
  const [currentStep, setCurrentStep] = useState(0);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const stepDurations = [1200, 1200, 1000, 600];
    let stepIdx = 0;

    const advance = () => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setCurrentStep(stepIdx);
        setTimeout(advance, stepDurations[stepIdx]);
      } else {
        setTimeout(() => {
          router.push(`/result?id=${invoiceId}`);
        }, 400);
      }
    };

    setTimeout(advance, stepDurations[0]);

    // Progress counter
    const totalTime = stepDurations.reduce((a, b) => a + b, 0);
    const interval = setInterval(() => {
      setPercent((prev) => {
        const next = prev + (100 / (totalTime / 50));
        return next >= 100 ? 100 : Math.round(next);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [router, invoiceId]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.spinnerWrap}>
          <div className={styles.spinner}></div>
          <span className={styles.spinnerPercent}>{percent}%</span>
        </div>

        <h2 className={styles.title}>Processing Invoice</h2>
        <p className={styles.subtitle}>
          Ledge AI is analyzing your document with advanced extraction models.
        </p>

        <div className={styles.steps}>
          {steps.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div
                key={i}
                className={`${styles.step} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}
              >
                <div
                  className={`${styles.stepIcon} ${
                    isDone ? styles.stepIconDone : isActive ? styles.stepIconActive : styles.stepIconPending
                  }`}
                >
                  <span className="material-icons" style={{ fontSize: 18 }}>
                    {isDone ? "check" : step.icon}
                  </span>
                </div>
                <span
                  className={`${styles.stepText} ${isActive ? styles.stepTextActive : ""}`}
                >
                  {isDone ? step.text.replace("...", "") + "✓" : step.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className={styles.wrapper}><div className={styles.container}><p>Loading...</p></div></div>}>
      <ProcessingContent />
    </Suspense>
  );
}
