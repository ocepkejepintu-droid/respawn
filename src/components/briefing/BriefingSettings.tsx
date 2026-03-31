"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeRange, type BriefingSettings as BriefingSettingsType } from "@/types/briefing";
import {
  Settings,
  Bell,
  Mail,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  Zap,
  Save,
} from "lucide-react";

interface BriefingSettingsProps {
  settings: BriefingSettingsType | null;
  onSave: (settings: Partial<BriefingSettingsType>) => void;
  isLoading?: boolean;
  className?: string;
}

export function BriefingSettings({
  settings,
  onSave,
  isLoading = false,
  className,
}: BriefingSettingsProps) {
  const [localSettings, setLocalSettings] = React.useState<Partial<BriefingSettingsType>>({
    isEnabled: true,
    deliveryTime: "08:00",
    timezone: "UTC",
    timeRange: TimeRange.LAST_24H,
    emailDelivery: true,
    inAppNotifications: true,
    alertPreferences: {
      hashtagTrending: true,
      hashtagDeclining: true,
      competitorPost: true,
      engagementSpike: true,
      sentimentShift: false,
      newContentFormat: false,
      viralContent: true,
      mentionAlert: true,
    },
    thresholds: {
      hashtagVelocityThreshold: 50,
      competitorPostThreshold: 1,
      engagementSpikeThreshold: 75,
      sentimentShiftThreshold: 0.3,
      viralContentThreshold: 10,
    },
    platforms: ["INSTAGRAM"],
    ...settings,
  });

  const handleSave = () => {
    onSave(localSettings);
  };

  const updateAlertPreference = (key: keyof NonNullable<typeof localSettings.alertPreferences>, value: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      alertPreferences: {
        ...prev.alertPreferences,
        [key]: value,
      },
    }));
  };

  const updateThreshold = (key: keyof NonNullable<typeof localSettings.thresholds>, value: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value,
      },
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Briefing Settings</CardTitle>
        </div>
        <CardDescription>
          Customize your morning briefing preferences and alert thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Morning Briefing</Label>
            <p className="text-sm text-neutral-500">
              Receive daily briefings with trends and insights
            </p>
          </div>
          <Switch
            checked={localSettings.isEnabled}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, isEnabled: checked }))
            }
          />
        </div>

        {localSettings.isEnabled && (
          <>
            {/* Delivery Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                Delivery Settings
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Delivery Time
                  </Label>
                  <Input
                    id="deliveryTime"
                    type="time"
                    value={localSettings.deliveryTime}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        deliveryTime: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={localSettings.timezone}
                    onValueChange={(value) =>
                      setLocalSettings((prev) => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeRange">Analysis Period</Label>
                <Select
                  value={localSettings.timeRange}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      timeRange: value as TimeRange,
                    }))
                  }
                >
                  <SelectTrigger id="timeRange">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TimeRange.LAST_24H}>Last 24 hours</SelectItem>
                    <SelectItem value={TimeRange.LAST_7D}>Last 7 days</SelectItem>
                    <SelectItem value={TimeRange.LAST_30D}>Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-neutral-500" />
                  <Switch
                    checked={localSettings.emailDelivery}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        emailDelivery: checked,
                      }))
                    }
                  />
                  <Label>Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-neutral-500" />
                  <Switch
                    checked={localSettings.inAppNotifications}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        inAppNotifications: checked,
                      }))
                    }
                  />
                  <Label>In-app</Label>
                </div>
              </div>
            </div>

            {/* Alert Preferences */}
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                Alert Types
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <AlertToggle
                  icon={TrendingUp}
                  iconClass="rotate-0"
                  label="Trending Hashtags"
                  description="Get notified when hashtags start trending"
                  checked={localSettings.alertPreferences?.hashtagTrending}
                  onCheckedChange={(checked) =>
                    updateAlertPreference("hashtagTrending", checked)
                  }
                />
                <AlertToggle
                  icon={TrendingUp}
                  iconClass="rotate-180"
                  label="Declining Hashtags"
                  description="Track when hashtags lose momentum"
                  checked={localSettings.alertPreferences?.hashtagDeclining}
                  onCheckedChange={(checked) =>
                    updateAlertPreference("hashtagDeclining", checked)
                  }
                />
                <AlertToggle
                  icon={Users}
                  label="Competitor Posts"
                  description="New posts from tracked competitors"
                  checked={localSettings.alertPreferences?.competitorPost}
                  onCheckedChange={(checked) =>
                    updateAlertPreference("competitorPost", checked)
                  }
                />
                <AlertToggle
                  icon={Zap}
                  label="Engagement Spikes"
                  description="Unusual engagement rate increases"
                  checked={localSettings.alertPreferences?.engagementSpike}
                  onCheckedChange={(checked) =>
                    updateAlertPreference("engagementSpike", checked)
                  }
                />
                <AlertToggle
                  icon={MessageSquare}
                  label="Sentiment Shifts"
                  description="Changes in comment sentiment"
                  checked={localSettings.alertPreferences?.sentimentShift}
                  onCheckedChange={(checked) =>
                    updateAlertPreference("sentimentShift", checked)
                  }
                />
                <AlertToggle
                  icon={FileText}
                  label="New Content Formats"
                  description="Emerging content types in your niche"
                  checked={localSettings.alertPreferences?.newContentFormat}
                  onCheckedChange={(checked) =>
                    updateAlertPreference("newContentFormat", checked)
                  }
                />
              </div>
            </div>

            {/* Thresholds */}
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-900 dark:text-white">
                Alert Thresholds
              </h3>
              
              <div className="space-y-4">
                <ThresholdSlider
                  label="Hashtag Velocity"
                  description="Minimum % change to trigger trending alert"
                  value={localSettings.thresholds?.hashtagVelocityThreshold || 50}
                  onChange={(value) => updateThreshold("hashtagVelocityThreshold", value)}
                  min={10}
                  max={200}
                  step={10}
                  unit="%"
                />
                <ThresholdSlider
                  label="Engagement Spike"
                  description="Minimum % increase for engagement alert"
                  value={localSettings.thresholds?.engagementSpikeThreshold || 75}
                  onChange={(value) => updateThreshold("engagementSpikeThreshold", value)}
                  min={25}
                  max={200}
                  step={25}
                  unit="%"
                />
                <ThresholdSlider
                  label="Viral Content"
                  description="Minimum engagement rate for viral alert"
                  value={localSettings.thresholds?.viralContentThreshold || 10}
                  onChange={(value) => updateThreshold("viralContentThreshold", value)}
                  min={5}
                  max={50}
                  step={1}
                  unit="%"
                />
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setLocalSettings(settings || {})}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertToggleProps {
  icon: React.ElementType;
  iconClass?: string;
  label: string;
  description: string;
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function AlertToggle({
  icon: Icon,
  iconClass,
  label,
  description,
  checked,
  onCheckedChange,
}: AlertToggleProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
        <Icon className={cn("h-4 w-4 text-primary-600 dark:text-primary-400", iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

interface ThresholdSliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

function ThresholdSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: ThresholdSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-medium">{label}</Label>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
        <Badge variant="secondary">
          {value}
          {unit}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

// Switch Component
function Switch({
  checked,
  onCheckedChange,
  className,
}: {
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary-500" : "bg-neutral-200 dark:bg-neutral-700",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
