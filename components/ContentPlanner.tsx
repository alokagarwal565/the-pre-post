import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Linkedin,
  Twitter,
  FileText,
  Calendar,
  Zap,
  MessageSquare,
  ArrowRight,
  Check,
  Loader2,
  Lightbulb,
  GitBranch,
} from "lucide-react";

type Platform = "linkedin" | "x" | "blog";

interface PlannerSuggestion {
  format: string;
  postingDay: string;
  hookStyle: string;
}

interface MindMapTree {
  coreIdea: string;
  supportingPoints: Array<{
    point: string;
    examples: string[];
  }>;
  cta?: string;
}

interface ContentPlannerProps {
  clarifiedIdea: string;
  mindMapTree?: MindMapTree | null;
  onPlatformSelect?: (platform: Platform) => void;
  onProceedToDraft?: (platform: Platform, suggestion: PlannerSuggestion) => void;
  isNavigating?: boolean;
}

const platformConfig = {
  linkedin: {
    icon: Linkedin,
    label: "LinkedIn",
    description: "Professional, thought leadership content",
    color: "bg-blue-600",
  },
  x: {
    icon: Twitter,
    label: "X (Twitter)",
    description: "Short, punchy, conversational",
    color: "bg-foreground",
  },
  blog: {
    icon: FileText,
    label: "Blog",
    description: "In-depth, SEO-friendly articles",
    color: "bg-orange-500",
  },
};

const suggestions: Record<Platform, PlannerSuggestion> = {
  linkedin: {
    format: "Hook + Story + Insight + CTA (8-12 lines)",
    postingDay: "Tuesday or Wednesday morning",
    hookStyle: "Question or bold statement",
  },
  x: {
    format: "Thread (5-7 tweets) or single tweet",
    postingDay: "Weekday afternoons (12-3 PM)",
    hookStyle: "Contrarian take or surprising stat",
  },
  blog: {
    format: "Long-form (1500-2500 words) with subheadings",
    postingDay: "Tuesday or Thursday",
    hookStyle: "Problem-solution or how-to headline",
  },
};

export function ContentPlanner({ clarifiedIdea, mindMapTree, onPlatformSelect, onProceedToDraft, isNavigating }: ContentPlannerProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [step, setStep] = useState(1);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    onPlatformSelect?.(platform);
    setStep(2);
  };

  const currentSuggestion = selectedPlatform ? suggestions[selectedPlatform] : null;

  return (
    <div className="space-y-6 max-w-3xl w-full">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Progress value={step === 1 ? 50 : 100} className="flex-1" />
          <span className="text-sm text-muted-foreground">Step {step} of 2</span>
        </div>
      </div>

      {/* Clarified Idea Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle className="font-heading text-lg">Clarified Idea</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base bg-muted p-4 rounded-md">{clarifiedIdea}</p>
        </CardContent>
      </Card>

      {/* Mind Map Structure Card */}
      {mindMapTree && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <CardTitle className="font-heading text-lg">Mind Map Structure</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Core Idea */}
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium text-muted-foreground mb-1">Core Idea</p>
              <p className="text-base">{mindMapTree.coreIdea}</p>
            </div>
            
            {/* Supporting Points */}
            {mindMapTree.supportingPoints && mindMapTree.supportingPoints.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Supporting Points</p>
                <div className="space-y-2">
                  {mindMapTree.supportingPoints.map((point, index) => (
                    <div key={index} className="bg-muted/50 p-3 rounded-md border-l-2 border-primary/30">
                      <p className="text-sm font-medium">{point.point}</p>
                      {point.examples && point.examples.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {point.examples.map((example, exIdx) => (
                            <Badge key={exIdx} variant="secondary" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* CTA */}
            {mindMapTree.cta && (
              <div className="bg-primary/10 p-3 rounded-md">
                <p className="text-sm font-medium text-muted-foreground mb-1">Call to Action</p>
                <p className="text-sm">{mindMapTree.cta}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Choose Your Platform</CardTitle>
            <CardDescription>Select where you want to publish this content</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {(Object.entries(platformConfig) as [Platform, typeof platformConfig.linkedin][]).map(
              ([key, config]) => {
                const Icon = config.icon;
                return (
                  <Card
                    key={key}
                    className="cursor-pointer hover-elevate"
                    onClick={() => handlePlatformSelect(key)}
                    data-testid={`card-platform-${key}`}
                  >
                    <CardContent className="pt-6 text-center space-y-3">
                      <div
                        className={`w-12 h-12 mx-auto rounded-lg ${config.color} flex items-center justify-center`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-medium">{config.label}</h3>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </CardContent>
                  </Card>
                );
              }
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedPlatform && currentSuggestion && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${platformConfig[selectedPlatform].color} flex items-center justify-center`}
                  >
                    {(() => {
                      const Icon = platformConfig[selectedPlatform].icon;
                      return <Icon className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <CardTitle className="font-heading text-xl">
                      {platformConfig[selectedPlatform].label} Strategy
                    </CardTitle>
                    <CardDescription>AI-powered recommendations</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  data-testid="button-change-platform"
                >
                  Change
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="w-4 h-4 text-primary" />
                    Format
                  </div>
                  <p className="text-sm text-muted-foreground">{currentSuggestion.format}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    Best Time
                  </div>
                  <p className="text-sm text-muted-foreground">{currentSuggestion.postingDay}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Hook Style
                  </div>
                  <p className="text-sm text-muted-foreground">{currentSuggestion.hookStyle}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back">
              Back
            </Button>
            <Button
              onClick={() => onProceedToDraft?.(selectedPlatform, currentSuggestion)}
              disabled={isNavigating}
              data-testid="button-generate-draft"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Generate Draft
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

