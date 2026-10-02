"use client";

import s from "@/app/technical.module.css";
import { STORY as C } from "@/lib/product-story";
import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { StoryScene } from "./story-scenes";

export function ExecutionPipeline() {
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(true);

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % C.chapters.length);
  };

  const togglePause = () => setRunning((prev) => !prev);

  const current = C.chapters[activeStep];

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <div
        className={`${s.theater} tick-frame`}
        data-running={running}
        data-chapter={activeStep}
      >
        <div className={s.toolbar}>
          <span>
            <i aria-hidden="true" />
            system flow illustration
          </span>
          <button onClick={togglePause} type="button">
            {running ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {running ? "Auto-playing" : "Paused"}
          </button>
        </div>

        <div className={s.stage}>
          <div className={s.narration} key={`copy-${activeStep}`}>
            <div className={s.chapterNumber}>
              {current.navLabel?.split(" ")[0]}
              <span>/ 04</span>
            </div>
            <div className={s.eyebrow}>{current.scope}</div>
            <h3>{current.heading}</h3>
            <p className={s.body}>{current.paragraph}</p>
          </div>

          <div
            className={s.visual}
            key={`scene-${activeStep}`}
            data-scene={activeStep}
          >
            <StoryScene index={activeStep} />
          </div>
        </div>

        <div className={s.chapters}>
          {C.chapters.map((chapter, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={chapter.id}
                onClick={() => {
                  setActiveStep(idx);
                  setRunning(false);
                }}
                aria-pressed={isActive}
                type="button"
              >
                <span>{chapter.navLabel?.split(" ")[0]}</span>
                {chapter.navLabel?.split(" ")[1]}
                <div className={s.chapterTrack}>
                  {isActive && (
                    <span
                      className={s.chapterProgress}
                      onAnimationEnd={handleNext}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={s.below}>
        <span>
          Watch the full process, or click on the tabs to jump to specific
          sections.
        </span>
        <a href={C.sourceUrl} target="_blank" rel="noopener noreferrer">
          {C.source}
        </a>
      </div>
    </div>
  );
}
