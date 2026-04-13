import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '../ui/button';
import { GradientButton } from '../GradientButton';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'sidebar',
    title: 'Navigation Panel',
    description: 'Use this navigation panel to access Properties, Tenants, Payments, Maintenance, Community, and more.',
    target: '[data-tour="sidebar"]',
    position: 'right'
  },
  {
    id: 'kpi-cards',
    title: 'Dashboard Overview',
    description: 'Here you can track total properties, units, occupancy rate, and tenants.',
    target: '[data-tour="kpi-cards"]',
    position: 'bottom'
  },
  {
    id: 'get-started',
    title: 'Get Started',
    description: 'Start by adding your first property to unlock all features.',
    target: '[data-tour="get-started"]',
    position: 'top'
  }
];

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check if user has already seen the tour
    const tourCompleted = localStorage.getItem('proptrack_tour_completed');
    if (!tourCompleted) {
      // Small delay before showing tour
      setTimeout(() => {
        setIsActive(true);
      }, 1000);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  useEffect(() => {
    if (isActive && TOUR_STEPS[currentStep]) {
      updateHighlight();
      window.addEventListener('resize', updateHighlight);
      return () => window.removeEventListener('resize', updateHighlight);
    }
  }, [isActive, currentStep]);

  const updateHighlight = () => {
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);

      // Calculate tooltip position based on preferred position
      const tooltipWidth = window.innerWidth < 640 ? 320 : 380; // Smaller on mobile
      const tooltipHeight = 200;
      const padding = window.innerWidth < 640 ? 10 : 20; // Less padding on mobile

      let x = 0;
      let y = 0;

      switch (step.position) {
        case 'right':
          // On mobile, show bottom instead
          if (window.innerWidth < 1024) {
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.bottom + padding;
          } else {
            x = rect.right + padding;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
          }
          break;
        case 'left':
          // On mobile, show bottom instead
          if (window.innerWidth < 1024) {
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.bottom + padding;
          } else {
            x = rect.left - tooltipWidth - padding;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
          }
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.bottom + padding;
          break;
        case 'top':
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.top - tooltipHeight - padding;
          break;
        default:
          x = rect.right + padding;
          y = rect.top;
      }

      // Keep tooltip within viewport
      x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10));
      y = Math.max(10, Math.min(y, window.innerHeight - tooltipHeight - 10));

      setTooltipPosition({ x, y });
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    setHasSeenTour(true);
    localStorage.setItem('proptrack_tour_completed', 'true');
  };

  const skipTour = () => {
    completeTour();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const step = TOUR_STEPS[currentStep];

  if (hasSeenTour && !isActive) {
    // Show small restart button
    return (
      <button
        onClick={restartTour}
        className="fixed bottom-6 right-6 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-accent transition-all z-50 group"
        title="Restart tour"
      >
        <Lightbulb className="w-5 h-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-foreground">
          Need help? Restart tour
        </span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      {isActive && step && (
        <>
          {/* Darkened Overlay with Spotlight Cutout */}
          <div className="fixed inset-0 z-[100] pointer-events-none">
            <svg className="w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {highlightRect && (
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      x={highlightRect.x - 8}
                      y={highlightRect.y - 8}
                      width={highlightRect.width + 16}
                      height={highlightRect.height + 16}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.7)"
                mask="url(#spotlight-mask)"
              />
            </svg>
          </div>

          {/* Highlighted Element Border */}
          {highlightRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed z-[101] pointer-events-none"
              style={{
                left: highlightRect.x - 8,
                top: highlightRect.y - 8,
                width: highlightRect.width + 16,
                height: highlightRect.height + 16,
              }}
            >
              <div className="w-full h-full rounded-xl border-4 border-primary shadow-[0_0_0_4px_rgba(132,204,22,0.3)] animate-pulse" />
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[102] w-[320px] sm:w-[380px]"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl p-5 relative">
              {/* Arrow pointer - hide on mobile for right/left positioned tooltips */}
              {step.position === 'right' && highlightRect && window.innerWidth >= 1024 && (
                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-primary/30 hidden lg:block" />
              )}
              {step.position === 'left' && highlightRect && window.innerWidth >= 1024 && (
                <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[12px] border-l-primary/30 hidden lg:block" />
              )}
              {step.position === 'bottom' && highlightRect && (
                <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-primary/30" />
              )}
              {step.position === 'top' && highlightRect && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-primary/30" />
              )}

              {/* Close button */}
              <button
                onClick={skipTour}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-4">
                {TOUR_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-primary w-8'
                        : index < currentStep
                        ? 'bg-primary/50 w-1.5'
                        : 'bg-muted w-1.5'
                    }`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-auto">
                  {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    size="sm"
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={skipTour}
                  size="sm"
                  className="ml-auto"
                >
                  Skip Tour
                </Button>
                <GradientButton onClick={handleNext} size="sm" className="gap-1">
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    'Finish'
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </GradientButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}