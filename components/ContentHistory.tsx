import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface HistoryItem {
  id: string;
  idea: string;
  angle: string;
  platform: "linkedin" | "x" | "blog";
  createdAt: Date;
}

interface InsightItem {
  type: "warning" | "suggestion";
  message: string;
}

interface ContentHistoryProps {
  items: HistoryItem[];
  insights?: InsightItem[];
  onExport?: () => void;
}

const platformLabels = {
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  blog: "Blog",
};

export function ContentHistory({ items, insights, onExport }: ContentHistoryProps) {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [angleFilter, setAngleFilter] = useState<string>("all");

  const filteredItems = items.filter((item) => {
    if (platformFilter !== "all" && item.platform !== platformFilter) return false;
    if (angleFilter !== "all" && item.angle !== angleFilter) return false;
    return true;
  });

  const uniqueAngles = Array.from(new Set(items.map((item) => item.angle)));

  return (
    <div className="space-y-6 max-w-5xl w-full">
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-md ${
                  insight.type === "warning" ? "bg-destructive/10" : "bg-muted"
                }`}
              >
                {insight.type === "warning" && (
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                )}
                <span className="text-sm">{insight.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 flex-wrap">
          <CardTitle className="font-heading text-xl">Content History</CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-platform-filter">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="x">X (Twitter)</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
              </SelectContent>
            </Select>
            <Select value={angleFilter} onValueChange={setAngleFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-angle-filter">
                <SelectValue placeholder="Angle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Angles</SelectItem>
                {uniqueAngles.map((angle) => (
                  <SelectItem key={angle} value={angle}>
                    {angle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onExport} data-testid="button-export-history">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Idea</TableHead>
                <TableHead>Angle</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} data-testid={`row-history-${item.id}`}>
                  <TableCell className="max-w-[300px] truncate">{item.idea}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.angle}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{platformLabels[item.platform]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(item.createdAt, "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No content history found with the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
